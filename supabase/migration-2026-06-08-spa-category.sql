-- Extend the allowed spot categories with 'spa' (wellness/spa hotel etc.)

alter table public.tp_trip_spots drop constraint if exists tp_trip_spots_category_check;
alter table public.tp_trip_spots add constraint tp_trip_spots_category_check
  check (category in ('hotel','activity','beach','restaurant','viewpoint','transport','spa','other'));

alter table public.tp_destinations drop constraint if exists tp_destinations_category_check;
alter table public.tp_destinations add constraint tp_destinations_category_check
  check (category in ('hotel','activity','beach','restaurant','viewpoint','transport','spa','other'));
