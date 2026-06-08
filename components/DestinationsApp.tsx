"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Destination, Photo, Profile, TripSpotCategory } from "@/lib/types";
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [country, setCountry] = useState<string | null>(null);
  const [catFilter, setCatFilter] = useState<TripSpotCategory | null>(null);

  const countries = useMemo(() => {
    const set = new Map<string, string>();
    for (const d of items) {
      if (d.country_code) set.set(d.country_code, d.country ?? d.country_code);
    }
    return Array.from(set.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [items]);

  const filtered = useMemo(() => {
    let list = items;
    if (country) list = list.filter((d) => d.country_code === country);
    if (catFilter) list = list.filter((d) => d.category === catFilter);
    return list;
  }, [items, country, catFilter]);

  const mapPoints: MapPoint[] = filtered
    .filter((d) => d.lat != null && d.lng != null)
    .map((d) => ({ id: d.id, lat: d.lat!, lng: d.lng!, title: d.title }));

  const selected = selectedId ? items.find((d) => d.id === selectedId) ?? null : null;

  async function refetch() {
    const { data } = await supabase
      .from("tp_destinations")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setItems(data as Destination[]);
  }

  async function handleDelete(id: string) {
    if (!confirm("Reiseidee loschen?")) return;
    const prev = items;
    setItems((p) => p.filter((d) => d.id !== id));
    setSelectedId(null);
    const { error } = await supabase.from("tp_destinations").delete().eq("id", id);
    if (error) {
      setItems(prev);
      toast(error.message, "error");
    }
  }

  async function handleUpdate(id: string, fields: Partial<Destination>) {
    const { error } = await supabase.from("tp_destinations").update(fields).eq("id", id);
    if (error) {
      toast(error.message, "error");
      return;
    }
    setItems((prev) => prev.map((d) => (d.id === id ? { ...d, ...fields } : d)));
    setEditId(null);
    toast("Gespeichert.");
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
              Hier kommt alles rein, das nicht (noch nicht) Teil eines Trips ist.
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="tap rounded-full bg-ink text-cream px-4 py-2.5 text-sm font-medium hover:bg-terracotta transition shrink-0"
          >
            + Idee
          </button>
        </header>

        {/* Category filter */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mb-3 -mx-1 px-1">
          <Chip active={catFilter === null} onClick={() => setCatFilter(null)}>
            Alle
          </Chip>
          {TRIP_SPOT_CATEGORIES.map((c) => (
            <Chip key={c.value} active={catFilter === c.value} onClick={() => setCatFilter((v) => (v === c.value ? null : c.value))}>
              <span className="mr-1">{c.emoji}</span>
              {c.label}
            </Chip>
          ))}
        </div>

        {/* Country filter */}
        {countries.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mb-4 -mx-1 px-1">
            <span className="text-[10px] uppercase tracking-[0.18em] text-ink/55 shrink-0">Land</span>
            <Chip active={country === null} onClick={() => setCountry(null)}>
              Alle
            </Chip>
            {countries.map(([code, name]) => (
              <Chip key={code} active={country === code} onClick={() => setCountry((v) => (v === code ? null : code))}>
                {name}
              </Chip>
            ))}
          </div>
        )}

        {/* Map */}
        {mapPoints.length > 0 && (
          <div className="h-64 mb-6">
            <WorldMap
              points={mapPoints}
              selectedId={selectedId}
              onSelect={setSelectedId}
              className="w-full h-full"
              mapId="destinations-map"
            />
          </div>
        )}

        {/* List */}
        {filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {filtered.map((d) => (
              <DestinationCard
                key={d.id}
                dest={d}
                photo={photosByOwner[d.id]?.[0]?.storage_path ?? null}
                selected={d.id === selectedId}
                onClick={() => setSelectedId(d.id)}
              />
            ))}
          </div>
        )}

        {/* Detail panel */}
        {selected && (
          <DetailPanel
            dest={selected}
            photos={(photosByOwner[selected.id] ?? []).map((p) => p.storage_path)}
            canEdit={selected.created_by === me.id}
            isEditing={editId === selected.id}
            onEdit={() => setEditId(selected.id)}
            onSave={(fields) => handleUpdate(selected.id, fields)}
            onCancelEdit={() => setEditId(null)}
            onDelete={() => handleDelete(selected.id)}
            onClose={() => setSelectedId(null)}
          />
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

function DetailPanel({
  dest,
  photos,
  canEdit,
  isEditing,
  onEdit,
  onSave,
  onCancelEdit,
  onDelete,
  onClose,
}: {
  dest: Destination;
  photos: string[];
  canEdit: boolean;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (fields: Partial<Destination>) => void;
  onCancelEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(dest.title);
  const [description, setDescription] = useState(dest.description ?? "");
  const [website, setWebsite] = useState(dest.website ?? "");
  const [price, setPrice] = useState(
    dest.price_per_night != null ? String(dest.price_per_night) : "",
  );
  const cat = TRIP_SPOT_CATEGORIES.find((c) => c.value === dest.category);

  // Reset form when dest changes
  if (title !== dest.title && !isEditing) {
    setTitle(dest.title);
    setDescription(dest.description ?? "");
    setWebsite(dest.website ?? "");
    setPrice(dest.price_per_night != null ? String(dest.price_per_night) : "");
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal
        className="relative w-full sm:max-w-lg bg-paper rounded-t-3xl sm:rounded-3xl shadow-sticker max-h-[85vh] overflow-y-auto float-in"
      >
        {/* Photo(s) */}
        {photos.length > 0 ? (
          <div className="w-full aspect-[16/9] overflow-hidden rounded-t-3xl sm:rounded-t-3xl bg-sand">
            <img
              src={photos[0]}
              alt=""
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        ) : (
          <div className="w-full aspect-[16/9] bg-sand grid place-items-center rounded-t-3xl">
            <Mascot size={80} className="text-ink bob" />
          </div>
        )}

        <div className="px-6 py-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                {cat && (
                  <span className="text-[10px] uppercase tracking-wide rounded-full px-2 py-0.5 bg-sand text-ink/70">
                    {cat.emoji} {cat.label}
                  </span>
                )}
                {dest.country && (
                  <span className="text-[10px] uppercase tracking-wide rounded-full px-2 py-0.5 bg-ocean/15 text-oceanInk">
                    {dest.country}
                  </span>
                )}
              </div>
              {isEditing ? (
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full serif text-2xl bg-white border border-ink/10 rounded-xl px-3 py-1 outline-none focus:border-terracotta"
                />
              ) : (
                <h2 className="serif text-2xl">{dest.title}</h2>
              )}
              {dest.address && !isEditing && (
                <p className="text-sm text-ink/55 mt-1">{dest.address}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="rounded-full w-9 h-9 grid place-items-center hover:bg-ink/5 shrink-0"
              aria-label="Schliessen"
            >
              ✕
            </button>
          </div>

          {isEditing ? (
            <div className="mt-4">
              <label className="block text-xs uppercase tracking-[0.18em] text-ink/60 mb-1">
                Beschreibung
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-xl bg-white border border-ink/10 px-3 py-2 outline-none focus:border-terracotta resize-none text-sm"
              />
              <label className="block text-xs uppercase tracking-[0.18em] text-ink/60 mb-1 mt-3">
                Website
              </label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://…"
                className="w-full rounded-xl bg-white border border-ink/10 px-3 py-2 outline-none focus:border-terracotta text-sm"
              />
              <label className="block text-xs uppercase tracking-[0.18em] text-ink/60 mb-1 mt-3">
                Ø Preis DZ / Nacht (€)
              </label>
              <input
                type="number"
                min={0}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="z. B. 280"
                className="w-40 rounded-xl bg-white border border-ink/10 px-3 py-2 outline-none focus:border-terracotta text-sm"
              />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() =>
                    onSave({
                      title: title.trim(),
                      description: description.trim() || null,
                      website: website.trim() || null,
                      price_per_night: price.trim() ? parseInt(price, 10) : null,
                    })
                  }
                  className="tap rounded-full bg-ink text-cream px-4 py-2 text-sm font-medium hover:bg-terracotta transition"
                >
                  Speichern
                </button>
                <button onClick={onCancelEdit} className="text-sm text-ink/55 hover:text-ink">
                  Abbrechen
                </button>
              </div>
            </div>
          ) : (
            <>
              {dest.description && (
                <p className="text-sm text-ink/75 mt-3 whitespace-pre-wrap">{dest.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-3 mt-3">
                {dest.price_per_night != null && (
                  <span className="text-sm rounded-full px-3 py-1 bg-sunshine/25 text-ink">
                    ca. {dest.price_per_night} € / Nacht
                  </span>
                )}
                {dest.website && (
                  <a
                    href={dest.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-ocean hover:text-oceanInk underline"
                  >
                    Zur Website ↗
                  </a>
                )}
              </div>
              {canEdit && (
                <div className="flex items-center gap-3 mt-4 pt-3 border-t border-ink/10">
                  <button
                    onClick={onEdit}
                    className="text-sm text-ink/60 hover:text-ink underline"
                  >
                    Bearbeiten
                  </button>
                  <button
                    onClick={onDelete}
                    className="text-sm text-rose/70 hover:text-rose"
                  >
                    Loschen
                  </button>
                </div>
              )}
            </>
          )}

          <p className="text-[11px] text-ink/40 mt-4">
            Hinzugefugt von {dest.created_by_name ?? "Unbekannt"} am{" "}
            {new Date(dest.created_at).toLocaleDateString("de-DE", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
      </div>
    </div>
  );
}

function DestinationCard({
  dest,
  photo,
  selected,
  onClick,
}: {
  dest: Destination;
  photo: string | null;
  selected: boolean;
  onClick: () => void;
}) {
  const cat = TRIP_SPOT_CATEGORIES.find((c) => c.value === dest.category);
  return (
    <button
      onClick={onClick}
      className={
        "text-left bg-paper rounded-3xl border shadow-soft overflow-hidden lift flex w-full " +
        (selected ? "border-ink" : "border-ink/5")
      }
    >
      <div className="w-28 h-28 shrink-0 bg-sand">
        <img
          src={photo ?? placeholderPhoto()}
          alt=""
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>
      <div className="flex-1 min-w-0 p-4">
        <div className="flex items-center gap-1.5 mb-1">
          {cat && (
            <span className="text-[10px] uppercase tracking-wide rounded-full px-2 py-0.5 bg-sand text-ink/70">
              {cat.emoji} {cat.label}
            </span>
          )}
          {dest.country && (
            <span className="text-[10px] uppercase tracking-wide rounded-full px-2 py-0.5 bg-ocean/15 text-oceanInk">
              {dest.country}
            </span>
          )}
        </div>
        <h3 className="serif text-xl truncate" title={dest.title}>
          {dest.title}
        </h3>
        {dest.price_per_night != null && (
          <span className="text-xs text-ink/60">ca. {dest.price_per_night} € / Nacht</span>
        )}
        {dest.description && (
          <p className="text-sm text-ink/65 line-clamp-2 mt-0.5">{dest.description}</p>
        )}
      </div>
    </button>
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
