"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type {
  Destination,
  Photo,
  Profile,
  Rating,
  Trip,
  TripCompanion,
  TripSpot,
} from "@/lib/types";
import { TRIP_CATEGORIES, TRIP_SPOT_CATEGORIES, formatDuration } from "@/lib/constants";
import { placeholderPhoto } from "@/lib/photos";
import { useToast } from "./Toaster";
import WorldMap, { type MapPoint } from "./WorldMap";
import TripCover from "./TripCover";
import RatingControl from "./RatingControl";
import AddTripSpotDialog from "./AddTripSpotDialog";
import AddTripDialog from "./AddTripDialog";
import { cacheTripOffline } from "@/lib/offline";

export default function TripDetail({
  trip: initialTrip,
  initialSpots,
  spotPhotos,
  initialRatings,
  initialCompanions,
  allProfiles,
  wishlist,
  me,
  canEdit,
}: {
  trip: Trip;
  initialSpots: TripSpot[];
  spotPhotos: Record<string, Photo[]>;
  initialRatings: Rating[];
  initialCompanions: TripCompanion[];
  allProfiles: Profile[];
  wishlist: Destination[];
  me: Profile;
  canEdit: boolean;
}) {
  const supabase = createClient();
  const { toast } = useToast();
  const router = useRouter();
  const [trip, setTrip] = useState(initialTrip);
  const [spots, setSpots] = useState<TripSpot[]>(initialSpots);
  const [companions, setCompanions] = useState<TripCompanion[]>(initialCompanions);
  const [showAddSpot, setShowAddSpot] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showCompanions, setShowCompanions] = useState(false);

  // Cache for offline reading (Req 9.2/9.3).
  useEffect(() => {
    cacheTripOffline(trip.id, { trip, spots, spotPhotos });
  }, [trip, spots, spotPhotos]);

  const mapPoints: MapPoint[] = useMemo(
    () =>
      spots
        .filter((s) => s.lat != null && s.lng != null)
        .map((s) => {
          const cat = TRIP_SPOT_CATEGORIES.find((c) => c.value === s.category);
          return {
            id: s.id,
            lat: s.lat!,
            lng: s.lng!,
            title: s.title,
            order: s.sort_order,
            pinColor: cat?.pinColor,
            pinGlyph: cat?.pinGlyph,
            glyph: cat?.emoji,
          };
        }),
    [spots],
  );

  const coverPhotos = useMemo(() => {
    const out: string[] = [];
    for (const s of spots) {
      const p = spotPhotos[s.id]?.[0]?.storage_path;
      if (p) out.push(p);
      if (out.length >= 4) break;
    }
    return out;
  }, [spots, spotPhotos]);

  async function refetchSpots() {
    const { data } = await supabase
      .from("tp_trip_spots")
      .select("*")
      .eq("trip_id", trip.id)
      .order("sort_order", { ascending: true });
    if (data) setSpots(data as TripSpot[]);
  }

  async function move(spotId: string, dir: -1 | 1) {
    const idx = spots.findIndex((s) => s.id === spotId);
    const swapIdx = idx + dir;
    if (idx < 0 || swapIdx < 0 || swapIdx >= spots.length) return;
    const reordered = [...spots];
    [reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]];
    // Reassign sort_order sequentially.
    const withOrder = reordered.map((s, i) => ({ ...s, sort_order: i }));
    setSpots(withOrder);
    // Persist the two changed rows.
    const a = withOrder[idx];
    const b = withOrder[swapIdx];
    await Promise.all([
      supabase.from("tp_trip_spots").update({ sort_order: a.sort_order }).eq("id", a.id),
      supabase.from("tp_trip_spots").update({ sort_order: b.sort_order }).eq("id", b.id),
    ]);
  }

  async function deleteSpot(spotId: string) {
    if (!confirm("Spot entfernen?")) return;
    const prev = spots;
    setSpots((p) => p.filter((s) => s.id !== spotId));
    const { error } = await supabase.from("tp_trip_spots").delete().eq("id", spotId);
    if (error) {
      setSpots(prev);
      toast(error.message, "error");
    }
  }

  async function deleteTrip() {
    if (!confirm("Diesen Trip mit allem löschen?")) return;
    const { error } = await supabase.from("tp_trips").delete().eq("id", trip.id);
    if (error) {
      toast(error.message, "error");
      return;
    }
    router.push("/trips");
  }

  const nextSortOrder = spots.length;

  return (
    <main className="min-h-svh max-w-3xl mx-auto px-4 sm:px-6 py-6">
      <button
        onClick={() => router.push("/trips")}
        className="text-sm text-ink/60 hover:text-ink mb-3"
      >
        ← Alle Trips
      </button>

      <TripCover photos={coverPhotos} className="h-52 w-full rounded-3xl mb-4" />

      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap gap-1 mb-1.5">
            {(trip.categories ?? []).map((c) => {
              const info = TRIP_CATEGORIES.find((x) => x.value === c);
              if (!info) return null;
              return (
                <span key={c} className={"text-[10px] rounded-full px-2 py-0.5 " + info.tint}>
                  {info.emoji} {info.label}
                </span>
              );
            })}
          </div>
          <h1 className="serif text-4xl leading-tight">{trip.title}</h1>
          {trip.meta && <p className="hand text-2xl text-ink/60 mt-1">{trip.meta}</p>}
        </div>
        {canEdit && (
          <div className="flex flex-col items-end gap-1 shrink-0">
            <button
              onClick={() => setShowEdit(true)}
              className="text-sm text-ink/60 hover:text-ink underline"
            >
              Bearbeiten
            </button>
            <button onClick={deleteTrip} className="text-xs text-rose/70 hover:text-rose">
              Löschen
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mt-2 text-sm text-ink/60">
        {formatDuration(trip.nights_min, trip.nights_max) && (
          <span>{formatDuration(trip.nights_min, trip.nights_max)}</span>
        )}
        {(trip.countries ?? []).length > 0 && (
          <span>· {(trip.countries ?? []).join(", ")}</span>
        )}
      </div>

      {trip.summary && (
        <p className="text-ink/80 mt-4 whitespace-pre-wrap leading-relaxed">{trip.summary}</p>
      )}

      {/* Map + route */}
      {mapPoints.length > 0 && (
        <div className="h-72 mt-5">
          <WorldMap points={mapPoints} showRoute className="w-full h-full" mapId={`trip-${trip.id}`} />
        </div>
      )}

      {/* Spots */}
      <section className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs uppercase tracking-[0.18em] text-ink/55">
            Spots {spots.length > 0 && <span className="text-ink/40">· {spots.length}</span>}
          </p>
          {canEdit && (
            <button
              onClick={() => setShowAddSpot(true)}
              className="tap rounded-full bg-ink text-cream px-3.5 py-1.5 text-sm font-medium hover:bg-terracotta transition"
            >
              + Spot
            </button>
          )}
        </div>

        {spots.length === 0 ? (
          <p className="text-sm text-ink/50">Noch keine Spots. Füg den ersten hinzu.</p>
        ) : (
          <ul className="space-y-2">
            {spots.map((s, i) => {
              const cat = TRIP_SPOT_CATEGORIES.find((c) => c.value === s.category);
              const photo = spotPhotos[s.id]?.[0]?.storage_path ?? null;
              return (
                <li
                  key={s.id}
                  className="flex items-center gap-3 bg-paper rounded-2xl border border-ink/5 shadow-soft p-2.5"
                >
                  <span className="w-7 h-7 rounded-full bg-sand grid place-items-center text-xs font-semibold shrink-0">
                    {i + 1}
                  </span>
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-sand shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo ?? placeholderPhoto()}
                      alt=""
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] text-ink/50">
                      {cat?.emoji} {cat?.label}
                      {s.country ? ` · ${s.country}` : ""}
                    </div>
                    <div className="font-medium truncate">{s.title}</div>
                    {s.note && <div className="text-xs text-ink/60 truncate">{s.note}</div>}
                  </div>
                  {canEdit && (
                    <div className="flex flex-col shrink-0">
                      <button
                        onClick={() => move(s.id, -1)}
                        disabled={i === 0}
                        className="text-ink/40 hover:text-ink disabled:opacity-20"
                        aria-label="Nach oben"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => move(s.id, 1)}
                        disabled={i === spots.length - 1}
                        className="text-ink/40 hover:text-ink disabled:opacity-20"
                        aria-label="Nach unten"
                      >
                        ▼
                      </button>
                    </div>
                  )}
                  {canEdit && (
                    <button
                      onClick={() => deleteSpot(s.id)}
                      className="text-rose/60 hover:text-rose text-sm shrink-0 px-1"
                      aria-label="Entfernen"
                    >
                      ✕
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Companions */}
      <section className="mt-6">
        <button
          onClick={() => setShowCompanions((v) => !v)}
          className="text-xs uppercase tracking-[0.18em] text-ink/55 hover:text-ink"
        >
          Mitreisende · {companions.length} {showCompanions ? "▲" : "▼"}
        </button>
        {showCompanions && (
          <CompanionManager
            tripId={trip.id}
            companions={companions}
            setCompanions={setCompanions}
            allProfiles={allProfiles}
            canEdit={canEdit}
            meId={me.id}
          />
        )}
      </section>

      {/* Ratings */}
      <RatingControl
        targetType="trip"
        targetId={trip.id}
        me={me}
        initialRatings={initialRatings}
      />

      {showAddSpot && (
        <AddTripSpotDialog
          tripId={trip.id}
          me={me}
          nextSortOrder={nextSortOrder}
          wishlist={wishlist}
          onClose={() => setShowAddSpot(false)}
          onCreated={() => {
            setShowAddSpot(false);
            refetchSpots();
            router.refresh();
          }}
        />
      )}

      {showEdit && (
        <AddTripDialog
          me={me}
          existing={trip}
          onClose={() => setShowEdit(false)}
          onSaved={() => {
            setShowEdit(false);
            router.refresh();
          }}
        />
      )}
    </main>
  );
}

function CompanionManager({
  tripId,
  companions,
  setCompanions,
  allProfiles,
  canEdit,
  meId,
}: {
  tripId: string;
  companions: TripCompanion[];
  setCompanions: React.Dispatch<React.SetStateAction<TripCompanion[]>>;
  allProfiles: Profile[];
  canEdit: boolean;
  meId: string;
}) {
  const supabase = createClient();
  const { toast } = useToast();

  const companionIds = new Set(companions.map((c) => c.user_id));
  const candidates = allProfiles.filter((p) => !companionIds.has(p.id));

  function nameOf(userId: string) {
    const p = allProfiles.find((x) => x.id === userId);
    return p?.display_name ?? p?.email ?? "Unbekannt";
  }

  async function add(userId: string) {
    const { data, error } = await supabase
      .from("tp_trip_companions")
      .insert({ trip_id: tripId, user_id: userId, role: "editor", added_by: meId })
      .select("*")
      .single();
    if (error) {
      toast(error.message, "error");
      return;
    }
    setCompanions((prev) => [...prev, data as TripCompanion]);
  }

  async function remove(userId: string) {
    const prev = companions;
    setCompanions((p) => p.filter((c) => c.user_id !== userId));
    const { error } = await supabase
      .from("tp_trip_companions")
      .delete()
      .eq("trip_id", tripId)
      .eq("user_id", userId);
    if (error) {
      setCompanions(prev);
      toast(error.message, "error");
    }
  }

  return (
    <div className="mt-3 bg-white/60 rounded-2xl border border-ink/10 p-4">
      <ul className="space-y-1.5 mb-3">
        {companions.map((c) => (
          <li key={c.user_id} className="flex items-center justify-between text-sm">
            <span>
              {nameOf(c.user_id)}{" "}
              {c.role === "owner" && (
                <span className="text-[10px] text-ink/45 uppercase">· Owner</span>
              )}
            </span>
            {canEdit && c.role !== "owner" && (
              <button
                onClick={() => remove(c.user_id)}
                className="text-xs text-rose/70 hover:text-rose"
              >
                entfernen
              </button>
            )}
          </li>
        ))}
      </ul>
      {canEdit && candidates.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-ink/45 mb-1.5">Einladen</p>
          <div className="flex flex-wrap gap-1.5">
            {candidates.map((p) => (
              <button
                key={p.id}
                onClick={() => add(p.id)}
                className="rounded-full border border-ink/15 px-3 py-1 text-sm hover:border-ink/40 transition"
              >
                + {p.display_name ?? p.email}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
