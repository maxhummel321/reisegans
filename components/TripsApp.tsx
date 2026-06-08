"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Profile, Trip, TripCategory } from "@/lib/types";
import {
  TRIP_CATEGORIES,
  DURATION_BUCKETS,
  tripMatchesDurationBucket,
  formatDuration,
} from "@/lib/constants";
import AddTripDialog from "./AddTripDialog";
import TripCover from "./TripCover";
import Mascot from "./Mascot";
import AppHeader from "./AppHeader";

export default function TripsApp({
  initialTrips,
  coversByTrip,
  countryNames,
  me,
}: {
  initialTrips: Trip[];
  coversByTrip: Record<string, string[]>;
  countryNames: Record<string, string>;
  me: Profile;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const isStadt = params?.get("art") === "stadt";
  const [trips] = useState<Trip[]>(initialTrips);
  const [showAdd, setShowAdd] = useState(false);
  const [cats, setCats] = useState<Set<TripCategory>>(new Set());
  const [country, setCountry] = useState<string | null>(null);
  const [bucket, setBucket] = useState<string | null>(null);

  // Split by section: Städtetrips have the "staedtetrip" category,
  // Rundreisen are everything else.
  const sectionTrips = useMemo(
    () =>
      trips.filter((t) =>
        isStadt
          ? (t.categories ?? []).includes("staedtetrip")
          : !(t.categories ?? []).includes("staedtetrip"),
      ),
    [trips, isStadt],
  );

  const countries = useMemo(() => {
    const set = new Map<string, string>();
    for (const t of sectionTrips) {
      for (const code of t.countries ?? []) {
        set.set(code, countryNames[code] ?? code);
      }
    }
    return Array.from(set.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [sectionTrips, countryNames]);

  const filtered = useMemo(() => {
    return sectionTrips.filter((t) => {
      if (cats.size > 0 && !(t.categories ?? []).some((c) => cats.has(c as TripCategory)))
        return false;
      if (country && !(t.countries ?? []).includes(country)) return false;
      if (bucket) {
        const b = DURATION_BUCKETS.find((x) => x.value === bucket);
        if (b && !tripMatchesDurationBucket(t.nights_min, t.nights_max, b)) return false;
      }
      return true;
    });
  }, [sectionTrips, cats, country, bucket]);

  function toggleCat(c: TripCategory) {
    setCats((prev) => {
      const next = new Set(prev);
      next.has(c) ? next.delete(c) : next.add(c);
      return next;
    });
  }

  // Category chips: hide the "staedtetrip" chip (it's the section itself).
  const catChips = TRIP_CATEGORIES.filter((c) =>
    isStadt ? false : c.value !== "staedtetrip",
  );

  return (
    <>
      <AppHeader />
      <main className="min-h-svh max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <header className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-terracotta font-semibold">
              {isStadt ? "Städtetrips" : "Rundreisen"}
            </p>
            <h1 className="serif text-4xl">
              {isStadt ? "Städte erkunden" : "Geplante Reisen"}
            </h1>
            <p className="text-sm text-ink/60 mt-1 max-w-md">
              {isStadt
                ? "Ein verlängertes Wochenende, eine Stadt, die Top-Spots."
                : "Mehrere Stationen zu einer Reise gebündelt — mit Karte, Route und Crew."}
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="tap rounded-full bg-ink text-cream px-4 py-2.5 text-sm font-medium hover:bg-terracotta transition shrink-0"
          >
            + Trip
          </button>
        </header>

        <div className="space-y-2 mb-5">
          {catChips.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
              {catChips.map((c) => (
                <Chip key={c.value} active={cats.has(c.value)} onClick={() => toggleCat(c.value)}>
                  <span className="mr-1">{c.emoji}</span>
                  {c.label}
                </Chip>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
            {DURATION_BUCKETS.map((b) => (
              <Chip
                key={b.value}
                active={bucket === b.value}
                onClick={() => setBucket((v) => (v === b.value ? null : b.value))}
              >
                {b.label}
              </Chip>
            ))}
          </div>
          {countries.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
              {countries.map(([code, name]) => (
                <Chip
                  key={code}
                  active={country === code}
                  onClick={() => setCountry((v) => (v === code ? null : code))}
                >
                  {name}
                </Chip>
              ))}
            </div>
          )}
        </div>

        {filtered.length === 0 ? (
          <EmptyState hasTrips={trips.length > 0} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {filtered.map((t) => (
              <button
                key={t.id}
                onClick={() => router.push(`/trips/${t.id}`)}
                className="text-left bg-paper rounded-3xl border border-ink/5 shadow-soft overflow-hidden lift hover:shadow-sticker transition"
              >
                <TripCover photos={coversByTrip[t.id] ?? []} className="h-44 w-full" />
                <div className="p-4">
                  <div className="flex flex-wrap gap-1 mb-1.5">
                    {(t.categories ?? []).slice(0, 3).map((c) => {
                      const info = TRIP_CATEGORIES.find((x) => x.value === c);
                      if (!info) return null;
                      return (
                        <span
                          key={c}
                          className={"text-[10px] rounded-full px-2 py-0.5 " + info.tint}
                        >
                          {info.emoji} {info.label}
                        </span>
                      );
                    })}
                  </div>
                  <h3 className="serif text-2xl leading-tight">{t.title}</h3>
                  {t.meta && (
                    <p className="text-sm text-ink/65 mt-0.5 line-clamp-2">{t.meta}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2 text-xs text-ink/55">
                    {formatDuration(t.nights_min, t.nights_max) && (
                      <span>{formatDuration(t.nights_min, t.nights_max)}</span>
                    )}
                    {(t.countries ?? []).length > 0 && (
                      <span className="truncate">
                        · {(t.countries ?? []).map((c) => countryNames[c] ?? c).join(", ")}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {showAdd && (
          <AddTripDialog
            me={me}
            onClose={() => setShowAdd(false)}
            onSaved={(id) => {
              setShowAdd(false);
              router.push(`/trips/${id}`);
            }}
          />
        )}
      </main>
    </>
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

function EmptyState({ hasTrips }: { hasTrips: boolean }) {
  const noTripsMsg =
    'Leg deinen ersten Trip an — oder speicher ein einzelnes Reiseziel im Tab "Ideen".';
  return (
    <div className="text-center py-14">
      <Mascot size={96} className="text-ink mx-auto mb-3 bob" />
      <p className="serif text-2xl mb-1">
        {hasTrips ? "Nichts passt zum Filter." : "Noch kein Trip geplant."}
      </p>
      <p className="text-ink/55 text-sm max-w-md mx-auto">
        {hasTrips ? "Setz die Filter zurück oder leg einen neuen Trip an." : noTripsMsg}
      </p>
    </div>
  );
}
