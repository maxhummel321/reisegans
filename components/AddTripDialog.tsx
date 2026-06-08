"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile, Trip, TripCategory } from "@/lib/types";
import { TRIP_CATEGORIES } from "@/lib/constants";
import { useToast } from "./Toaster";

export default function AddTripDialog({
  me,
  existing,
  onClose,
  onSaved,
}: {
  me: Profile;
  existing?: Trip | null;
  onClose: () => void;
  onSaved: (tripId: string) => void;
}) {
  const supabase = createClient();
  const { toast } = useToast();
  const [title, setTitle] = useState(existing?.title ?? "");
  const [meta, setMeta] = useState(existing?.meta ?? "");
  const [summary, setSummary] = useState(existing?.summary ?? "");
  const [categories, setCategories] = useState<Set<TripCategory>>(
    new Set(existing?.categories ?? []),
  );
  const [nightsMin, setNightsMin] = useState<string>(
    existing?.nights_min != null ? String(existing.nights_min) : "",
  );
  const [nightsMax, setNightsMax] = useState<string>(
    existing?.nights_max != null ? String(existing.nights_max) : "",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function toggle(c: TripCategory) {
    setCategories((prev) => {
      const next = new Set(prev);
      next.has(c) ? next.delete(c) : next.add(c);
      return next;
    });
  }

  async function handleSave() {
    setError("");
    if (!title.trim()) return setError("Titel fehlt noch.");
    const nMin = nightsMin.trim() ? parseInt(nightsMin, 10) : null;
    const nMax = nightsMax.trim() ? parseInt(nightsMax, 10) : null;
    if (nMin != null && nMax != null && nMin > nMax) {
      return setError("Min-Nächte dürfen nicht größer als Max sein.");
    }
    setSaving(true);

    const payload = {
      title: title.trim(),
      meta: meta.trim() || null,
      summary: summary.trim() || null,
      categories: Array.from(categories),
      nights_min: nMin,
      nights_max: nMax,
      created_by: me.id,
      created_by_name: me.display_name ?? me.email.split("@")[0],
    };

    if (existing) {
      const { error: err } = await supabase
        .from("tp_trips")
        .update(payload)
        .eq("id", existing.id);
      setSaving(false);
      if (err) return setError(err.message);
      toast("Trip aktualisiert.");
      onSaved(existing.id);
      return;
    }

    const { data: created, error: err } = await supabase
      .from("tp_trips")
      .insert(payload)
      .select("id")
      .single();
    setSaving(false);
    if (err) return setError(err.message);
    toast("Trip angelegt.");
    onSaved(created!.id);
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
            {existing ? "Trip bearbeiten" : "Neuer Trip"}
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
          <Field label="Titel">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z. B. Italien Frühjahr 2027"
              className="w-full rounded-xl bg-white border border-ink/10 px-4 py-3 outline-none focus:border-terracotta transition"
            />
          </Field>

          <Field label="Teaser (kurz)">
            <input
              value={meta}
              onChange={(e) => setMeta(e.target.value)}
              placeholder="Ein Satz, der Lust macht."
              className="w-full rounded-xl bg-white border border-ink/10 px-4 py-3 outline-none focus:border-terracotta transition"
            />
          </Field>

          <Field label="Zusammenfassung (optional)">
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              placeholder="Worum geht's bei dieser Reise?"
              className="w-full rounded-xl bg-white border border-ink/10 px-4 py-3 outline-none focus:border-terracotta transition resize-none"
            />
          </Field>

          <Field label="Kategorien (mehrfach möglich)">
            <div className="flex flex-wrap gap-2">
              {TRIP_CATEGORIES.map((c) => {
                const on = categories.has(c.value);
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => toggle(c.value)}
                    className={
                      "rounded-full border px-3 py-1.5 text-sm transition " +
                      (on
                        ? "bg-ink text-cream border-ink"
                        : "bg-white text-ink/70 border-ink/10 hover:border-ink/30")
                    }
                  >
                    <span className="mr-1">{c.emoji}</span>
                    {c.label}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Dauer (Nächte, ungefähr)">
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                value={nightsMin}
                onChange={(e) => setNightsMin(e.target.value)}
                placeholder="von"
                className="w-24 rounded-xl bg-white border border-ink/10 px-3 py-3 outline-none focus:border-terracotta transition"
              />
              <span className="text-ink/50">–</span>
              <input
                type="number"
                min={0}
                value={nightsMax}
                onChange={(e) => setNightsMax(e.target.value)}
                placeholder="bis"
                className="w-24 rounded-xl bg-white border border-ink/10 px-3 py-3 outline-none focus:border-terracotta transition"
              />
              <span className="text-ink/50 text-sm">Nächte</span>
            </div>
          </Field>

          {error && <p className="text-rose text-sm mb-3">{error}</p>}

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="tap flex-1 rounded-xl bg-ink text-cream py-3 font-medium hover:bg-terracotta transition disabled:opacity-60"
            >
              {saving ? "Speichert …" : existing ? "Speichern" : "Trip anlegen"}
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
