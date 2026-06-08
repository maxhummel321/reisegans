// Shared domain types for Travel Planner.
// profiles is the SAME table as Gänsemünchen (shared Supabase project).

export type Profile = {
  id: string;
  email: string;
  display_name: string | null;
  emoji: string | null;
  avatar_url: string | null;
  created_at?: string;
};

export type TripCategory =
  | "strandurlaub"
  | "aktivurlaub"
  | "spa_wellness"
  | "staedtetrip"
  | "roadtrip"
  | "natur_wandern"
  | "kulinarik"
  | "winter_ski";

export type TripSpotCategory =
  | "hotel"
  | "activity"
  | "beach"
  | "restaurant"
  | "viewpoint"
  | "transport"
  | "other";

export type CompanionRole = "owner" | "editor" | "viewer";

export type RatingTargetType = "trip" | "destination";

export type PhotoOwnerType = "destination" | "trip_spot";

export type Destination = {
  id: string;
  title: string;
  description: string | null;
  place_name: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  google_place_id: string | null;
  country: string | null;
  country_code: string | null;
  created_by: string;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
};

export type Trip = {
  id: string;
  title: string;
  meta: string | null;
  summary: string | null;
  description: string | null;
  categories: TripCategory[];
  nights_min: number | null;
  nights_max: number | null;
  countries: string[];
  cover_photo_ids: string[];
  created_by: string;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
};

export type TripSpot = {
  id: string;
  trip_id: string;
  title: string;
  note: string | null;
  category: TripSpotCategory;
  place_name: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  google_place_id: string | null;
  country: string | null;
  country_code: string | null;
  sort_order: number;
  source_destination_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type TripCompanion = {
  trip_id: string;
  user_id: string;
  role: CompanionRole;
  added_by: string | null;
  created_at: string;
};

export type Rating = {
  id: string;
  target_type: RatingTargetType;
  target_id: string;
  user_id: string;
  user_name: string | null;
  value: number | null; // 1..5 or null (comment-only)
  comment: string | null;
  created_at: string;
  updated_at: string;
};

export type Photo = {
  id: string;
  owner_type: PhotoOwnerType;
  owner_id: string;
  storage_path: string;
  source: string | null;
  sort_order: number;
  created_at: string;
};

// Convenience aggregate for list/detail views.
export type TripWithExtras = Trip & {
  spots?: TripSpot[];
  companions?: TripCompanion[];
  ratingAvg?: number | null;
  ratingCount?: number;
};
