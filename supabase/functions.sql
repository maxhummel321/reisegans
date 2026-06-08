-- =========================================================================
-- Travel Planner — SECURITY DEFINER helper functions + triggers.
-- Run AFTER schema.sql, BEFORE policies.sql.
--
-- The helpers bypass RLS (SECURITY DEFINER) so that policies on tp_trips and
-- tp_trip_companions can reference each other without infinite recursion.
-- =========================================================================

-- True if the current user is a companion of the given trip.
create or replace function public.tp_is_companion(p_trip_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.tp_trip_companions
    where trip_id = p_trip_id and user_id = auth.uid()
  );
$$;

-- True if the current user may edit the given trip (owner or editor).
create or replace function public.tp_can_edit_trip(p_trip_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.tp_trip_companions
    where trip_id = p_trip_id and user_id = auth.uid()
      and role in ('owner','editor')
  );
$$;

-- Photo visibility: destination photos are global; trip_spot photos follow
-- the companion rule of the owning spot's trip.
create or replace function public.tp_photo_visible(p_owner_type text, p_owner_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select case
    when p_owner_type = 'destination' then true
    when p_owner_type = 'trip_spot' then exists (
      select 1
      from public.tp_trip_spots s
      where s.id = p_owner_id
        and public.tp_is_companion(s.trip_id)
    )
    else false
  end;
$$;

-- May the current user write photos for this owner?
create or replace function public.tp_photo_editable(p_owner_type text, p_owner_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select case
    when p_owner_type = 'destination' then exists (
      select 1 from public.tp_destinations d
      where d.id = p_owner_id and d.created_by = auth.uid()
    )
    when p_owner_type = 'trip_spot' then exists (
      select 1 from public.tp_trip_spots s
      where s.id = p_owner_id and public.tp_can_edit_trip(s.trip_id)
    )
    else false
  end;
$$;

-- On trip insert, add the creator as owner companion (so RLS edit checks pass).
create or replace function public.tp_add_owner_companion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.tp_trip_companions (trip_id, user_id, role, added_by)
  values (new.id, new.created_by, 'owner', new.created_by)
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists tp_trips_owner_after_insert on public.tp_trips;
create trigger tp_trips_owner_after_insert
  after insert on public.tp_trips
  for each row execute function public.tp_add_owner_companion();

-- Refresh the denormalized countries cache on a trip whenever its spots change.
create or replace function public.tp_refresh_trip_countries()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trip uuid;
begin
  v_trip := coalesce(new.trip_id, old.trip_id);
  update public.tp_trips t set
    countries = (
      select coalesce(array_agg(distinct s.country_code), '{}')
      from public.tp_trip_spots s
      where s.trip_id = v_trip and s.country_code is not null
    ),
    updated_at = now()
  where t.id = v_trip;
  return null;
end;
$$;

drop trigger if exists tp_spots_refresh_countries on public.tp_trip_spots;
create trigger tp_spots_refresh_countries
  after insert or update of country_code or delete on public.tp_trip_spots
  for each row execute function public.tp_refresh_trip_countries();
