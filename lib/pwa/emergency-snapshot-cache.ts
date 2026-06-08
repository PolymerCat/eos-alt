import type { PublicEmergencySnapshot } from "@/types/pwa";

const DATABASE_NAME = "emergency-os-offline";
const DATABASE_VERSION = 1;
const SNAPSHOT_STORE = "public-emergency-snapshots";
const LATEST_SNAPSHOT_KEY = "latest";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(SNAPSHOT_STORE)) {
        database.createObjectStore(SNAPSHOT_STORE);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Unable to open offline database."));
  });
}

/**
 * Stores only the public emergency snapshot. The caller is responsible for
 * constructing the snapshot through the PublicEmergencySnapshot contract.
 */
export async function cachePublicEmergencySnapshot(
  snapshot: PublicEmergencySnapshot
): Promise<void> {
  if (typeof indexedDB === "undefined") return;

  const database = await openDatabase();

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(SNAPSHOT_STORE, "readwrite");
    transaction.objectStore(SNAPSHOT_STORE).put(snapshot, LATEST_SNAPSHOT_KEY);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("Unable to cache emergency snapshot."));
  });

  database.close();
}

export async function readPublicEmergencySnapshot(): Promise<PublicEmergencySnapshot | null> {
  if (typeof indexedDB === "undefined") return null;

  const database = await openDatabase();

  const snapshot = await new Promise<PublicEmergencySnapshot | null>((resolve, reject) => {
    const transaction = database.transaction(SNAPSHOT_STORE, "readonly");
    const request = transaction.objectStore(SNAPSHOT_STORE).get(LATEST_SNAPSHOT_KEY);

    request.onsuccess = () => resolve((request.result as PublicEmergencySnapshot | undefined) ?? null);
    request.onerror = () =>
      reject(request.error ?? new Error("Unable to read cached emergency snapshot."));
  });

  database.close();
  return snapshot;
}
