/**
 * Gating audit repository — append-only denial events.
 *
 * Collection: tenants/{tenantId}/gateDenials/{autoId}
 *
 * Tenant admins may read for compliance review; only platformAdmin may write
 * (server-side via gating middleware).
 */

import {
  addDoc,
  collection,
  serverTimestamp,
  type Firestore,
} from "firebase/firestore";

import type { GateDenialAuditEvent } from "./model";

const denialsCol = (tenantId: string) => `tenants/${tenantId}/gateDenials`;

export type GatingAuditRepository = {
  recordDenial(event: GateDenialAuditEvent): Promise<void>;
};

export function createGatingAuditRepository(db: Firestore): GatingAuditRepository {
  async function recordDenial(event: GateDenialAuditEvent): Promise<void> {
    const ref = collection(db, denialsCol(event.tenantId));
    await addDoc(ref, { ...event, recordedAt: serverTimestamp() });
  }
  return { recordDenial };
}
