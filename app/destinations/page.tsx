import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DestinationsApp from "@/components/DestinationsApp";
import type { Destination, Photo, Profile } from "@/lib/types";

export default async function DestinationsPage() {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userData.user.id)
    .single();

  const { data: destinations } = await supabase
    .from("tp_destinations")
    .select("*")
    .order("created_at", { ascending: false });

  const list = (destinations ?? []) as Destination[];

  // Photos for these destinations.
  const ids = list.map((d) => d.id);
  let photosByOwner: Record<string, Photo[]> = {};
  if (ids.length > 0) {
    const { data: photos } = await supabase
      .from("tp_photos")
      .select("*")
      .eq("owner_type", "destination")
      .in("owner_id", ids)
      .order("sort_order", { ascending: true });
    for (const p of (photos ?? []) as Photo[]) {
      (photosByOwner[p.owner_id] ??= []).push(p);
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
    <DestinationsApp
      initialDestinations={list}
      photosByOwner={photosByOwner}
      me={me}
    />
  );
}
