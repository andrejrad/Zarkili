/**
 * geohashTrigger.ts
 *
 * Cloud Function triggered by create/update of locations/{locationId}.
 *
 * When a location document has both address.lat and address.lng set,
 * computes the geohash (precision 9 ≈ 5m × 5m cell) using geofire-common
 * and writes it back to the document as the `geohash` field.
 *
 * This keeps the client free from geohash computation and ensures the field
 * is always in sync with the coordinate pair used for geo-queries.
 *
 * NOTE: geofire-common must be installed in the functions package.
 *   npm install geofire-common --save   (inside functions/)
 */

import { getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { logger } from "firebase-functions";
import { geohashForLocation } from "geofire-common";

if (getApps().length === 0) {
  initializeApp();
}

// ---------------------------------------------------------------------------
// Pure business logic — unit-testable without Cloud Functions runtime
// ---------------------------------------------------------------------------

export function computeGeohash(lat: number, lng: number): string {
  return geohashForLocation([lat, lng], 9);
}

// ---------------------------------------------------------------------------
// Cloud Function trigger
// ---------------------------------------------------------------------------

export const syncLocationGeohash = onDocumentWritten(
  "locations/{locationId}",
  async (event) => {
    const db = getFirestore();
    const { locationId } = event.params;

    const after = event.data?.after;
    if (!after?.exists) {
      // Document deleted — nothing to do.
      return;
    }

    const data = after.data() as Record<string, unknown>;
    const address = data.address as Record<string, unknown> | undefined;
    const lat = address?.lat;
    const lng = address?.lng;

    if (typeof lat !== "number" || typeof lng !== "number") {
      // No coordinates — clear geohash if one was previously set.
      if (data.geohash) {
        await db.collection("locations").doc(locationId).update({
          geohash: FieldValue.delete(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        logger.info("syncLocationGeohash: cleared geohash (no coords)", { locationId });
      }
      return;
    }

    const newGeohash = computeGeohash(lat, lng);
    if (data.geohash === newGeohash) {
      // No change — skip write to avoid infinite loop.
      return;
    }

    await db.collection("locations").doc(locationId).update({
      geohash: newGeohash,
      updatedAt: FieldValue.serverTimestamp(),
    });

    logger.info("syncLocationGeohash: wrote geohash", { locationId, geohash: newGeohash });
  },
);
