-- Add a category column to tp_destinations, reusing the same enum-style
-- list as tp_trip_spots so an idea can later become a trip spot 1:1.

alter table public.tp_destinations
  add column if not exists category text not null default 'other'
    check (category in ('hotel','activity','beach','restaurant','viewpoint','transport','other'));

create index if not exists tp_destinations_category_idx
  on public.tp_destinations (category);
