"use client";

import { useEffect } from "react";
import { cachePublicEmergencySnapshot } from "@/lib/pwa/emergency-snapshot-cache";
import type { PublicEmergencySnapshot } from "@/types/pwa";

/**
 * Writes the latest public emergency snapshot after an online page render.
 * It renders no UI and never receives personal user data.
 */
export default function PublicEmergencySnapshotCache({
  snapshot,
}: {
  snapshot: PublicEmergencySnapshot;
}) {
  useEffect(() => {
    if (!navigator.onLine) return;

    cachePublicEmergencySnapshot(snapshot).catch((error) => {
      console.error("Failed to cache public emergency snapshot:", error);
    });
  }, [snapshot]);

  return null;
}
