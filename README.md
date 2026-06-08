# Ferngänse — Travel Planner

Reise-Planungs-PWA für den privaten Freundeskreis. Sammelt globale Reise-
Ideen (Wishlist) und kuratiert daraus Trips mit Spots, Karte mit Route,
abgestufter Bewertung und Companions pro Trip.

Teilt sich Auth + `profiles`/`invitations` mit der bestehenden Gänsemünchen-
App (gemeinsames Supabase-Projekt) — eine Einladung, beide Apps. Eigene
`tp_*`-Tabellen mit eigener RLS.

## Stack
- Next.js 14 (App Router) · React 18 · TypeScript
- Supabase (Auth, Postgres, Storage, Realtime)
- Google Maps + Places (New)
- Tailwind CSS · `@vis.gl/react-google-maps`

## Lokal starten
```
npm install
cp .env.local.example .env.local   # falls noch nicht vorhanden
npm run dev
```
Die Datei `.env.local` muss mit den geteilten Supabase-Keys + Maps-Keys
befüllt sein.

## Setup-Anleitung
Siehe `SETUP.md` für DB-Migrationen, Storage-Bucket, RLS-Verifikation
und Vercel-Deployment.

## Spec
Die fachliche und technische Spec liegt im Schwester-Repo Gänsemünchen
unter `.kiro/specs/travel-planner/`.
