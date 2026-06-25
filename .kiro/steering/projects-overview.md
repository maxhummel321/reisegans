# Projekt-Kontext (für Kiro automatisch geladen)

Dieser Workspace enthält **zwei** zusammengehörige Apps, die sich **dasselbe
Supabase-Projekt** teilen. Wenn du (Kiro) hier neu startest, ist das dein
vollständiger Kontext.

## Rollenmodell
Der Nutzer ist Product Owner / "Vibe Coder", kein Programmierer. Du schreibst
den Code. Erklär in einfacher Sprache, was du tust und warum, bevor du es tust.
Beweise, dass es läuft (Build/Test), behaupte es nicht nur. Commit + Push an
jedem funktionierenden Punkt. Antworten auf Deutsch, locker, bayerisch
angehaucht ("Servus").

## App 1 — Gänsemünchen (bestehend, live)
- **Was:** Private Freundeskreis-PWA zum Sammeln von München-Spots (Restaurants,
  Bars, Aktivitäten, Konzerte) mit Reaktionen ("I'm in"/"Boring"), Karte,
  Date-Modus, Kommentaren, Push-Notifications.
- **Ort:** Repo-Root dieses Workspaces (`./app`, `./components`, `./lib`, …).
- **Stack:** Next.js 14 (App Router) · Supabase · Google Maps/Places · Web Push · Vercel.
- **GitHub:** https://github.com/maxhummel321/muenchengans
  (⚠️ Git-Remote heißt `main`, nicht `origin` → `git push main main`)
- **Live:** https://muenchengans3.vercel.app
- **Maskottchen:** handgezeichnete Gänse-PNGs in `public/geese/`.

## App 2 — Reisegans / "Ferngänse" (neu, live)
- **Was:** Reiseplanungs-PWA. Globale Reiseideen-Wishlist + kuratierte Trips
  (Rundreisen, Städtetrips) mit Stationen, Karten-Route, Bewertung, Companions.
- **Ort:** **Eigener Ordner `reisegans/` neben Gänsemünchen** (also
  `…/Apps/reisegans`, NICHT mehr Unterordner). Eigenes, eigenständiges Projekt
  mit eigener package.json/config und **eigenem Git-Repo**.
  ⚠️ Diesen Ordner separat in Kiro öffnen / zum Workspace hinzufügen.
- **Stack:** identisch zu Gänsemünchen (Next.js 14 / Supabase / Google Maps / Vercel),
  ohne Push (v1).
- **GitHub:** https://github.com/maxhummel321/reisegans (Remote heißt `origin`)
- **Live:** https://reisegans.vercel.app
- **Spec:** `.kiro/specs/travel-planner/` (requirements.md, design.md, tasks.md)
- **Maskottchen:** eine Reise-Gans mit Rucksack+Sonnenbrille (`components/Mascot.tsx`, Inline-SVG).
- **Navigation:** 3 Bereiche — Rundreisen, Städtetrips (beide aus `tp_trips`,
  getrennt über die Kategorie `staedtetrip`), Wellness (aus `tp_destinations`).

## Geteiltes Supabase-Projekt
- **Project-Ref:** `scjasqaczdmpgvrdfuon` (URL: https://scjasqaczdmpgvrdfuon.supabase.co)
- **Geteilt von beiden Apps:** Auth (`auth.users`), `profiles`, `invitations`
  (Allowlist + DB-Trigger auf auth.users insert). EIN Login gilt für beide Apps.
- **Gänsemünchen-Tabellen:** `spots`, `reactions`, `comments`, `push_subscriptions`,
  `spot_photos`.
- **Reisegans-Tabellen (Präfix `tp_`):** `tp_destinations`, `tp_trips`,
  `tp_trip_spots`, `tp_trip_companions`, `tp_ratings`, `tp_photos`.
- **Storage-Buckets (public):** `avatars`, `spot-photos` (Gänsemünchen),
  `tp-photos` (Reisegans).
- **RLS:** Trips & alles darunter nur für Companions sichtbar; Destinations global
  lesbar. Helper-Funktionen `tp_is_companion`, `tp_can_edit_trip` sind
  SECURITY DEFINER (umgehen RLS, verhindern Rekursion). Der Owner-Trigger auf
  `tp_trips` setzt `row_security=off` für seinen Insert (sonst Henne-Ei-Deadlock).

## Secrets / Env
- Liegen in `.env.local` (Root) und `travel-planner/.env.local` — **gitignored**,
  syncen über OneDrive. Werte stammen aus: Supabase-Dashboard (URL/anon/service-role),
  Google Cloud (2 Maps-Keys: Browser-Key referrer-restricted, Server-Key nur
  Places API New), Web-Push VAPID (nur Gänsemünchen).
- **Wichtig:** Foto-Caching läuft IMMER über den **Server-Key** (`GOOGLE_MAPS_SERVER_KEY`),
  nie über den Browser-Key (der ist referrer-restricted und scheitert serverseitig).
  Fotos werden in Storage gecacht und von dort ausgeliefert, nie direkt von Google.

## Konventionen
- Build immer mit `npm run build` (bzw. `npx next build`) prüfen, bevor du pushst.
- DB-Änderungen: SQL-Migration in `supabase/` schreiben, dem Nutzer per
  Zwischenablage (`pbcopy < datei.sql`) zum Ausführen im Supabase SQL-Editor geben.
  Du hast KEINEN direkten SQL-Zugang über die REST-API; Service-Role-Key erlaubt
  aber Tabellen-CRUD + Storage + admin.auth (nützlich für Seed-/Verify-Skripte in
  `travel-planner/scripts/`).
- Seed-/Wartungs-Skripte als `*.mjs` in `scripts/`, mit `node scripts/x.mjs` laufen lassen.
  (Reisegans-Skripte liegen in `reisegans/scripts/`.)
- ESLint-Regeln `react/no-unescaped-entities` und `@next/next/no-img-element` sind
  in travel-planner bewusst aus (deutsche Apostrophe, externe Bild-URLs).

## Handover
Siehe `HANDOVER.md` (Geräte-Wechsel) und `DECISIONS.md` (Architektur-Entscheidungen)
im Root. Reisegans-Setup-Details in `reisegans/SETUP.md`.
