-- =========================================================================
-- Travel Planner — Row Level Security policies.
-- Run AFTER schema.sql and functions.sql.
-- =========================================================================

-- 1) Destinations: global read, owner write -----------------------------------
alter table public.tp_destinations enable row level security;

drop policy if exists tp_dest_read on public.tp_destinations;
create policy tp_dest_read on public.tp_destinations
  for select to authenticated using (true);

drop policy if exists tp_dest_insert on public.tp_destinations;
create policy tp_dest_insert on public.tp_destinations
  for insert to authenticated with check (auth.uid() = created_by);

drop policy if exists tp_dest_update on public.tp_destinations;
create policy tp_dest_update on public.tp_destinations
  for update to authenticated using (auth.uid() = created_by);

drop policy if exists tp_dest_delete on public.tp_destinations;
create policy tp_dest_delete on public.tp_destinations
  for delete to authenticated using (auth.uid() = created_by);

-- 2) Trips: companions read, editors write ------------------------------------
alter table public.tp_trips enable row level security;

drop policy if exists tp_trips_read on public.tp_trips;
create policy tp_trips_read on public.tp_trips
  for select to authenticated using (public.tp_is_companion(id));

drop policy if exists tp_trips_insert on public.tp_trips;
create policy tp_trips_insert on public.tp_trips
  for insert to authenticated with check (auth.uid() = created_by);

drop policy if exists tp_trips_update on public.tp_trips;
create policy tp_trips_update on public.tp_trips
  for update to authenticated using (public.tp_can_edit_trip(id));

drop policy if exists tp_trips_delete on public.tp_trips;
create policy tp_trips_delete on public.tp_trips
  for delete to authenticated using (public.tp_can_edit_trip(id));

-- 3) Trip spots: companions read, editors write -------------------------------
alter table public.tp_trip_spots enable row level security;

drop policy if exists tp_spots_read on public.tp_trip_spots;
create policy tp_spots_read on public.tp_trip_spots
  for select to authenticated using (public.tp_is_companion(trip_id));

drop policy if exists tp_spots_write on public.tp_trip_spots;
create policy tp_spots_write on public.tp_trip_spots
  for all to authenticated
  using (public.tp_can_edit_trip(trip_id))
  with check (public.tp_can_edit_trip(trip_id));

-- 4) Companions: companions read, editors manage ------------------------------
alter table public.tp_trip_companions enable row level security;

drop policy if exists tp_comp_read on public.tp_trip_companions;
create policy tp_comp_read on public.tp_trip_companions
  for select to authenticated using (public.tp_is_companion(trip_id));

drop policy if exists tp_comp_write on public.tp_trip_companions;
create policy tp_comp_write on public.tp_trip_companions
  for all to authenticated
  using (public.tp_can_edit_trip(trip_id))
  with check (public.tp_can_edit_trip(trip_id));

-- 5) Ratings ------------------------------------------------------------------
-- Destination ratings: globally readable. Trip ratings: companions only.
alter table public.tp_ratings enable row level security;

drop policy if exists tp_ratings_read on public.tp_ratings;
create policy tp_ratings_read on public.tp_ratings
  for select to authenticated using (
    (target_type = 'destination')
    or (target_type = 'trip' and public.tp_is_companion(target_id))
  );

drop policy if exists tp_ratings_write on public.tp_ratings;
create policy tp_ratings_write on public.tp_ratings
  for all to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and (
      target_type = 'destination'
      or (target_type = 'trip' and public.tp_is_companion(target_id))
    )
  );

-- 6) Photos -------------------------------------------------------------------
alter table public.tp_photos enable row level security;

drop policy if exists tp_photos_read on public.tp_photos;
create policy tp_photos_read on public.tp_photos
  for select to authenticated
  using (public.tp_photo_visible(owner_type, owner_id));

drop policy if exists tp_photos_write on public.tp_photos;
create policy tp_photos_write on public.tp_photos
  for all to authenticated
  using (public.tp_photo_editable(owner_type, owner_id))
  with check (public.tp_photo_editable(owner_type, owner_id));
