"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";
import { cachePhotos } from "@/lib/photos";
import { useToast } from "./Toaster";
import PlacesAutocomplete, { type PlacePick } from "./PlacesAutocomplete";

export default function AddDestinationDialog({
  me,
  onClose,
  onCreated,
}: {
  me: Profile;
  onClose: () => void;
  onCreated: () => void;
}) {
  const supabase = createClient();
  const { toast } = useToast();
  const [pick, setPick] = useState<PlacePick | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function handlePlacePick(p: PlacePick) {
    setPick(p);
    if (!title.trim()) setTitle(p.name);
  }

  async function handleSave() {
    setError("");
    if (!title.trim()) return setError("Titel fehlt noch.");
    setSaving(true);

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      place_name: pick?.name ?? null,
      address: pick?.address ?? null,
      lat: pick?.lat ?? null,
      lng: pick?.lng ?? null,
      google_place_id: pick?.placeId ?? null,
      country: pick?.country ?? null,
      country_code: pick?.countryCode ?? null,
      created_by: me.id,
      created_by_name: me.display_name ?? me.email.split("@")[0],
    };

    const { data: created, error: err } = await supabase
      .from("tp_destinations")
      .insert(payload)
      .select("id")
      .single();

    if (err) {
      setSaving(false);
      setError(err.message);
      return;
    }

    if (created?.id && pick) {
      cachePhotos({
        ownerType: "destination",
        ownerId: created.id,
        photoNames: pick.photoNames,
        googlePlaceId: pick.placeId,
      });
    }

    setSaving(false);
    toast("Auf die Wishlist gepackt.");
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
            Neue Reiseidee
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
          <h2 className="serif text-3xl mb-5">Wo zieht&apos;s dich hin?</h2>

          <Field label="Ort suchen (optional)">
            <PlacesAutocomplete onPick={handlePlacePick} placeholder="Lissabon, Bali, Tantris …" />
          </Field>

          {pick && (
            <div className="bg-white/70 rounded-xl border border-ink/10 px-4 py-3 mb-4 text-sm">
              <div className="font-medium">{pick.name}</div>
              <div className="text-ink/60">{pick.address}</div>
              {pick.country && <div className="text-ink/50 text-xs mt-1">{pick.country}</div>}
            </div>
          )}

          <Field label="Titel">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Wie nennen wir die Idee?"
              className="w-full rounded-xl bg-white border border-ink/10 px-4 py-3 outline-none focus:border-terracotta transition"
            />
          </Field>

          <Field label="Warum dahin? (optional)">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Was reizt dich daran?"
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
              {saving ? "Speichert …" : "Auf die Wishlist"}
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
