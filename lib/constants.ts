import type { TripCategory, TripSpotCategory } from "./types";

// --- Trip categories (Req 3.5) ----------------------------------------------
export const TRIP_CATEGORIES: {
  value: TripCategory;
  label: string;
  emoji: string;
  tint: string; // tailwind classes for chips
}[] = [
  { value: "strandurlaub", label: "Strand", emoji: "🏖", tint: "bg-ocean/15 text-oceanInk" },
  { value: "aktivurlaub", label: "Aktiv", emoji: "🚴", tint: "bg-palm/20 text-ink" },
  { value: "spa_wellness", label: "Spa & Wellness", emoji: "🧖", tint: "bg-rose/15 text-rose" },
  { value: "staedtetrip", label: "Städtetrip", emoji: "🏙", tint: "bg-sand text-ink" },
  { value: "roadtrip", label: "Roadtrip", emoji: "🚐", tint: "bg-terracotta/15 text-terracottaInk" },
  { value: "natur_wandern", label: "Natur & Wandern", emoji: "🥾", tint: "bg-palm/20 text-ink" },
  { value: "kulinarik", label: "Kulinarik", emoji: "🍽", tint: "bg-sunshine/25 text-ink" },
  { value: "winter_ski", label: "Winter & Ski", emoji: "⛷", tint: "bg-ocean/15 text-oceanInk" },
];

// --- Trip spot categories (Req 4.2) -----------------------------------------
export const TRIP_SPOT_CATEGORIES: {
  value: TripSpotCategory;
  label: string;
  emoji: string;
  pinColor: string;
  pinGlyph: string;
}[] = [
  { value: "city", label: "Stadt", emoji: "🏙", pinColor: "#c8623f", pinGlyph: "#fdf8ee" },
  { value: "hotel", label: "Unterkunft", emoji: "🛏", pinColor: "#c8623f", pinGlyph: "#fdf8ee" },
  { value: "spa", label: "Spa & Wellness", emoji: "🧖", pinColor: "#a25e8c", pinGlyph: "#fdf8ee" },
  { value: "activity", label: "Aktivität", emoji: "✨", pinColor: "#e8b13e", pinGlyph: "#22201b" },
  { value: "beach", label: "Strand", emoji: "🏖", pinColor: "#2f7e84", pinGlyph: "#fdf8ee" },
  { value: "restaurant", label: "Essen", emoji: "🍽", pinColor: "#e8b13e", pinGlyph: "#22201b" },
  { value: "viewpoint", label: "Aussicht", emoji: "🏔", pinColor: "#5d8a4c", pinGlyph: "#fdf8ee" },
  { value: "transport", label: "Anreise", emoji: "✈️", pinColor: "#22201b", pinGlyph: "#fdf8ee" },
  { value: "other", label: "Sonstiges", emoji: "📍", pinColor: "#7d3a22", pinGlyph: "#fdf8ee" },
];

// --- Duration buckets (Req 10.3) --------------------------------------------
// A trip matches a bucket if its [nights_min, nights_max] range overlaps the
// bucket range. Longer trips stay differentiable (2 vs 3 weeks vs long-haul).
export type DurationBucket = {
  value: string;
  label: string;
  min: number;
  max: number; // inclusive; Infinity for open-ended
};

export const DURATION_BUCKETS: DurationBucket[] = [
  { value: "weekend", label: "Wochenende", min: 0, max: 2 },
  { value: "short", label: "Kurztrip", min: 3, max: 5 },
  { value: "week", label: "Eine Woche", min: 6, max: 9 },
  { value: "twoweeks", label: "Zwei Wochen", min: 10, max: 16 },
  { value: "threeweeks", label: "Drei Wochen", min: 17, max: 23 },
  { value: "long", label: "Langzeit", min: 24, max: Infinity },
];

/** Does a trip's night range overlap the given bucket? */
export function tripMatchesDurationBucket(
  nightsMin: number | null,
  nightsMax: number | null,
  bucket: DurationBucket,
): boolean {
  if (nightsMin == null && nightsMax == null) return false;
  const lo = nightsMin ?? nightsMax ?? 0;
  const hi = nightsMax ?? nightsMin ?? 0;
  return lo <= bucket.max && hi >= bucket.min;
}

/** Human-readable duration, e.g. "ca. 5–7 Tage". */
export function formatDuration(
  nightsMin: number | null,
  nightsMax: number | null,
): string | null {
  if (nightsMin == null && nightsMax == null) return null;
  const lo = nightsMin ?? nightsMax!;
  const hi = nightsMax ?? nightsMin!;
  const nights = lo === hi ? `${lo}` : `${lo}–${hi}`;
  return `ca. ${nights} ${hi === 1 ? "Nacht" : "Nächte"}`;
}

export const STORAGE_BUCKET = "tp-photos";
