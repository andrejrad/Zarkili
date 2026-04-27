/**
 * Tax repository — caches Stripe Tax calculations per-tenant per-quote.
 *
 * Collection layout:
 *   tenants/{tenantId}/taxCalculations/{quoteId}    — TaxCalculation cache
 *   platform/taxCalculations/{quoteId}              — for platform SaaS quotes
 *
 * The quoteId is a stable hash of the request; reading the cache before the
 * `cacheExpiresAt` Timestamp returns the previous result and skips the API call.
 */

import {
  doc,
  getDoc,
  setDoc,
  type Firestore,
} from "firebase/firestore";

import type { TaxCalculation } from "./model";

const PLATFORM_TENANT = "__platform__";

const taxCol = (tenantId: string | null) =>
  tenantId ? `tenants/${tenantId}/taxCalculations` : `platform/${PLATFORM_TENANT}/taxCalculations`;

export type TaxRepository = {
  getCachedCalculation(
    tenantId: string | null,
    quoteId: string,
  ): Promise<TaxCalculation | null>;
  saveCalculation(tenantId: string | null, calc: TaxCalculation): Promise<void>;
};

export function createTaxRepository(db: Firestore): TaxRepository {
  async function getCachedCalculation(
    tenantId: string | null,
    quoteId: string,
  ): Promise<TaxCalculation | null> {
    const ref = doc(db, taxCol(tenantId), quoteId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return snap.data() as TaxCalculation;
  }

  async function saveCalculation(
    tenantId: string | null,
    calc: TaxCalculation,
  ): Promise<void> {
    const ref = doc(db, taxCol(tenantId), calc.quoteId);
    await setDoc(ref, calc);
  }

  return { getCachedCalculation, saveCalculation };
}
