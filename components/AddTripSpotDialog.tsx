"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Destination, Profile, TripSpotCategory } from "@/lib/types";
import { TRIP_SPOT_CATEGORIES } from "@/lib/constants";
import { cachePhotos } from "@/lib/photos";
import { useToast } from "./Toaster";
import PlacesAutocomplete, { type PlacePick } from "./PlacesAutocomplete";

export default function AddTripSpotDialog({
  tripId,
  me,
  nextSortOrder,
  wishlist,
  onClose,
  onCreated,
}: {
  tripId: string;
  me: Profile;
  nextSortOrder: number;
  wishlist: Destination[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const supabase = createClient();
  const { toast } = useToast();
  const [pick, setPick] = useState<PlacePick | null>(null);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [category, setCategory] = useState<TripSpotCategory>("activity");
  const [country, setCountry] = useState<string | null>(null);
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [placeId, setPlaceId] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [photoNames, setPhotoNames] = useState<string[]>([]);
  const [sourceDestId, setSourceDestId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showWishlist, setShowWishlist] = useState(false);

  function handlePlacePick(p: PlacePick) {
    setPick(p);
    if (!title.trim()) setTitle(p.name);
    setAddress(p.address);
    setCountry(p.country);
    setCountryCode(p.countryCode);
    setCoords({ lat: p.lat, lng: p.lng });
    setPlaceId(p.placeId);
    setPhotoNames(p.photoNames);
    setSourceDestId(null);
  }

  function pickFromWishlist(d: Destination) {
    setTitle(d.title);
    setAddress(d.address);
    setCountry(d.country);
    setCountryCode(d.country_code);
    setCoords(d.lat != null && d.lng != null ? { lat: d.lat, lng: d.lng } : null);
    setPlaceId(d.google_place_id);
    setPhotoNames([]);
    setSourceDestId(d.id);
    setShowWishlist(false);
    toast(`„${d.title}" übernommen.`);
  }

  async function handleSave() {
    setError("");
    if (!title.trim()) return setError("Titel fehlt noch.");
    setSaving(true);

    const payload = {
      trip_id: tripId,
      title: title.trim(),
      note: note.trim() || null,
      category,
      place_name: pick?.name ?? null,
      address,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
      google_place_id: placeId,
      country,
      country_code: countryCode,
      sort_order: nextSortOrder,
      source_destination_id: sourceDestId,
      created_by: me.id,
    };

    const { data: created, error: err } = await supabase
      .from("tp_trip_spots")
      .insert(payload)
      .select("id")
      .single();
    if (err) {
      setSaving(false);
      setError(err.message);
      return;
    }

    if (created?.id && photoNames.length > 0) {
      cachePhotos({
        ownerType: "trip_spot",
        ownerId: created.id,
        photoNames,
        googlePlaceId: placeId,
      });
    } else if (created?.id && placeId) {
      cachePhotos({ ownerType: "trip_spot", ownerId: created.id, googlePlaceId: placeId });
    }

    setSaving(false);
    toast("Spot hinzugefügt.");
    onCreated();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal
        className="relative w-full sm:max-w-lg bg-paper rounded-t-3xl sm:rounded-3xl shadow-sticker max-h-[92vh] overflow-y-auto float-in"
      >
        <div className="px-6 sm:px-8 pt-5 pb-4 flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.3em] text-terracotta font-semibold">
            Spot hinzufügen
          </p>
          <button
            onClick={onClose}
            className="rounded-full w-9 h-9 grid place-items-center hover:bg-ink/5 transition"
            aria-label="Schließen"
          >
            ✕
          </button>
        </div>

        <div className="px-6 sm:px-8 pb-6">
          {wishlist.length > 0 && (
            <div className="mb-4">
              <button
                type="button"
                onClick={() => setShowWishlist((v) => !v)}
                className="text-sm text-ocean hover:text-oceanInk underline"
              >
                {showWishlist ? "Wishlist verbergen" : "Aus Wishlist übernehmen"}
              </button>
              {showWishlist && (
                <div className="mt-2 grid gap-1.5 max-h-44 overflow-y-auto">
                  {wishlist.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => pickFromWishlist(d)}
                      className="text-left rounded-xl border border-ink/10 px-3 py-2 hover:bg-ink/5 transition"
                    >
                      <span className="text-sm font-medium">{d.title}</span>
                      {d.country && <span className="text-xs text-ink/50"> · {d.country}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <Field label="Ort suchen">
            <PlacesAutocomplete onPick={handlePlacePick} placeholder="Hotel, Strand, Stadt …" />
          </Field>

          {(pick || sourceDestId) && (
            <div className="bg-white/70 rounded-xl border border-ink/10 px-4 py-3 mb-4 text-sm">
              <div className="font-medium">{title}</div>
              {address && <div className="text-ink/60">{address}</div>}
              {country && <div className="text-ink/50 text-xs mt-1">{country}</div>}
            </div>
          )}

          <Field label="Titel">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl bg-white border border-ink/10 px-4 py-3 outline-none focus:border-terracotta transition"
            />
          </Field>

          <Field label="Kategorie">
            <div className="flex flex-wrap gap-2">
              {TRIP_SPOT_CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategory(c.value)}
                  className={
                    "rounded-full border px-3 py-1.5 text-sm transition " +
                    (category === c.value
                      ? "bg-ink text-cream border-ink"
                      : "bg-white text-ink/70 border-ink/10 hover:border-ink/30")
                  }
                >
                  <span className="mr-1">{c.emoji}</span>
                  {c.label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Notiz (optional)">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Was ist hier besonders?"
              className="w-full rounded-xl bg-white border border-ink/10 px-4 py-3 outline-none focus:border-terracotta transition resize-none"
            />
          </Field>

          {error && <p className="text-rose text-sm mb-3">{error}</p>}

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="tap flex-1 rounded-xl bg-ink text-cream py-3 font-medium hover:bg-terracotta transition disabled:opacity-60"
            >
              {saving ? "Speichert …" : "Hinzufügen"}
            </button>
            <button onClick={onClose} className="rounded-xl px-5 py-3 text-ink/70 hover:text-ink transition">
              Abbrechen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block mb-4">
      <span className="block text-xs uppercase tracking-[0.18em] text-ink/60 mb-2">{label}</span>
      {children}
    </label>
  );
}
