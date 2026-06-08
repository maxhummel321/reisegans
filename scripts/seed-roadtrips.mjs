#!/usr/bin/env node
/**
 * Seed curated road-trip / round-trip routes. Each trip gets ordered stops
 * (sort_order = route order), resolved via Google Places (New) Text Search,
 * with coords + country + up to 3 photos each.
 *
 * The Greece island-hopping trip already exists with "Naxos" — we append the
 * remaining islands to it instead of creating a duplicate.
 */

import { createClient } from "@supabase/supabase-js";

const URL = "https://scjasqaczdmpgvrdfuon.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjamFzcWFjemRtcGd2cmRmdW9uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTgwMDY2OCwiZXhwIjoyMDk1Mzc2NjY4fQ.s_dXBDdoGLNaqPM-RMIMzznVB0qpni_uKjo0gaB_FXM";
const MAPS_KEY = "AIzaSyARMS7gY03BbP7S3_1YhTHAqkLXyAWElHg";
const CREATED_BY = "0380337e-5100-43ba-b10c-9c13854dcb4f";
const CREATED_BY_NAME = "Max";
const PHOTOS = 3;

const GREECE_TRIP_ID = "28f97b56-b155-4b9e-9a3f-a15ea7b8944c";

const admin = createClient(URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Each: title, meta, categories, nights [min,max], stops[]
const TRIPS = [
  {
    title: "Südengland",
    meta: "Küsten, Kreidefelsen und Cottages im Süden Englands.",
    categories: ["roadtrip", "natur_wandern", "staedtetrip"],
    nights: [10, 14],
    stops: ["London", "Brighton", "Seven Sisters Cliffs", "Isle of Wight", "Stonehenge", "Bath England", "Cornwall St Ives", "Land's End"],
  },
  {
    title: "Baltikum",
    meta: "Tallinn, Riga, Vilnius — die drei baltischen Hauptstädte und mehr.",
    categories: ["roadtrip", "staedtetrip", "natur_wandern"],
    nights: [10, 14],
    stops: ["Tallinn", "Lahemaa National Park", "Pärnu", "Riga", "Gauja National Park", "Vilnius", "Trakai Castle", "Curonian Spit"],
  },
  {
    title: "Baskenland",
    meta: "Pintxos, Atlantikküste und grüne Berge zwischen Spanien und Frankreich.",
    categories: ["roadtrip", "kulinarik", "strandurlaub"],
    nights: [7, 10],
    stops: ["Bilbao", "San Sebastian", "Biarritz", "Bayonne", "Gaztelugatxe", "Vitoria-Gasteiz"],
  },
  {
    title: "Rumänien",
    meta: "Karpaten, Schlösser und mittelalterliche Städte in Transsilvanien.",
    categories: ["roadtrip", "natur_wandern", "staedtetrip"],
    nights: [10, 14],
    stops: ["Bukarest", "Schloss Peles Sinaia", "Schloss Bran", "Brasov", "Sighisoara", "Cluj-Napoca", "Transfagarasan"],
  },
  {
    title: "Bulgarien",
    meta: "Schwarzmeerküste, Gebirgsklöster und alte Städte.",
    categories: ["roadtrip", "strandurlaub", "natur_wandern"],
    nights: [9, 12],
    stops: ["Sofia", "Rilakloster", "Plowdiw", "Weliko Tarnowo", "Nessebar", "Warna", "Sonnenstrand"],
  },
  {
    title: "Apulien",
    meta: "Trulli, Adriaküste und Olivenhaine im Absatz des Stiefels.",
    categories: ["roadtrip", "strandurlaub", "kulinarik"],
    nights: [7, 10],
    stops: ["Bari", "Polignano a Mare", "Alberobello", "Ostuni", "Lecce", "Gallipoli", "Otranto"],
  },
  {
    title: "Kalabrien",
    meta: "Wilde Küsten und Bergdörfer an der Stiefelspitze Italiens.",
    categories: ["roadtrip", "strandurlaub", "natur_wandern"],
    nights: [7, 10],
    stops: ["Tropea", "Capo Vaticano", "Scilla", "Reggio Calabria", "Pizzo", "Aspromonte National Park"],
  },
  {
    title: "Sizilien",
    meta: "Vulkane, Tempel und Barockstädte rund um die größte Mittelmeerinsel.",
    categories: ["roadtrip", "strandurlaub", "kulinarik"],
    nights: [10, 14],
    stops: ["Palermo", "Cefalù", "Ätna", "Taormina", "Syrakus", "Noto", "Agrigento Valle dei Templi", "Trapani"],
  },
  {
    title: "Sardinien",
    meta: "Türkises Wasser, Granitküsten und Nuraghen.",
    categories: ["roadtrip", "strandurlaub", "natur_wandern"],
    nights: [9, 12],
    stops: ["Cagliari", "Villasimius", "Costa Smeralda", "La Maddalena", "Alghero", "Bosa", "Nuraghe Su Nuraxi"],
  },
  {
    title: "Korsika",
    meta: "Berge, die ins Meer stürzen — die Insel der Schönheit.",
    categories: ["roadtrip", "natur_wandern", "strandurlaub"],
    nights: [8, 12],
    stops: ["Ajaccio", "Bonifacio", "Porto-Vecchio", "Corte", "Calvi", "Cap Corse", "Calanche de Piana"],
  },
  {
    title: "Georgien",
    meta: "Kaukasus, Weinregion und Tbilissis Altstadt.",
    categories: ["roadtrip", "natur_wandern", "kulinarik"],
    nights: [10, 14],
    stops: ["Tiflis", "Mzcheta", "Kasbegi Gergeti", "Gudauri", "Signagi", "Kutaisi", "Batumi"],
  },
  {
    title: "Madeira",
    meta: "Levada-Wanderungen, Steilküsten und ewiger Frühling.",
    categories: ["roadtrip", "natur_wandern", "strandurlaub"],
    nights: [7, 10],
    stops: ["Funchal", "Cabo Girao", "Pico do Arieiro", "Santana", "Porto Moniz", "Ponta de Sao Lourenco", "Seixal Madeira"],
  },
  {
    title: "Côte d'Azur",
    meta: "Glamour, Buchten und Bergdörfer an der französischen Riviera.",
    categories: ["roadtrip", "strandurlaub", "staedtetrip"],
    nights: [7, 10],
    stops: ["Nizza", "Èze", "Monaco", "Antibes", "Cannes", "Saint-Tropez", "Gorges du Verdon"],
  },
  {
    title: "Andalusien & Südküste",
    meta: "Maurische Pracht, weiße Dörfer und die Costa del Sol.",
    categories: ["roadtrip", "staedtetrip", "strandurlaub"],
    nights: [10, 14],
    stops: ["Malaga", "Granada Alhambra", "Cordoba Mezquita", "Sevilla", "Ronda", "Nerja", "Marbella", "Cadiz"],
  },
];

// Islands to APPEND to the existing Greece trip (Naxos already present at 0)
const GREECE_APPEND = ["Paros", "Milos", "Santorini", "Ios", "Mykonos", "Folegandros", "Amorgos"];

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

function extractCountry(ac) {
  const c = (ac ?? []).find((x) => (x.types ?? []).includes("country"));
  if (!c) return { name: null, code: null };
  return { name: c.longText ?? null, code: (c.shortText ?? "").toUpperCase() || null };
}

async function cachePhotos(ownerId, photoNames) {
  let cached = 0;
  for (let i = 0; i < Math.min(photoNames.length, PHOTOS); i++) {
    const mediaUrl = "https://places.googleapis.com/v1/" + photoNames[i] +
      "/media?maxWidthPx=1200&key=" + MAPS_KEY + "&skipHttpRedirect=false";
    const r = await fetch(mediaUrl, { redirect: "follow", cache: "no-store" });
    if (!r.ok) continue;
    const ct = r.headers.get("content-type") || "image/jpeg";
    const bytes = Buffer.from(await r.arrayBuffer());
    const ext = ct.includes("png") ? "png" : "jpg";
    const path = "trip_spot/" + ownerId + "/" + i + "." + ext;
    const { error: upErr } = await admin.storage
      .from("tp-photos")
      .upload(path, bytes, { contentType: ct, upsert: true, cacheControl: "31536000" });
    if (upErr) continue;
    const { data: pub } = admin.storage.from("tp-photos").getPublicUrl(path);
    await admin.from("tp_photos").insert({
      owner_type: "trip_spot", owner_id: ownerId, storage_path: pub.publicUrl,
      source: "google", sort_order: i,
    });
    cached++;
  }
  return cached;
}

async function addStop(tripId, label, searchQuery, order) {
  const place = await textSearch(searchQuery);
  if (!place) {
    console.log("    ? not found: " + label);
    return;
  }
  const loc = place.location;
  const { name: country, code } = extractCountry(place.addressComponents);
  const photoNames = (place.photos ?? []).map((p) => p.name).filter((n) => typeof n === "string");
  const { data: spot, error } = await admin
    .from("tp_trip_spots")
    .insert({
      trip_id: tripId,
      title: label,
      category: "activity",
      place_name: place.displayName?.text ?? label,
      address: place.formattedAddress ?? null,
      lat: loc?.latitude ?? null,
      lng: loc?.longitude ?? null,
      google_place_id: place.id ?? null,
      country, country_code: code,
      sort_order: order,
      created_by: CREATED_BY,
    })
    .select("id")
    .single();
  if (error) {
    console.log("    FAIL " + label + ": " + error.message);
    return;
  }
  const n = await cachePhotos(spot.id, photoNames);
  console.log("    + " + label + " (" + n + " Fotos)");
}

// 1) New trips
for (const trip of TRIPS) {
  const { data: created, error } = await admin
    .from("tp_trips")
    .insert({
      title: trip.title,
      meta: trip.meta,
      categories: trip.categories,
      nights_min: trip.nights[0],
      nights_max: trip.nights[1],
      created_by: CREATED_BY,
      created_by_name: CREATED_BY_NAME,
    })
    .select("id")
    .single();
  if (error) {
    console.log("FAIL trip " + trip.title + ": " + error.message);
    continue;
  }
  console.log("Trip: " + trip.title);
  let order = 0;
  for (const stop of trip.stops) {
    await addStop(created.id, stop, stop, order++);
  }
}

// 2) Append remaining Greek islands to the existing trip
console.log("Griechenland Inselhopping (append):");
for (let i = 0; i < GREECE_APPEND.length; i++) {
  const island = GREECE_APPEND[i];
  await addStop(GREECE_TRIP_ID, island, island + ", Greece", i + 1); // Naxos is 0
}

console.log("\nFertig.");
