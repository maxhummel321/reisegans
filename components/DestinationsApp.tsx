"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Destination, Photo, Profile } from "@/lib/types";
import { placeholderPhoto } from "@/lib/photos";
import { TRIP_SPOT_CATEGORIES } from "@/lib/constants";
import { useToast } from "./Toaster";
import AddDestinationDialog from "./AddDestinationDialog";
import WorldMap, { type MapPoint } from "./WorldMap";
import Mascot from "./Mascot";

import AppHeader from "./AppHeader";

export default function DestinationsApp({
  initialDestinations,
  photosByOwner,
  me,
}: {
  initialDestinations: Destination[];
  photosByOwner: Record<string, Photo[]>;
  me: Profile;
}) {
  const supabase = createClient();
  const { toast } = useToast();
  const [items, setItems] = useState<Destination[]>(initialDestinations);
  const [showAdd, setShowAdd] = useState(false);
  const [country, setCountry] = useState<string | null>(null);

  const countries = useMemo(() => {
    const set = new Map<string, string>(); // code -> name
    for (const d of items) {
      if (d.country_code) set.set(d.country_code, d.country ?? d.country_code);
    }
    return Array.from(set.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [items]);

  const filtered = useMemo(
    () => (country ? items.filter((d) => d.country_code === country) : items),
    [items, country],
  );

  const mapPoints: MapPoint[] = filtered
    .filter((d) => d.lat != null && d.lng != null)
    .map((d) => ({ id: d.id, lat: d.lat!, lng: d.lng!, title: d.title }));

  async function refetch() {
    const { data } = await supabase
      .from("tp_destinations")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setItems(data as Destination[]);
  }

  async function handleDelete(id: string) {
    if (!confirm("Reiseidee löschen?")) return;
    const prev = items;
    setItems((p) => p.filter((d) => d.id !== id));
    const { error } = await supabase.from("tp_destinations").delete().eq("id", id);
    if (error) {
      setItems(prev);
      toast(error.message, "error");
    }
  }

  return (
    <>
      <AppHeader />
      <main className="min-h-svh max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <header className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-terracotta font-semibold">
              Wishlist
            </p>
            <h1 className="serif text-4xl">Einzelne Ideen</h1>
            <p className="text-sm text-ink/60 mt-1 max-w-md">
              Hier kommt alles rein, das nicht (noch nicht) Teil eines Trips ist —
              ein Hotel, ein Geheimtipp, eine Stadt.
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="tap rounded-full bg-ink text-cream px-4 py-2.5 text-sm font-medium hover:bg-terracotta transition shrink-0"
          >
            + Idee
          </button>
        </header>

      {countries.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mb-4 -mx-1 px-1">
          <Chip active={country === null} onClick={() => setCountry(null)}>
            Alle
          </Chip>
          {countries.map(([code, name]) => (
            <Chip key={code} active={country === code} onClick={() => setCountry(code)}>
              {name}
            </Chip>
          ))}
        </div>
      )}

      {mapPoints.length > 0 && (
        <div className="h-64 mb-6">
          <WorldMap points={mapPoints} className="w-full h-full" mapId="destinations-map" />
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((d) => (
            <DestinationCard
              key={d.id}
              dest={d}
              photo={photosByOwner[d.id]?.[0]?.storage_path ?? null}
              canEdit={d.created_by === me.id}
              onDelete={() => handleDelete(d.id)}
            />
          ))}
        </div>
      )}

      {showAdd && (
        <AddDestinationDialog
          me={me}
          onClose={() => setShowAdd(false)}
          onCreated={() => {
            setShowAdd(false);
            refetch();
          }}
        />
      )}
      </main>
    </>
  );
}

function DestinationCard({
  dest,
  photo,
  canEdit,
  onDelete,
}: {
  dest: Destination;
  photo: string | null;
  canEdit: boolean;
  onDelete: () => void;
}) {
  return (
    <article className="bg-paper rounded-3xl border border-ink/5 shadow-soft overflow-hidden lift flex">
      <div className="w-28 h-28 shrink-0 bg-sand">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo ?? placeholderPhoto()}
          alt=""
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>
      <div className="flex-1 min-w-0 p-4">
        <div className="flex items-center gap-1.5 mb-1">
          {(() => {
            const cat = TRIP_SPOT_CATEGORIES.find((c) => c.value === dest.category);
            if (!cat) return null;
            return (
              <span className="text-[10px] uppercase tracking-wide rounded-full px-2 py-0.5 bg-sand text-ink/70">
                {cat.emoji} {cat.label}
              </span>
            );
          })()}
          {dest.country && (
            <span className="text-[10px] uppercase tracking-wide rounded-full px-2 py-0.5 bg-ocean/15 text-oceanInk">
              {dest.country}
            </span>
          )}
        </div>
        <h3 className="serif text-xl truncate" title={dest.title}>
          {dest.title}
        </h3>
        {dest.description && (
          <p className="text-sm text-ink/65 line-clamp-2 mt-0.5">{dest.description}</p>
        )}
        {canEdit && (
          <button
            onClick={onDelete}
            className="text-[11px] text-rose/80 hover:text-rose mt-1"
          >
            Löschen
          </button>
        )}
      </div>
    </article>
  );
}

function Chip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "shrink-0 rounded-full px-3.5 py-1.5 text-sm border transition " +
        (active ? "bg-ink text-cream border-ink" : "bg-paper text-ink/70 border-ink/10")
      }
    >
      {children}
    </button>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-14">
      <Mascot size={96} className="text-ink mx-auto mb-3 bob" />
      <p className="serif text-2xl mb-1">Noch keine Idee.</p>
      <p className="text-ink/55 text-sm">Wirf das erste Reiseziel auf die Wishlist.</p>
    </div>
  );
}
