import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TripsApp from "@/components/TripsApp";
import type { Photo, Profile, Trip, TripSpot } from "@/lib/types";

export default async function TripsPage() {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userData.user.id)
    .single();

  // RLS already scopes to companion trips.
  const { data: trips } = await supabase
    .from("tp_trips")
    .select("*")
    .order("updated_at", { ascending: false });

  const list = (trips ?? []) as Trip[];
  const tripIds = list.map((t) => t.id);

  // Build best-of covers: first photo of the first few spots of each trip.
  const coversByTrip: Record<string, string[]> = {};
  const countryNames: Record<string, string> = {};

  if (tripIds.length > 0) {
    const { data: spots } = await supabase
      .from("tp_trip_spots")
      .select("id, trip_id, sort_order, country, country_code")
      .in("trip_id", tripIds)
      .order("sort_order", { ascending: true });

    const spotList = (spots ?? []) as Pick<
      TripSpot,
      "id" | "trip_id" | "sort_order" | "country" | "country_code"
    >[];

    for (const s of spotList) {
      if (s.country_code && s.country) countryNames[s.country_code] = s.country;
    }

    const spotIds = spotList.map((s) => s.id);
    const photosBySpot: Record<string, string> = {};
    if (spotIds.length > 0) {
      const { data: photos } = await supabase
        .from("tp_photos")
        .select("owner_id, storage_path, sort_order")
        .eq("owner_type", "trip_spot")
        .in("owner_id", spotIds)
        .order("sort_order", { ascending: true });
      for (const p of (photos ?? []) as Pick<Photo, "owner_id" | "storage_path" | "sort_order">[]) {
        if (!photosBySpot[p.owner_id]) photosBySpot[p.owner_id] = p.storage_path;
      }
    }

    // first photo of first 4 spots per trip
    const seenPerTrip: Record<string, number> = {};
    for (const s of spotList) {
      const cover = (coversByTrip[s.trip_id] ??= []);
      if ((seenPerTrip[s.trip_id] ?? 0) >= 4) continue;
      const url = photosBySpot[s.id];
      if (url) {
        cover.push(url);
        seenPerTrip[s.trip_id] = (seenPerTrip[s.trip_id] ?? 0) + 1;
      }
    }
  }

  const me: Profile =
    (profile as Profile) ??
    ({
      id: userData.user.id,
      email: userData.user.email ?? "",
      display_name: null,
      emoji: null,
      avatar_url: null,
    } as Profile);

  return (
    <TripsApp
      initialTrips={list}
      coversByTrip={coversByTrip}
      countryNames={countryNames}
      me={me}
    />
  );
}
