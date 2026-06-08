"use client";

import { placeholderPhoto } from "@/lib/photos";

/**
 * Trip cover: a "best-of" collage of the trip's spot photos (Req 7.3).
 * Pass up to 4 photo URLs (already selected best-of). Renders a 1/2/3/4-up
 * grid; falls back to a placeholder when there are none.
 */
export default function TripCover({
  photos,
  className,
}: {
  photos: string[];
  className?: string;
}) {
  const pics = photos.slice(0, 4);

  if (pics.length === 0) {
    return (
      <div className={"bg-sand overflow-hidden " + (className ?? "")}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={placeholderPhoto()} alt="" className="w-full h-full object-cover" />
      </div>
    );
  }

  if (pics.length === 1) {
    return (
      <div className={"overflow-hidden " + (className ?? "")}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={pics[0]} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
      </div>
    );
  }

  const gridClass =
    pics.length === 2
      ? "grid-cols-2"
      : pics.length === 3
      ? "grid-cols-3"
      : "grid-cols-2 grid-rows-2";

  return (
    <div className={"grid gap-0.5 overflow-hidden " + gridClass + " " + (className ?? "")}>
      {pics.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i}
          src={src}
          alt=""
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      ))}
    </div>
  );
}
