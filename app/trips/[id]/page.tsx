import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TripDetail from "@/components/TripDetail";
import type {
  Destination,
  Photo,
  Profile,
  Rating,
  Trip,
  TripCompanion,
  TripSpot,
} from "@/lib/types";

export default async function TripDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/");

  // RLS: returns the trip only if the user is a companion (Req 8.3).
  const { data: trip } = await supabase
    .from("tp_trips")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();
  if (!trip) notFound();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userData.user.id)
    .single();

  const [{ data: spots }, { data: ratings }, { data: companions }, { data: profiles }, { data: wishlist }] =
    await Promise.all([
      supabase
        .from("tp_trip_spots")
        .select("*")
        .eq("trip_id", params.id)
        .order("sort_order", { ascending: true }),
      supabase.from("tp_ratings").select("*").eq("target_type", "trip").eq("target_id", params.id),
      supabase.from("tp_trip_companions").select("*").eq("trip_id", params.id),
      supabase.from("profiles").select("*"),
      supabase.from("tp_destinations").select("*").order("created_at", { ascending: false }),
    ]);

  const spotList = (spots ?? []) as TripSpot[];

  // Photos for the spots.
  const spotPhotos: Record<string, Photo[]> = {};
  const spotIds = spotList.map((s) => s.id);
  if (spotIds.length > 0) {
    const { data: photos } = await supabase
      .from("tp_photos")
      .select("*")
      .eq("owner_type", "trip_spot")
      .in("owner_id", spotIds)
      .order("sort_order", { ascending: true });
    for (const p of (photos ?? []) as Photo[]) {
      (spotPhotos[p.owner_id] ??= []).push(p);
    }
  }

  const comps = (companions ?? []) as TripCompanion[];
  const myComp = comps.find((c) => c.user_id === userData.user!.id);
  const canEdit = myComp?.role === "owner" || myComp?.role === "editor";

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
    <TripDetail
      trip={trip as Trip}
      initialSpots={spotList}
      spotPhotos={spotPhotos}
      initialRatings={(ratings ?? []) as Rating[]}
      initialCompanions={comps}
      allProfiles={(profiles ?? []) as Profile[]}
      wishlist={(wishlist ?? []) as Destination[]}
      me={me}
      canEdit={canEdit}
    />
  );
}
