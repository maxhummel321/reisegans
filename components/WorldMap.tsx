"use client";

import { useEffect, useRef } from "react";
import { APIProvider, Map, AdvancedMarker, Pin, useMap } from "@vis.gl/react-google-maps";

export type MapPoint = {
  id: string;
  lat: number;
  lng: number;
  title?: string;
  pinColor?: string;
  pinGlyph?: string;
  glyph?: string;
  order?: number; // used for route ordering
};

const WORLD_CENTER = { lat: 30, lng: 10 };

export default function WorldMap({
  points,
  selectedId,
  onSelect,
  showRoute = false,
  className,
  mapId,
}: {
  points: MapPoint[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  showRoute?: boolean;
  className?: string;
  mapId?: string;
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

  if (!apiKey) {
    return (
      <div className="grid place-items-center h-full p-8 text-center">
        <p className="text-ink/60 text-sm">
          Karte braucht <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>.
        </p>
      </div>
    );
  }

  const placed = points.filter((p) => p.lat != null && p.lng != null);

  return (
    <div className={"rounded-3xl overflow-hidden border border-ink/10 shadow-soft " + (className ?? "")}>
      <APIProvider apiKey={apiKey}>
        <Map
          mapId={mapId ?? "travel-planner-map"}
          defaultCenter={WORLD_CENTER}
          defaultZoom={2}
          gestureHandling="greedy"
          disableDefaultUI={false}
          colorScheme="LIGHT"
          clickableIcons={false}
        >
          {placed.map((p) => {
            const isSelected = p.id === selectedId;
            return (
              <AdvancedMarker
                key={p.id}
                position={{ lat: p.lat, lng: p.lng }}
                onClick={() => onSelect?.(p.id)}
                title={p.title}
                zIndex={isSelected ? 1000 : 1}
              >
                <div className="relative inline-block" style={{ color: "#22201b" }}>
                  {isSelected && (
                    <span className="pulse-ring absolute inset-0 rounded-full" aria-hidden />
                  )}
                  <Pin
                    background={isSelected ? "#22201b" : p.pinColor ?? "#c8623f"}
                    borderColor="#22201b"
                    glyphColor={isSelected ? "#fdf8ee" : p.pinGlyph ?? "#fdf8ee"}
                    glyph={p.glyph ?? "📍"}
                    scale={isSelected ? 1.3 : 1}
                  />
                </div>
              </AdvancedMarker>
            );
          })}
          <BoundsFitter points={placed} />
          {showRoute && <RouteLine points={placed} />}
        </Map>
      </APIProvider>
    </div>
  );
}

/** Fit the viewport to all points. */
function BoundsFitter({ points }: { points: MapPoint[] }) {
  const map = useMap();
  const sig = points.map((p) => p.id).sort().join(",");

  useEffect(() => {
    if (!map) return;
    if (points.length === 0) {
      map.panTo(WORLD_CENTER);
      map.setZoom(2);
      return;
    }
    if (points.length === 1) {
      map.panTo({ lat: points[0].lat, lng: points[0].lng });
      map.setZoom(9);
      return;
    }
    const bounds = new google.maps.LatLngBounds();
    for (const p of points) bounds.extend({ lat: p.lat, lng: p.lng });
    map.fitBounds(bounds, 60);
    const onIdle = google.maps.event.addListenerOnce(map, "idle", () => {
      const z = map.getZoom() ?? 2;
      if (z > 14) map.setZoom(14);
    });
    return () => google.maps.event.removeListener(onIdle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, sig]);

  return null;
}

/**
 * Draw a simple polyline connecting the points in their `order` (Req 4.11/4.12).
 * No Directions API — straight geodesic lines between stops.
 */
function RouteLine({ points }: { points: MapPoint[] }) {
  const map = useMap();
  const lineRef = useRef<google.maps.Polyline | null>(null);

  const ordered = [...points].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const sig = ordered.map((p) => `${p.id}:${p.order ?? 0}`).join(",");

  useEffect(() => {
    if (!map) return;
    // Clear any previous line.
    if (lineRef.current) {
      lineRef.current.setMap(null);
      lineRef.current = null;
    }
    if (ordered.length < 2) return;

    lineRef.current = new google.maps.Polyline({
      path: ordered.map((p) => ({ lat: p.lat, lng: p.lng })),
      geodesic: true,
      strokeColor: "#c8623f",
      strokeOpacity: 0.9,
      strokeWeight: 3,
      icons: [
        {
          icon: { path: "M 0,-1 0,1", strokeOpacity: 1, scale: 3 },
          offset: "0",
          repeat: "14px",
        },
      ],
    });
    lineRef.current.setMap(map);

    return () => {
      if (lineRef.current) {
        lineRef.current.setMap(null);
        lineRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, sig]);

  return null;
}
