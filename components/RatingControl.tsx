"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile, Rating, RatingTargetType } from "@/lib/types";
import { useToast } from "./Toaster";

/**
 * Graded rating (1–5) plus an optional comment (Req 5). A comment without a
 * value is allowed. Re-rating replaces the member's previous rating (upsert).
 */
export default function RatingControl({
  targetType,
  targetId,
  me,
  initialRatings,
}: {
  targetType: RatingTargetType;
  targetId: string;
  me: Profile;
  initialRatings: Rating[];
}) {
  const supabase = createClient();
  const { toast } = useToast();
  const [ratings, setRatings] = useState<Rating[]>(initialRatings);

  const mine = ratings.find((r) => r.user_id === me.id) ?? null;
  const [value, setValue] = useState<number | null>(mine?.value ?? null);
  const [comment, setComment] = useState<string>(mine?.comment ?? "");
  const [busy, setBusy] = useState(false);

  const avg =
    ratings.filter((r) => r.value != null).length > 0
      ? ratings.reduce((s, r) => s + (r.value ?? 0), 0) /
        ratings.filter((r) => r.value != null).length
      : null;

  async function save() {
    const text = comment.trim();
    if (value == null && !text) {
      toast("Vergib einen Stern oder schreib einen Kommentar.", "error");
      return;
    }
    setBusy(true);
    const row = {
      target_type: targetType,
      target_id: targetId,
      user_id: me.id,
      user_name: me.display_name ?? me.email.split("@")[0],
      value,
      comment: text || null,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from("tp_ratings")
      .upsert(row, { onConflict: "user_id,target_type,target_id" })
      .select("*")
      .single();
    setBusy(false);
    if (error) {
      toast(error.message, "error");
      return;
    }
    setRatings((prev) => {
      const others = prev.filter((r) => r.user_id !== me.id);
      return [...others, data as Rating];
    });
    toast("Bewertung gespeichert.");
  }

  return (
    <div className="border-t border-ink/10 pt-5 mt-5">
      <div className="flex items-baseline justify-between mb-3">
        <p className="text-xs uppercase tracking-[0.18em] text-ink/55">Bewertungen</p>
        {avg != null && (
          <p className="text-sm text-ink/70">
            Ø {avg.toFixed(1)} <span className="text-ink/45">· {ratings.length}</span>
          </p>
        )}
      </div>

      {/* My rating */}
      <div className="bg-white/60 rounded-2xl border border-ink/10 p-4 mb-4">
        <Stars value={value} onChange={setValue} />
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={2}
          placeholder="Dein Kommentar (optional) …"
          className="w-full mt-3 rounded-xl bg-white border border-ink/10 px-3 py-2 text-sm outline-none focus:border-terracotta resize-none"
        />
        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={save}
            disabled={busy}
            className="tap rounded-full bg-ink text-cream px-4 py-2 text-sm font-medium hover:bg-terracotta transition disabled:opacity-50"
          >
            {busy ? "Speichert …" : "Speichern"}
          </button>
          {value != null && (
            <button
              onClick={() => setValue(null)}
              className="text-xs text-ink/50 hover:text-ink underline"
            >
              Stern entfernen
            </button>
          )}
        </div>
      </div>

      {/* Others' ratings */}
      <ul className="space-y-2">
        {ratings
          .filter((r) => r.user_id !== me.id)
          .map((r) => (
            <li key={r.id} className="text-sm">
              <span className="font-medium">{r.user_name ?? "Jemand"}</span>{" "}
              {r.value != null && <span className="text-sunshine">{"★".repeat(r.value)}</span>}
              {r.comment && <span className="text-ink/70"> — {r.comment}</span>}
            </li>
          ))}
      </ul>
    </div>
  );
}

function Stars({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-label={`${n} Sterne`}
          className={
            "text-2xl leading-none transition " +
            (value != null && n <= value ? "text-sunshine" : "text-ink/20 hover:text-ink/40")
          }
        >
          ★
        </button>
      ))}
    </div>
  );
}
