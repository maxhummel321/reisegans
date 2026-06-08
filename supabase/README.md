# Travel Planner — Supabase Setup

Diese App teilt sich **dasselbe Supabase-Projekt** mit Gänsemünchen
(`scjasqaczdmpgvrdfuon`). `profiles`, `invitations` und `auth.users` sind
bereits vorhanden und werden hier **nicht** neu angelegt.

## Ausführen (einmalig, im Supabase SQL-Editor, in dieser Reihenfolge)

1. `schema.sql` — Tabellen (`tp_*`), Indizes, CHECKs
2. `functions.sql` — SECURITY-DEFINER-Helper + Trigger
3. `policies.sql` — Row Level Security

## Storage-Bucket

Im Supabase-Dashboard → Storage einen **public** Bucket namens **`tp-photos`**
anlegen (analog zum `spot-photos`-Bucket von Gänsemünchen).

## RLS-Verifikation (empfohlen)

Mit zwei Test-Usern prüfen:
- Ein Nicht-Companion kann einen fremden Trip **nicht** lesen (auch nicht den Titel).
- Ein Companion liest den Trip; nur `owner`/`editor` darf schreiben.
- Der Ersteller eines Trips wird automatisch `owner` (Trigger).
- Destinations sind für alle Member lesbar.
