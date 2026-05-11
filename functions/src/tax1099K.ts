/**
 * functions/src/tax1099K.ts (W13-DEBT-3)
 *
 * Monthly scheduled Cloud Function that checks whether each tenant has
 * crossed the IRS 1099-K reporting threshold for the current calendar year.
 *
 * Threshold (2024+ IRS rules): gross payments ≥ $20,000 AND ≥ 200 transactions.
 *
 * When eligibility changes, the tenant doc is updated with:
 *   { eligible1099K: boolean }
 *
 * Invoices are expected to carry:
 *   amountUsd:    number   — gross payment amount in US dollars
 *   calendarYear: number   — the calendar year this invoice belongs to
 *
 * Schedule: first day of every month at 03:00 UTC.
 */

import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions";

if (getApps().length === 0) {
  initializeApp();
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const IRS_1099K_MIN_GROSS_USD = 20_000;
export const IRS_1099K_MIN_TRANSACTION_COUNT = 200;

// ---------------------------------------------------------------------------
// Pure business logic — unit-testable without Cloud Functions runtime
// ---------------------------------------------------------------------------

/**
 * Returns true when both reporting thresholds are met simultaneously.
 */
export function computeEligibility(grossUsd: number, count: number): boolean {
  return grossUsd >= IRS_1099K_MIN_GROSS_USD && count >= IRS_1099K_MIN_TRANSACTION_COUNT;
}

/**
 * Returns the UTC calendar year for the given Date (defaults to now).
 */
export function currentCalendarYear(now: Date = new Date()): number {
  return now.getUTCFullYear();
}

/**
 * Queries all invoices for a tenant in the given calendar year and returns
 * the aggregated gross amount and count.
 */
export async function aggregateTenantInvoices(
  db: FirebaseFirestore.Firestore,
  tenantId: string,
  year: number,
): Promise<{ grossUsd: number; count: number }> {
  const snap = await db
    .collection("tenants")
    .doc(tenantId)
    .collection("invoices")
    .where("calendarYear", "==", year)
    .get();

  const grossUsd = snap.docs.reduce((acc, doc) => {
    const data = doc.data();
    return acc + (typeof data.amountUsd === "number" ? data.amountUsd : 0);
  }, 0);

  return { grossUsd, count: snap.size };
}

export type CheckResult = { updated: string[]; skipped: string[] };

/**
 * Core handler — reads all tenants, evaluates 1099-K eligibility, and
 * updates the tenant doc only when the flag value changes.
 */
export async function run1099KCheck(
  db: FirebaseFirestore.Firestore,
  now: Date = new Date(),
): Promise<CheckResult> {
  const year = currentCalendarYear(now);
  const tenantsSnap = await db.collection("tenants").get();

  const updated: string[] = [];
  const skipped: string[] = [];

  await Promise.all(
    tenantsSnap.docs.map(async (tenantDoc) => {
      const tenantId = tenantDoc.id;
      const { grossUsd, count } = await aggregateTenantInvoices(db, tenantId, year);
      const eligible = computeEligibility(grossUsd, count);
      const currentFlag: boolean = tenantDoc.data().eligible1099K ?? false;

      if (eligible !== currentFlag) {
        await db.doc(`tenants/${tenantId}`).set({ eligible1099K: eligible }, { merge: true });
        updated.push(tenantId);
      } else {
        skipped.push(tenantId);
      }
    }),
  );

  return { updated, skipped };
}

// ---------------------------------------------------------------------------
// Scheduled Cloud Function
// ---------------------------------------------------------------------------

export const check1099KThreshold = onSchedule("0 3 1 * *", async () => {
  const db = getFirestore();
  const { updated, skipped } = await run1099KCheck(db);
  logger.info("1099-K threshold check complete", {
    updatedCount: updated.length,
    skippedCount: skipped.length,
    updatedTenants: updated,
  });
});
