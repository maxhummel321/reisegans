import { NextResponse, type NextRequest } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createSdkClient } from "@supabase/supabase-js";

// POST /api/photos/cache
//   { ownerType: "destination" | "trip_spot", ownerId: string,
//     photoNames?: string[], googlePlaceId?: string }
//
// Fetches up to N Google Places photos (new Places API resource names, or a
// fresh lookup via place id) and uploads each into the public `tp-photos`
// bucket, recording one row per photo in tp_photos.

export const runtime = "nodejs";

const BUCKET = "tp-photos";
const MAX_PHOTOS = 6;

async function fetchNewPlacesPhotoBytes(
  photoName: string,
  key: string,
  maxWidthPx = 1200,
): Promise<{ bytes: Buffer; contentType: string } | null> {
  const url = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${maxWidthPx}&key=${key}&skipHttpRedirect=false`;
  const res = await fetch(url, { redirect: "follow", cache: "no-store" });
  if (!res.ok) return null;
  const ab = await res.arrayBuffer();
  return {
    bytes: Buffer.from(ab),
    contentType: res.headers.get("content-type") ?? "image/jpeg",
  };
}

async function lookupPhotoNames(placeId: string, key: string): Promise<string[]> {
  // New Places API: GET place with photos field mask.
  const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?fields=photos&key=${key}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return [];
  const data = (await res.json()) as any;
  const photos = Array.isArray(data?.photos) ? data.photos : [];
  return photos
    .map((p: any) => p?.name)
    .filter((n: any): n is string => typeof n === "string")
    .slice(0, MAX_PHOTOS);
}

export async function POST(request: NextRequest) {
  const userClient = createServerClient();
  const { data: userData } = await userClient.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    ownerType?: "destination" | "trip_spot";
    ownerId?: string;
    photoNames?: string[];
    googlePlaceId?: string;
  };
  const ownerType = body.ownerType;
  const ownerId = body.ownerId;
  if (!ownerType || !ownerId || (ownerType !== "destination" && ownerType !== "trip_spot")) {
    return NextResponse.json({ error: "missing owner" }, { status: 400 });
  }

  const browserKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const serverKey = process.env.GOOGLE_MAPS_SERVER_KEY ?? browserKey;
  if (!serverKey) {
    return NextResponse.json({ error: "no maps key" }, { status: 500 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "no service role" }, { status: 500 });
  }

  const admin = createSdkClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Skip if photos already cached for this owner.
  const { count } = await admin
    .from("tp_photos")
    .select("id", { count: "exact", head: true })
    .eq("owner_type", ownerType)
    .eq("owner_id", ownerId);
  if ((count ?? 0) > 0) {
    return NextResponse.json({ ok: true, cached: true, added: 0 });
  }

  let photoNames = (body.photoNames ?? []).slice(0, MAX_PHOTOS);
  if (photoNames.length === 0 && body.googlePlaceId) {
    photoNames = await lookupPhotoNames(body.googlePlaceId, serverKey);
  }
  if (photoNames.length === 0) {
    return NextResponse.json({ ok: false, reason: "no photo available", added: 0 });
  }

  let added = 0;
  for (let i = 0; i < photoNames.length; i++) {
    const img = await fetchNewPlacesPhotoBytes(photoNames[i], serverKey);
    if (!img) continue;
    const ext = img.contentType.includes("png") ? "png" : "jpg";
    const path = `${ownerType}/${ownerId}/${i}.${ext}`;
    const { error: upErr } = await admin.storage.from(BUCKET).upload(path, img.bytes, {
      contentType: img.contentType,
      upsert: true,
      cacheControl: "31536000",
    });
    if (upErr) continue;
    const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(path);
    const { error: insErr } = await admin.from("tp_photos").insert({
      owner_type: ownerType,
      owner_id: ownerId,
      storage_path: pub.publicUrl,
      source: "google",
      sort_order: i,
    });
    if (!insErr) added++;
  }

  if (added === 0) {
    return NextResponse.json({ ok: false, reason: "google fetch failed", added: 0 });
  }
  return NextResponse.json({ ok: true, added });
}
