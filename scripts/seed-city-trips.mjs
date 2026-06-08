#!/usr/bin/env node
/**
 * Bulk-seed city trips with their top sights as spots.
 * Resolves each place via Google Places (New) Text Search, sets coords +
 * country_code (so the trip country derives via trigger), caches up to 4
 * photos per spot, and the first spot photo becomes the trip cover.
 */

import { createClient } from "@supabase/supabase-js";

const URL = "https://scjasqaczdmpgvrdfuon.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjamFzcWFjemRtcGd2cmRmdW9uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTgwMDY2OCwiZXhwIjoyMDk1Mzc2NjY4fQ.s_dXBDdoGLNaqPM-RMIMzznVB0qpni_uKjo0gaB_FXM";
const MAPS_KEY = "AIzaSyARMS7gY03BbP7S3_1YhTHAqkLXyAWElHg";
const CREATED_BY = "0380337e-5100-43ba-b10c-9c13854dcb4f"; // Max
const CREATED_BY_NAME = "Max";
const PHOTOS_PER_SPOT = 4;

const admin = createClient(URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// City -> top sights
const CITIES = {
  Neapel: ["Pompeji", "Castel dell'Ovo", "Spaccanapoli", "Napoli Sotterranea", "Museo Archeologico Nazionale Napoli"],
  Nizza: ["Promenade des Anglais", "Vieille Ville Nice", "Colline du Château Nice", "Place Massena", "Cours Saleya"],
  Marseille: ["Basilique Notre-Dame de la Garde", "Vieux-Port Marseille", "Le Panier Marseille", "Calanques National Park", "MuCEM"],
  Toulouse: ["Basilique Saint-Sernin", "Capitole de Toulouse", "Cite de l'espace", "Pont Neuf Toulouse", "Couvent des Jacobins"],
  Bordeaux: ["Place de la Bourse Bordeaux", "Miroir d'eau Bordeaux", "Cite du Vin", "Cathedrale Saint-Andre Bordeaux", "Grand Theatre de Bordeaux"],
  Paris: ["Eiffelturm", "Louvre", "Notre-Dame de Paris", "Sacre-Coeur Montmartre", "Arc de Triomphe"],
  Valencia: ["Ciudad de las Artes y las Ciencias", "La Lonja de la Seda", "Mercado Central Valencia", "Catedral de Valencia", "Barrio del Carmen Valencia"],
  Sevilla: ["Real Alcazar de Sevilla", "Catedral de Sevilla", "Plaza de Espana Sevilla", "Metropol Parasol", "Barrio Santa Cruz Sevilla"],
  Bilbao: ["Guggenheim Museum Bilbao", "Casco Viejo Bilbao", "Mercado de la Ribera", "Funicular de Artxanda", "Puente de Vizcaya"],
  Malaga: ["Alcazaba de Malaga", "Catedral de Malaga", "Museo Picasso Malaga", "Castillo de Gibralfaro", "Muelle Uno Malaga"],
  Porto: ["Livraria Lello", "Ribeira Porto", "Ponte Dom Luis I", "Torre dos Clerigos", "Palacio da Bolsa"],
  Faro: ["Cidade Velha Faro", "Se de Faro", "Praia de Faro", "Igreja do Carmo Faro", "Ria Formosa"],
  Danzig: ["Dlugi Targ Gdansk", "Zuraw Gdansk", "St. Mary's Church Gdansk", "Neptune's Fountain Gdansk", "Westerplatte"],
  Warschau: ["Altstadt Warschau", "Konigsschloss Warschau", "Lazienki Park", "Kulturpalast Warschau", "POLIN Museum"],
  Birmingham: ["Bullring Birmingham", "Birmingham Museum and Art Gallery", "Library of Birmingham", "Cadbury World", "Gas Street Basin"],
  Leeds: ["Royal Armouries Museum Leeds", "Leeds Art Gallery", "Kirkstall Abbey", "Trinity Leeds", "Leeds Corn Exchange"],
  Thessaloniki: ["Weisser Turm Thessaloniki", "Rotonda Thessaloniki", "Aristotelous Square", "Ano Poli Thessaloniki", "Archaeological Museum of Thessaloniki"],
  Marrakesh: ["Jemaa el-Fnaa", "Bahia Palace", "Koutoubia Mosque", "Jardin Majorelle", "Medina Marrakesh Souks"],
  Beirut: ["Pigeon Rocks Raouche", "National Museum of Beirut", "Mohammad Al-Amin Mosque", "Corniche Beirut", "Beirut Souks"],
};

async function textSearch(query) {
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": MAPS_KEY,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.location,places.addressComponents,places.photos",
    },
    body: JSON.stringify({ textQuery: query, languageCode: "de" }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return Array.isArray(data?.places) && data.places.length > 0 ? data.places[0] : null;
}

function extractCountry(addressComponents) {
  const c = (addressComponents ?? []).find((x) => (x.types ?? []).includes("country"));
  if (!c) return { name: null, code: null };
  return { name: c.longText ?? null, code: (c.shortText ?? "").toUpperCase() || null };
}

async function cachePhotos(ownerType, ownerId, photoNames) {
  let cached = 0;
  for (let i = 0; i < Math.min(photoNames.length, PHOTOS_PER_SPOT); i++) {
    const mediaUrl =
      "https://places.googleapis.com/v1/" + photoNames[i] +
      "/media?maxWidthPx=1200&key=" + MAPS_KEY + "&skipHttpRedirect=false";
    const r = await fetch(mediaUrl, { redirect: "follow", cache: "no-store" });
    if (!r.ok) continue;
    const ct = r.headers.get("content-type") || "image/jpeg";
    const bytes = Buffer.from(await r.arrayBuffer());
    const ext = ct.includes("png") ? "png" : "jpg";
    const path = ownerType + "/" + ownerId + "/" + i + "." + ext;
    const { error: upErr } = await admin.storage
      .from("tp-photos")
      .upload(path, bytes, { contentType: ct, upsert: true, cacheControl: "31536000" });
    if (upErr) continue;
    const { data: pub } = admin.storage.from("tp-photos").getPublicUrl(path);
    await admin.from("tp_photos").insert({
      owner_type: ownerType,
      owner_id: ownerId,
      storage_path: pub.publicUrl,
      source: "google",
      sort_order: i,
    });
    cached++;
  }
  return cached;
}

for (const [city, sights] of Object.entries(CITIES)) {
  // Create the trip
  const { data: trip, error: tErr } = await admin
    .from("tp_trips")
    .insert({
      title: city,
      meta: "Städtetrip nach " + city,
      categories: ["staedtetrip"],
      nights_min: 3,
      nights_max: 5,
      created_by: CREATED_BY,
      created_by_name: CREATED_BY_NAME,
    })
    .select("id")
    .single();
  if (tErr) {
    console.log("FAIL trip " + city + ": " + tErr.message);
    continue;
  }
  console.log("Trip: " + city);

  let order = 0;
  for (const sight of sights) {
    const place = await textSearch(sight + ", " + city);
    if (!place) {
      console.log("  ? not found: " + sight);
      continue;
    }
    const loc = place.location;
    const { name: country, code } = extractCountry(place.addressComponents);
    const photoNames = (place.photos ?? [])
      .map((p) => p.name)
      .filter((n) => typeof n === "string");

    const { data: spot, error: sErr } = await admin
      .from("tp_trip_spots")
      .insert({
        trip_id: trip.id,
        title: place.displayName?.text ?? sight,
        category: "activity",
        place_name: place.displayName?.text ?? sight,
        address: place.formattedAddress ?? null,
        lat: loc?.latitude ?? null,
        lng: loc?.longitude ?? null,
        google_place_id: place.id ?? null,
        country,
        country_code: code,
        sort_order: order++,
        created_by: CREATED_BY,
      })
      .select("id")
      .single();
    if (sErr) {
      console.log("  FAIL spot " + sight + ": " + sErr.message);
      continue;
    }
    const n = await cachePhotos("trip_spot", spot.id, photoNames);
    console.log("  + " + (place.displayName?.text ?? sight) + " (" + n + " Fotos)");
  }
}

console.log("\nFertig.");
