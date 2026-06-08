"use client";

import { useEffect, useState } from "react";
import { placeholderPhoto } from "@/lib/photos";

/**
 * Trip cover: an auto-rotating carousel of the trip's spot photos.
 * Crossfades through the photos so the header always shows a full,
 * un-cropped image (object-cover, single image at a time).
 */
export default function TripCover({
  photos,
  className,
  interval = 3500,
}: {
  photos: string[];
  className?: string;
  interval?: number;
}) {
  const pics = photos.filter(Boolean);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (pics.length < 2) return;
    const t = setInterval(() => {
      setIdx((i) => (i + 1) % pics.length);
    }, interval);
    return () => clearInterval(t);
  }, [pics.length, interval]);

  if (pics.length === 0) {
    return (
      <div className={"bg-sand overflow-hidden " + (className ?? "")}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={placeholderPhoto()} alt="" className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div className={"relative overflow-hidden bg-sand " + (className ?? "")}>
      {pics.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i}
          src={src}
          alt=""
          referrerPolicy="no-referrer"
          className={
            "absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 " +
            (i === idx ? "opacity-100" : "opacity-0")
          }
        />
      ))}
      {/* keep layout height with an invisible spacer image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={pics[0]} alt="" className="w-full h-full object-cover invisible" />

      {pics.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
          {pics.map((_, i) => (
            <span
              key={i}
              className={
                "w-1.5 h-1.5 rounded-full transition " +
                (i === idx ? "bg-white shadow" : "bg-white/50")
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
