#!/usr/bin/env node
/**
 * Bulk-seed wellness hotels as single Destinations (category 'spa').
 * Resolves each via Google Places (New) Text Search, grabs the official
 * website automatically, coords + country, and caches up to 4 photos.
 * price_per_night is left null (Google doesn't expose room rates).
 */

import { createClient } from "@supabase/supabase-js";

const URL = "https://scjasqaczdmpgvrdfuon.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjamFzcWFjemRtcGd2cmRmdW9uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTgwMDY2OCwiZXhwIjoyMDk1Mzc2NjY4fQ.s_dXBDdoGLNaqPM-RMIMzznVB0qpni_uKjo0gaB_FXM";
const MAPS_KEY = "AIzaSyARMS7gY03BbP7S3_1YhTHAqkLXyAWElHg";
const CREATED_BY = "0380337e-5100-43ba-b10c-9c13854dcb4f"; // Max
const CREATED_BY_NAME = "Max";
const PHOTOS = 4;

const admin = createClient(URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const HOTELS = [
  "Hotel der Engel, Grän",
  "Hotel Mohr, Lermoos",
  "Posthotel Achenkirch",
  "Hotel Kaiserhof, Ellmau",
  "Holzhotel Forsthofalm, Leogang",
  "Naturhotel Forsthofgut, Leogang",
  "Hotel Krallerhof, Leogang",
  "Sepp Alpine Boutique Hotel, Maria Alm",
  "Jufenalm Boho, Sonnberg",
  "Ortners Resort, Bad Füssing",
  "Wellnesshotel zum Bräu, Kollnburg",
  "Hotel Bayerwaldhof, Bad Kötzting",
];

async function textSearch(query) {
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": MAPS_KEY,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.location,places.addressComponents,places.photos,places.websiteUri",
    },
    body: JSON.stringify({ textQuery: query, languageCode: "de" }),
  });
  if (!res.ok) {
    console.log("  search HTTP " + res.status);
    return null;
  }
  const data = await res.json();
  return Array.isArray(data?.places) && data.places.length > 0 ? data.places[0] : null;
}

function extractCountry(addressComponents) {
  const c = (addressComponents ?? []).find((x) => (x.types ?? []).includes("country"));
  if (!c) return { name: null, code: null };
  return { name: c.longText ?? null, code: (c.shortText ?? "").toUpperCase() || null };
}

async function cachePhotos(ownerId, photoNames) {
  let cached = 0;
  for (let i = 0; i < Math.min(photoNames.length, PHOTOS); i++) {
    const mediaUrl =
      "https://places.googleapis.com/v1/" + photoNames[i] +
      "/media?maxWidthPx=1200&key=" + MAPS_KEY + "&skipHttpRedirect=false";
    const r = await fetch(mediaUrl, { redirect: "follow", cache: "no-store" });
    if (!r.ok) continue;
    const ct = r.headers.get("content-type") || "image/jpeg";
    const bytes = Buffer.from(await r.arrayBuffer());
    const ext = ct.includes("png") ? "png" : "jpg";
    const path = "destination/" + ownerId + "/" + i + "." + ext;
    const { error: upErr } = await admin.storage
      .from("tp-photos")
      .upload(path, bytes, { contentType: ct, upsert: true, cacheControl: "31536000" });
    if (upErr) continue;
    const { data: pub } = admin.storage.from("tp-photos").getPublicUrl(path);
    await admin.from("tp_photos").insert({
      owner_type: "destination",
      owner_id: ownerId,
      storage_path: pub.publicUrl,
      source: "google",
      sort_order: i,
    });
    cached++;
  }
  return cached;
}

for (const hotel of HOTELS) {
  const place = await textSearch(hotel);
  if (!place) {
    console.log("? not found: " + hotel);
    continue;
  }
  const loc = place.location;
  const { name: country, code } = extractCountry(place.addressComponents);
  const photoNames = (place.photos ?? []).map((p) => p.name).filter((n) => typeof n === "string");
  const displayName = place.displayName?.text ?? hotel;

  const { data: dest, error } = await admin
    .from("tp_destinations")
    .insert({
      title: displayName,
      category: "spa",
      website: place.websiteUri ?? null,
      place_name: displayName,
      address: place.formattedAddress ?? null,
      lat: loc?.latitude ?? null,
      lng: loc?.longitude ?? null,
      google_place_id: place.id ?? null,
      country,
      country_code: code,
      created_by: CREATED_BY,
      created_by_name: CREATED_BY_NAME,
    })
    .select("id")
    .single();
  if (error) {
    console.log("FAIL " + hotel + ": " + error.message);
    continue;
  }
  const n = await cachePhotos(dest.id, photoNames);
  console.log("+ " + displayName + " (" + n + " Fotos)" + (place.websiteUri ? " [web]" : ""));
}

console.log("\nFertig.");
