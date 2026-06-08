# Ferngänse (Travel Planner) — Setup & Übergabe

Eigenständige Next.js-App, die sich **dasselbe Supabase-Projekt** mit Gänsemünchen teilt.
Code ist fertig und baut (`npm run build` grün). Was du noch selbst tun musst:

## 1. Datenbank (Supabase SQL-Editor) — PFLICHT

Im geteilten Supabase-Projekt (`scjasqaczdmpgvrdfuon`) im SQL-Editor in dieser Reihenfolge ausführen:

1. `supabase/schema.sql`
2. `supabase/functions.sql`
3. `supabase/policies.sql`

## 2. Storage-Bucket — PFLICHT

Supabase → Storage → neuen **public** Bucket **`tp-photos`** anlegen.

## 3. RLS verifizieren (Task 2.4) — EMPFOHLEN

Mit zwei Test-Usern prüfen (siehe `supabase/README.md`):
- Nicht-Companion sieht fremden Trip nicht (auch nicht den Titel).
- Companion sieht; nur owner/editor darf schreiben.
- Trip-Ersteller wird automatisch owner.

## 4. Lokal starten

```
cd travel-planner
npm install      # bereits erledigt
npm run dev
```

`.env.local` ist bereits mit den geteilten Supabase-Keys + dem Google-Maps-Browser-Key befüllt.

### Optional, aber empfohlen
Für das Multi-Foto-Caching brauchst du einen **server-seitigen** Google-Maps-Key
ohne Referrer-Restriction in `.env.local`:

```
GOOGLE_MAPS_SERVER_KEY=...
```

Fehlt er, fällt der Foto-Cache auf den Browser-Key zurück (funktioniert meist,
ist aber nicht ideal). Außerdem muss die **Places API (New)** im Google-Cloud-
Projekt aktiviert sein, sonst kommen keine Fotos.

## 5. Deployment (Task 16) — PFLICHT für Live

Eigenes **Vercel-Projekt** anlegen mit Root = `travel-planner/` und denselben
Env-Variablen wie lokal (Supabase URL/anon/service-role, Google-Maps-Keys).
Danach in Google Cloud die neue Vercel-Domain zu den erlaubten HTTP-Referrern
des Browser-Maps-Keys hinzufügen.

> Hinweis: Die App liegt aktuell als Unterordner im Gänsemünchen-Repo. Für ein
> sauberes eigenes Deployment kannst du `travel-planner/` in ein eigenes Git-Repo
> verschieben — sie ist vollständig eigenständig (eigene package.json/config).

## Offene Punkte / v2+
- Push-Benachrichtigungen (bewusst nicht in v1).
- Offline-Schreibzugriff (v1 nur Lesen offline).
- Echte Straßenrouten (Directions API) statt Polyline.
- Name „Ferngänse" ist ein Arbeitstitel — jederzeit änderbar (Layout-Metadaten,
  Manifest, Login-Header).
