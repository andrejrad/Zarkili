/**
 * zaraMigration.ts
 *
 * Bootstrap / migration script for Zara → Tenant 1 on new platform.
 *
 * What this script does (idempotent — safe to re-run):
 *   1. Creates the Zara tenant record (skips if already exists)
 *   2. Creates the primary location (skips if already exists)
 *   3. Maps legacy users into tenantUsers (skips existing memberships)
 *   4. Backfills bookings with tenantId + locationId (skips already-tagged)
 *   5. Migrates loyalty balances + transactions (idempotency via idempotencyKey)
 *   6. Produces a structured summary report with counts and mismatches
 *
 * Usage:
 *   import { runZaraMigration } from './zaraMigration';
 *   await runZaraMigration(db, zaraMigrationInput, console.log);
 *
 * Idempotency strategy:
 *   - Tenant + location: checked by ID before write
 *   - TenantUser memberships: checked by membershipId before write
 *   - Booking backfill: skips rows where tenantId already equals ZARA_TENANT_ID
 *   - Loyalty transactions: uses idempotencyKey = 'migrate_' + legacyTxId
 *
 * Rollback:
 *   Full rollback requires deleting the tenant, location, and tenantUser docs
 *   written with migrationRun = the runId in the summary report.
 *   Booking and loyalty mutations stamp migrationRunId so they are queryable.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Firestore,
} from "firebase/firestore";

import type { Tenant, TenantBranding, TenantSettings } from "../../domains/tenants/model";
import type { Location } from "../../domains/locations/model";
import type { TenantUser, TenantUserRole } from "../../domains/tenants/tenantUsersModel";
import type { Booking } from "../../domains/bookings/model";
import type { CustomerLoyaltyState, LoyaltyTransaction } from "../../domains/loyalty/model";

// ---------------------------------------------------------------------------
// Public input types
// ---------------------------------------------------------------------------

export type LegacyUser = {
  userId: string;
  displayName: string;
  email: string | null;
  role: TenantUserRole;
};

export type LegacyBooking = {
  bookingId: string;
  /** If null, migration will use PLACEHOLDER_STAFF_ID */
  staffId: string | null;
  serviceId: string;
  customerUserId: string;
  date: string;
  startMinutes: number;
  endMinutes: number;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  bufferMinutes: number;
  status: Booking["status"];
  notes: string | null;
};

export type LegacyLoyaltyBalance = {
  userId: string;
  points: number;
  lifetimePoints: number;
};

export type LegacyLoyaltyTransaction = {
  legacyTxId: string;
  userId: string;
  type: "credit" | "debit";
  points: number;
  reason: string;
  referenceId: string;
  createdAtIso: string;
};

export type ZaraMigrationInput = {
  /** A short unique identifier for this migration run; used for stamping */
  runId: string;
  tenant: {
    tenantId: string;
    name: string;
    slug: string;
    ownerUserId: string;
    country: string;
    timezone: string;
    defaultLanguage: string;
    defaultCurrency: string;
    plan: Tenant["plan"];
    branding: TenantBranding;
    settings: TenantSettings;
  };
  location: {
    locationId: string;
    name: string;
    code: string;
    timezone: string;
    phone: string | null;
    email: string | null;
    address: Location["address"];
    operatingHours: Location["operatingHours"];
  };
  users: LegacyUser[];
  bookings: LegacyBooking[];
  loyaltyBalances: LegacyLoyaltyBalance[];
  loyaltyTransactions: LegacyLoyaltyTransaction[];
  /** Staff ID to use when a legacy booking has no staffId */
  placeholderStaffId: string;
};

// ---------------------------------------------------------------------------
// Summary report type
// ---------------------------------------------------------------------------

export type MigrationSummary = {
  runId: string;
  completedAt: string;
  tenant: { created: boolean; tenantId: string };
  location: { created: boolean; locationId: string };
  users: {
    total: number;
    created: number;
    skipped: number;
    mismatches: { userId: string; reason: string }[];
  };
  bookings: {
    total: number;
    backfilled: number;
    skipped: number;
    errors: { bookingId: string; reason: string }[];
  };
  loyalty: {
    balancesWritten: number;
    transactionsWritten: number;
    transactionsSkipped: number;
  };
  overallStatus: "success" | "partial" | "failed";
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const TENANT_USERS_COL = "tenantUsers";
const BOOKINGS_COL = "bookings";

function tenantUserDocId(tenantId: string, userId: string): string {
  return `${tenantId}_${userId}`;
}

function loyaltyStatesCol(tenantId: string): string {
  return `tenants/${tenantId}/loyaltyStates`;
}

function loyaltyTxCol(tenantId: string): string {
  return `tenants/${tenantId}/loyaltyTransactions`;
}

function loyaltyIdempCol(tenantId: string): string {
  return `tenants/${tenantId}/loyaltyIdempotency`;
}

// ---------------------------------------------------------------------------
// Migration runner
// ---------------------------------------------------------------------------

export async function runZaraMigration(
  db: Firestore,
  input: ZaraMigrationInput,
  log: (message: string) => void = () => {},
): Promise<MigrationSummary> {
  const { runId, tenant, location, users, bookings, loyaltyBalances, loyaltyTransactions, placeholderStaffId } = input;
  const summary: MigrationSummary = {
    runId,
    completedAt: "",
    tenant: { created: false, tenantId: tenant.tenantId },
    location: { created: false, locationId: location.locationId },
    users: { total: users.length, created: 0, skipped: 0, mismatches: [] },
    bookings: { total: bookings.length, backfilled: 0, skipped: 0, errors: [] },
    loyalty: { balancesWritten: 0, transactionsWritten: 0, transactionsSkipped: 0 },
    overallStatus: "success",
  };

  // ── Step 1: Create tenant record ────────────────────────────────────────
  log(`[${runId}] Step 1: tenant record`);
  const tenantRef = doc(db, "tenants", tenant.tenantId);
  const tenantSnap = await getDoc(tenantRef);
  if (tenantSnap.exists()) {
    log(`  SKIP tenant ${tenant.tenantId} already exists`);
  } else {
    const tenantData = {
      ...tenant,
      status: "active",
      migrationRunId: runId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(tenantRef, tenantData);
    summary.tenant.created = true;
    log(`  CREATED tenant ${tenant.tenantId}`);
  }

  // ── Step 2: Create primary location ─────────────────────────────────────
  log(`[${runId}] Step 2: Primary location`);
  const locRef = doc(db, "locations", location.locationId);
  const locSnap = await getDoc(locRef);
  if (locSnap.exists()) {
    log(`  SKIP location ${location.locationId} already exists`);
  } else {
    const locData = {
      ...location,
      tenantId: tenant.tenantId,
      status: "active",
      migrationRunId: runId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(locRef, locData);
    summary.location.created = true;
    log(`  CREATED location ${location.locationId}`);
  }

  // ── Step 3: Map users into tenantUsers ──────────────────────────────────
  log(`[${runId}] Step 3: ${users.length} users`);
  // Process in batches of 400 (Firestore batch limit 500)
  const USER_BATCH_SIZE = 400;
  for (let i = 0; i < users.length; i += USER_BATCH_SIZE) {
    const chunk = users.slice(i, i + USER_BATCH_SIZE);
    const batch = writeBatch(db);
    for (const user of chunk) {
      const membershipId = tenantUserDocId(tenant.tenantId, user.userId);
      const memberRef = doc(db, TENANT_USERS_COL, membershipId);
      const existSnap = await getDoc(memberRef);
      if (existSnap.exists()) {
        summary.users.skipped++;
        continue;
      }
      if (!user.userId || !user.role) {
        summary.users.mismatches.push({ userId: user.userId ?? "(missing)", reason: "missing userId or role" });
        continue;
      }
      const memberData: Omit<TenantUser, "subscription"> & { subscription: null; migrationRunId: string } = {
        membershipId,
        tenantId: tenant.tenantId,
        userId: user.userId,
        role: user.role,
        permissions: [],
        status: "active",
        subscription: null,
        migrationRunId: runId,
        createdAt: serverTimestamp() as never,
        updatedAt: serverTimestamp() as never,
      };
      batch.set(memberRef, memberData);
      summary.users.created++;
    }
    await batch.commit();
  }
  log(`  created=${summary.users.created} skipped=${summary.users.skipped} mismatches=${summary.users.mismatches.length}`);

  // ── Step 4: Backfill bookings ────────────────────────────────────────────
  log(`[${runId}] Step 4: ${bookings.length} bookings`);
  const BOOKING_BATCH_SIZE = 400;
  for (let i = 0; i < bookings.length; i += BOOKING_BATCH_SIZE) {
    const chunk = bookings.slice(i, i + BOOKING_BATCH_SIZE);
    const batch = writeBatch(db);
    for (const lb of chunk) {
      const bookingRef = doc(db, BOOKINGS_COL, lb.bookingId);
      let existSnap: Awaited<ReturnType<typeof getDoc>>;
      try {
        existSnap = await getDoc(bookingRef);
      } catch (err) {
        summary.bookings.errors.push({
          bookingId: lb.bookingId,
          reason: err instanceof Error ? err.message : "read error",
        });
        continue;
      }
      if (existSnap.exists()) {
        const data = existSnap.data() as Partial<Booking>;
        if (data.tenantId === tenant.tenantId) {
          summary.bookings.skipped++;
          continue;
        }
      }
      const bookingData: Booking & { migrationRunId: string } = {
        bookingId: lb.bookingId,
        tenantId: tenant.tenantId,
        locationId: location.locationId,
        staffId: lb.staffId ?? placeholderStaffId,
        serviceId: lb.serviceId,
        customerUserId: lb.customerUserId,
        date: lb.date,
        startMinutes: lb.startMinutes,
        endMinutes: lb.endMinutes,
        startTime: lb.startTime,
        endTime: lb.endTime,
        durationMinutes: lb.durationMinutes,
        bufferMinutes: lb.bufferMinutes,
        status: lb.status,
        notes: lb.notes,
        version: 1,
        lifecycleEvents: [],
        createdAt: serverTimestamp() as never,
        updatedAt: serverTimestamp() as never,
        migrationRunId: runId,
      };
      batch.set(bookingRef, bookingData);
      summary.bookings.backfilled++;
    }
    await batch.commit();
  }
  log(`  backfilled=${summary.bookings.backfilled} skipped=${summary.bookings.skipped} errors=${summary.bookings.errors.length}`);

  // ── Step 5: Migrate loyalty balances ────────────────────────────────────
  log(`[${runId}] Step 5: ${loyaltyBalances.length} loyalty balances`);
  const LOYALTY_BATCH_SIZE = 400;
  for (let i = 0; i < loyaltyBalances.length; i += LOYALTY_BATCH_SIZE) {
    const chunk = loyaltyBalances.slice(i, i + LOYALTY_BATCH_SIZE);
    const batch = writeBatch(db);
    for (const lb of chunk) {
      const stateRef = doc(db, loyaltyStatesCol(tenant.tenantId), lb.userId);
      const stateData: Omit<CustomerLoyaltyState, "enrolledAt" | "updatedAt"> & {
        enrolledAt: ReturnType<typeof serverTimestamp>;
        updatedAt: ReturnType<typeof serverTimestamp>;
        migrationRunId: string;
      } = {
        userId: lb.userId,
        tenantId: tenant.tenantId,
        points: lb.points,
        lifetimePoints: lb.lifetimePoints,
        currentTierId: null,
        enrolledAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        migrationRunId: runId,
      };
      batch.set(stateRef, stateData, { merge: true });
      summary.loyalty.balancesWritten++;
    }
    await batch.commit();
  }

  // ── Step 5b: Migrate loyalty transactions ───────────────────────────────
  log(`[${runId}] Step 5b: ${loyaltyTransactions.length} loyalty transactions`);
  for (let i = 0; i < loyaltyTransactions.length; i += LOYALTY_BATCH_SIZE) {
    const chunk = loyaltyTransactions.slice(i, i + LOYALTY_BATCH_SIZE);
    const batch = writeBatch(db);
    for (const lt of chunk) {
      const idempKey = `migrate_${lt.legacyTxId}`;
      const idempRef = doc(db, loyaltyIdempCol(tenant.tenantId), idempKey);
      const idempSnap = await getDoc(idempRef);
      if (idempSnap.exists()) {
        summary.loyalty.transactionsSkipped++;
        continue;
      }
      const txId = `migrated_${lt.legacyTxId}`;
      const txRef = doc(db, loyaltyTxCol(tenant.tenantId), txId);
      const txData: LoyaltyTransaction & { migrationRunId: string } = {
        txId,
        userId: lt.userId,
        tenantId: tenant.tenantId,
        type: lt.type,
        points: lt.points,
        reason: lt.reason,
        referenceId: lt.referenceId,
        idempotencyKey: idempKey,
        createdAt: serverTimestamp() as never,
        migrationRunId: runId,
      };
      batch.set(txRef, txData);
      batch.set(idempRef, { txId, createdAt: serverTimestamp() });
      summary.loyalty.transactionsWritten++;
    }
    await batch.commit();
  }
  log(`  balances=${summary.loyalty.balancesWritten} tx_written=${summary.loyalty.transactionsWritten} tx_skipped=${summary.loyalty.transactionsSkipped}`);

  // ── Summary ──────────────────────────────────────────────────────────────
  summary.completedAt = new Date().toISOString();
  const hasErrors =
    summary.users.mismatches.length > 0 ||
    summary.bookings.errors.length > 0;
  summary.overallStatus = hasErrors ? "partial" : "success";

  log(`[${runId}] Migration complete — status=${summary.overallStatus}`);
  return summary;
}
