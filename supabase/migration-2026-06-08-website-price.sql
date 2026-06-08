-- Website link + average price per night (DZ) for destinations and trip spots.
-- price_per_night is a manual figure in EUR (Google does not expose room rates).

alter table public.tp_destinations
  add column if not exists website text,
  add column if not exists price_per_night integer;

alter table public.tp_trip_spots
  add column if not exists website text,
  add column if not exists price_per_night integer;
