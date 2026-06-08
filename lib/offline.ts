"use client";

// Lightweight offline read-cache for trips (Req 9.2/9.3).
// Stores the last-loaded trip JSON in IndexedDB so a trip can be viewed
// read-only without a connection. Writing remains online-only in v1.

const DB_NAME = "tp-offline";
const STORE = "trips";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function cacheTripOffline(tripId: string, data: unknown): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put({ data, ts: Date.now() }, tripId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    /* best-effort */
  }
}

export async function readTripOffline<T = unknown>(tripId: string): Promise<T | null> {
  if (typeof indexedDB === "undefined") return null;
  try {
    const db = await openDb();
    const result = await new Promise<{ data: T } | null>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const r = tx.objectStore(STORE).get(tripId);
      r.onsuccess = () => resolve((r.result as { data: T }) ?? null);
      r.onerror = () => reject(r.error);
    });
    db.close();
    return result?.data ?? null;
  } catch {
    return null;
  }
}
