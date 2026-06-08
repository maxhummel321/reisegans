-- =========================================================================
-- Travel Planner schema.
-- Shares the Supabase project with Gänsemünchen. profiles / invitations /
-- auth.users are SHARED and NOT redefined here. All new tables are prefixed
-- tp_ to avoid clashes in the shared public schema.
--
-- Run this once in the Supabase SQL Editor.
-- =========================================================================

-- Trip categories (referenced by CHECK as a list):
--   strandurlaub | aktivurlaub | spa_wellness | staedtetrip
--   roadtrip | natur_wandern | kulinarik | winter_ski

-- 1) Destinations (global wishlist) -------------------------------------------
create table if not exists public.tp_destinations (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  -- optional place reference
  place_name text,
  address text,
  lat double precision,
  lng double precision,
  google_place_id text,
  country text,
  country_code text,            -- ISO-3166-1 alpha-2
  category text not null default 'other'
    check (category in ('hotel','activity','beach','restaurant','viewpoint','transport','spa','other')),
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_by_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists tp_destinations_country_idx
  on public.tp_destinations (country_code);
create index if not exists tp_destinations_category_idx
  on public.tp_destinations (category);

-- 2) Trips --------------------------------------------------------------------
create table if not exists public.tp_trips (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  meta text,                    -- short teaser / subtitle
  summary text,                 -- longer prose
  description text,             -- optional short description
  categories text[] not null default '{}'
    check (categories <@ array[
      'strandurlaub','aktivurlaub','spa_wellness','staedtetrip',
      'roadtrip','natur_wandern','kulinarik','winter_ski']::text[]),
  nights_min smallint,
  nights_max smallint,
  countries text[] not null default '{}',      -- denormalized cache (derived)
  cover_photo_ids uuid[] not null default '{}',-- optional manual cover selection
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_by_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (nights_min is null or nights_max is null or nights_min <= nights_max)
);
create index if not exists tp_trips_countries_idx
  on public.tp_trips using gin (countries);
create index if not exists tp_trips_categories_idx
  on public.tp_trips using gin (categories);

-- 3) Trip spots ---------------------------------------------------------------
create table if not exists public.tp_trip_spots (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.tp_trips(id) on delete cascade,
  title text not null,
  note text,
  category text not null default 'activity'
    check (category in ('hotel','activity','beach','restaurant','viewpoint','transport','spa','other')),
  place_name text,
  address text,
  lat double precision,
  lng double precision,
  google_place_id text,
  country text,
  country_code text,
  sort_order integer not null default 0,        -- manual ordering + route
  source_destination_id uuid references public.tp_destinations(id) on delete set null,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists tp_trip_spots_trip_idx
  on public.tp_trip_spots (trip_id, sort_order);

-- 4) Companions (invitable per trip) ------------------------------------------
create table if not exists public.tp_trip_companions (
  trip_id uuid not null references public.tp_trips(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'editor' check (role in ('owner','editor','viewer')),
  added_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (trip_id, user_id)
);
create index if not exists tp_trip_companions_user_idx
  on public.tp_trip_companions (user_id);

-- 5) Ratings (polymorphic: trip OR destination) -------------------------------
create table if not exists public.tp_ratings (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('trip','destination')),
  target_id uuid not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  user_name text,
  value smallint check (value between 1 and 5),  -- NULL allowed = comment-only
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, target_type, target_id),
  -- a rating must carry at least a value or a comment
  check (value is not null or (comment is not null and length(btrim(comment)) > 0))
);
create index if not exists tp_ratings_target_idx
  on public.tp_ratings (target_type, target_id);

-- 6) Photos (multiple per destination / trip spot) ----------------------------
create table if not exists public.tp_photos (
  id uuid primary key default gen_random_uuid(),
  owner_type text not null check (owner_type in ('destination','trip_spot')),
  owner_id uuid not null,
  storage_path text not null,        -- path inside bucket tp-photos
  source text,                       -- 'google' | 'url' | 'upload'
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists tp_photos_owner_idx
  on public.tp_photos (owner_type, owner_id, sort_order);
