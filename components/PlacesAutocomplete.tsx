"use client";

import { useEffect, useRef, useState } from "react";

export type PlacePick = {
  name: string;
  address: string;
  country: string | null;
  countryCode: string | null; // ISO-3166-1 alpha-2 (uppercase)
  lat: number;
  lng: number;
  placeId: string;
  website: string | null;
  photoNames: string[]; // up to a few Places API photo resource names
};

declare global {
  interface Window {
    google?: any;
    __gmLoadingPromise?: Promise<void>;
  }
}

function loadGoogleMaps(apiKey: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.maps?.importLibrary) return Promise.resolve();
  if (window.__gmLoadingPromise) return window.__gmLoadingPromise;

  window.__gmLoadingPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-google-maps]");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Google Maps load failed")));
      return;
    }
    const s = document.createElement("script");
    s.async = true;
    s.dataset.googleMaps = "true";
    s.text =
      "(g=>{var h,a,k,p='The Google Maps JavaScript API',c='google',l='importLibrary',q='__ib__',m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await (a=m.createElement('script'));e.set('libraries',[...r]+'');for(k in g)e.set(k.replace(/[A-Z]/g,t=>'_'+t[0].toLowerCase()),g[k]);e.set('callback',c+'.maps.'+q);a.src='https://maps.'+c+'apis.com/maps/api/js?'+e;d[q]=f;a.onerror=()=>h=n(Error(p+' could not load.'));a.nonce=m.querySelector('script[nonce]')?.nonce||'';m.head.append(a)}));d[l]?console.warn(p+' only loads once. Ignoring:',g):d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))})({" +
      `key:${JSON.stringify(apiKey)},v:'weekly',language:'de'});`;
    s.onerror = () => reject(new Error("Google Maps load failed"));
    document.head.appendChild(s);
    const start = Date.now();
    const tick = () => {
      if (window.google?.maps?.importLibrary) return resolve();
      if (Date.now() - start > 10000) return reject(new Error("Google Maps timeout"));
      setTimeout(tick, 50);
    };
    tick();
  });

  return window.__gmLoadingPromise;
}

function pickCountry(components: any[]): { name: string | null; code: string | null } {
  const c = components.find((x: any) => {
    const ts: string[] = x.types ?? [];
    return ts.includes("country");
  });
  if (!c) return { name: null, code: null };
  const name = c.long_name ?? c.longText ?? null;
  const code = (c.short_name ?? c.shortText ?? null)?.toUpperCase() ?? null;
  return { name, code };
}

type Suggestion = {
  placeId: string;
  primary: string;
  secondary: string;
};

export default function PlacesAutocomplete({
  onPick,
  placeholder,
}: {
  onPick: (p: PlacePick) => void;
  placeholder?: string;
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionTokenRef = useRef<any>(null);
  const debounceRef = useRef<number | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [picked, setPicked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!apiKey) {
      setError("Kein Google-Maps-API-Key konfiguriert.");
      return;
    }
    loadGoogleMaps(apiKey)
      .then(async () => {
        if (cancelled || !window.google?.maps) return;
        await window.google.maps.importLibrary("places");
        if (cancelled) return;
        sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
        setReady(true);
      })
      .catch((e) => setError(e?.message ?? "Konnte Google Maps nicht laden."));
    return () => {
      cancelled = true;
    };
  }, [apiKey]);

  // Debounced suggestion lookup — worldwide, no location restriction.
  useEffect(() => {
    if (!ready) return;
    if (picked) return;
    if (query.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      const places = window.google?.maps?.places;
      if (!places?.AutocompleteSuggestion) return;
      try {
        const { suggestions } = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: query.trim(),
          sessionToken: sessionTokenRef.current,
          language: "de",
        });

        const out: Suggestion[] = (suggestions ?? [])
          .map((s: any) => {
            const p = s.placePrediction;
            if (!p) return null;
            const placeId = p.placeId ?? p.place?.id ?? p.place ?? "";
            const sf = p.structuredFormat;
            const primary =
              sf?.mainText?.text ?? p.mainText?.text ?? p.text?.text ?? p.text ?? "";
            const secondary = sf?.secondaryText?.text ?? p.secondaryText?.text ?? "";
            if (!placeId || !primary) return null;
            return { placeId, primary, secondary };
          })
          .filter(Boolean) as Suggestion[];

        setResults(out);
        setOpen(out.length > 0);
        setActiveIdx(0);
      } catch (err: any) {
        console.warn("autocomplete failed:", err?.message ?? err);
        setResults([]);
        setOpen(false);
      }
    }, 220);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, ready]);

  async function handleSelect(s: Suggestion) {
    if (!window.google?.maps?.places) return;
    setPicked(true);
    setOpen(false);
    setQuery(s.primary);
    try {
      const place = new window.google.maps.places.Place({
        id: s.placeId,
        requestedLanguage: "de",
      });
      await place.fetchFields({
        fields: [
          "id",
          "displayName",
          "formattedAddress",
          "location",
          "addressComponents",
          "photos",
          "websiteURI",
        ],
      });
      const loc = place.location;
      if (!loc) return;
      const photos = Array.isArray(place.photos) ? place.photos : [];
      const photoNames = photos
        .map((p: any) => p?.name)
        .filter((n: any): n is string => typeof n === "string")
        .slice(0, 6);
      const { name: country, code: countryCode } = pickCountry(
        place.addressComponents ?? [],
      );
      onPick({
        name: place.displayName ?? s.primary,
        address: place.formattedAddress ?? s.secondary,
        country,
        countryCode,
        lat: typeof loc.lat === "function" ? loc.lat() : loc.lat,
        lng: typeof loc.lng === "function" ? loc.lng() : loc.lng,
        placeId: place.id ?? s.placeId,
        website: place.websiteURI ?? null,
        photoNames,
      });
      sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
    } catch (err: any) {
      setError(err?.message ?? "Konnte Ort nicht laden.");
    }
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const s = results[activeIdx];
      if (s) handleSelect(s);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => {
          setPicked(false);
          setQuery(e.target.value);
        }}
        onFocus={() => {
          if (results.length > 0) setOpen(true);
        }}
        onBlur={() => {
          setTimeout(() => setOpen(false), 150);
        }}
        onKeyDown={onKey}
        placeholder={placeholder ?? "Ort, Stadt, Land suchen …"}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        className="w-full rounded-xl bg-white border border-ink/10 px-4 py-3 outline-none focus:border-terracotta transition"
      />

      {!ready && !error && <p className="text-xs text-ink/40 mt-1">Suche lädt …</p>}
      {error && <p className="text-xs text-rose mt-1">{error}</p>}

      {open && results.length > 0 && (
        <div className="absolute z-30 left-0 right-0 mt-1 bg-paper border border-ink/10 rounded-xl shadow-sticker overflow-hidden">
          {results.map((s, i) => (
            <button
              key={s.placeId}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(s)}
              className={
                "w-full text-left px-4 py-2.5 transition flex flex-col gap-0 " +
                (i === activeIdx ? "bg-ink/5" : "hover:bg-ink/5")
              }
            >
              <span className="text-sm text-ink font-medium truncate">{s.primary}</span>
              {s.secondary && (
                <span className="text-xs text-ink/55 truncate">{s.secondary}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
