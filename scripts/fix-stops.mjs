import { createClient } from "@supabase/supabase-js";

const URL = "https://scjasqaczdmpgvrdfuon.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjamFzcWFjemRtcGd2cmRmdW9uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTgwMDY2OCwiZXhwIjoyMDk1Mzc2NjY4fQ.s_dXBDdoGLNaqPM-RMIMzznVB0qpni_uKjo0gaB_FXM";
const MAPS_KEY = "AIzaSyARMS7gY03BbP7S3_1YhTHAqkLXyAWElHg";

const admin = createClient(URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

// title to find -> better query
const FIXES = [
  { title: "Costa Smeralda", query: "Costa Smeralda, Sardegna, Italia" },
  { title: "Santana", query: "Santana, Madeira, Portugal" },
];

async function textSearch(query) {
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": MAPS_KEY,
      "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,places.addressComponents,places.photos",
    },
    body: JSON.stringify({ textQuery: query, languageCode: "de" }),
  });
  if (!res.ok) return null;
  const d = await res.json();
  return Array.isArray(d?.places) && d.places.length > 0 ? d.places[0] : null;
}
function country(ac) {
  const c = (ac ?? []).find((x) => (x.types ?? []).includes("country"));
  return c ? { name: c.longText, code: (c.shortText ?? "").toUpperCase() } : { name: null, code: null };
}
async function cachePhotos(id, names) {
  // wipe old gallery first
  await admin.from("tp_photos").delete().eq("owner_type", "trip_spot").eq("owner_id", id);
  let n = 0;
  for (let i = 0; i < Math.min(names.length, 3); i++) {
    const u = "https://places.googleapis.com/v1/" + names[i] + "/media?maxWidthPx=1200&key=" + MAPS_KEY + "&skipHttpRedirect=false";
    const r = await fetch(u, { redirect: "follow", cache: "no-store" });
    if (!r.ok) continue;
    const ct = r.headers.get("content-type") || "image/jpeg";
    const bytes = Buffer.from(await r.arrayBuffer());
    const ext = ct.includes("png") ? "png" : "jpg";
    const path = "trip_spot/" + id + "/" + i + "." + ext;
    const { error } = await admin.storage.from("tp-photos").upload(path, bytes, { contentType: ct, upsert: true, cacheControl: "31536000" });
    if (error) continue;
    const { data: pub } = admin.storage.from("tp-photos").getPublicUrl(path);
    await admin.from("tp_photos").insert({ owner_type: "trip_spot", owner_id: id, storage_path: pub.publicUrl, source: "google", sort_order: i });
    n++;
  }
  return n;
}

for (const fix of FIXES) {
  const { data: spots } = await admin.from("tp_trip_spots").select("id,title,country_code").eq("title", fix.title);
  for (const spot of spots ?? []) {
    const place = await textSearch(fix.query);
    if (!place) { console.log("no result for " + fix.title); continue; }
    const loc = place.location;
    const { name, code } = country(place.addressComponents);
    const names = (place.photos ?? []).map((p) => p.name).filter((n) => typeof n === "string");
    await admin.from("tp_trip_spots").update({
      place_name: place.displayName?.text ?? fix.title,
      address: place.formattedAddress ?? null,
      lat: loc?.latitude ?? null,
      lng: loc?.longitude ?? null,
      google_place_id: place.id ?? null,
      country: name, country_code: code,
    }).eq("id", spot.id);
    const photos = await cachePhotos(spot.id, names);
    console.log("fixed " + fix.title + " -> " + code + " (" + photos + " Fotos)");
  }
}
console.log("done.");
