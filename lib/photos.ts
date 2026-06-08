// Photo helpers for Travel Planner.
//
// Photos are cached into the public `tp-photos` bucket and recorded in the
// tp_photos table (one row per photo). We always serve the cached Storage URL.

import type { PhotoOwnerType } from "./types";

const PLACEHOLDER = "/placeholder-postcard.svg";

/** A neutral placeholder for owners without any cached photo. */
export function placeholderPhoto(): string {
  return PLACEHOLDER;
}

/**
 * Kick off server-side caching of multiple Google photos for an owner.
 * Best-effort, fire-and-forget.
 */
export async function cachePhotos(args: {
  ownerType: PhotoOwnerType;
  ownerId: string;
  photoNames?: string[];
  googlePlaceId?: string | null;
}): Promise<void> {
  try {
    await fetch("/api/photos/cache", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ownerType: args.ownerType,
        ownerId: args.ownerId,
        photoNames: args.photoNames ?? [],
        googlePlaceId: args.googlePlaceId ?? undefined,
      }),
    });
  } catch {
    /* ignore */
  }
}
