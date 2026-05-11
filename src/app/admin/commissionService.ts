/**
 * W41-DEBT-2 — commissionService
 *
 * Load and save commission configuration per staff member.
 * Firestore path: `tenants/{tenantId}/staff/{staffId}/commissionConfig/current`
 *
 * Pattern mirrors all other admin service factories.
 */
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import type { Firestore } from "firebase/firestore";

import type { StaffCommissionConfig } from "./StaffCommissionScreen";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CommissionResult<T> = { ok: true; data: T } | { ok: false; message: string };

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createCommissionService(db?: Firestore) {
  async function loadConfig(
    staffId: string,
    tenantId: string,
  ): Promise<CommissionResult<StaffCommissionConfig | null>> {
    if (!db) return { ok: false, message: "Commission service not configured." };
    try {
      const ref = doc(
        db,
        "tenants",
        tenantId,
        "staff",
        staffId,
        "commissionConfig",
        "current",
      );
      const snap = await getDoc(ref);
      if (!snap.exists()) return { ok: true, data: null };
      const d = snap.data();
      return {
        ok: true,
        data: {
          commissionRate: (d["commissionRate"] as number) ?? 0,
          model: (d["model"] as StaffCommissionConfig["model"]) ?? "percentage",
          flatRateCents: (d["flatRateCents"] as number | null) ?? null,
          payoutSchedule:
            (d["payoutSchedule"] as StaffCommissionConfig["payoutSchedule"]) ?? "monthly",
          currency: (d["currency"] as string) ?? "EUR",
        },
      };
    } catch (err) {
      return {
        ok: false,
        message: err instanceof Error ? err.message : "Unable to load commission config.",
      };
    }
  }

  async function saveConfig(
    staffId: string,
    tenantId: string,
    config: StaffCommissionConfig,
  ): Promise<CommissionResult<void>> {
    if (!db) return { ok: false, message: "Commission service not configured." };
    if (config.commissionRate < 0 || config.commissionRate > 100) {
      return { ok: false, message: "Commission rate must be between 0 and 100." };
    }
    if (config.model === "flat_per_booking" && (config.flatRateCents ?? 0) < 0) {
      return { ok: false, message: "Flat rate must be zero or greater." };
    }
    try {
      const ref = doc(
        db,
        "tenants",
        tenantId,
        "staff",
        staffId,
        "commissionConfig",
        "current",
      );
      await setDoc(
        ref,
        { ...config, updatedAt: serverTimestamp() },
        { merge: true },
      );
      return { ok: true, data: undefined };
    } catch (err) {
      return {
        ok: false,
        message: err instanceof Error ? err.message : "Unable to save commission config.",
      };
    }
  }

  return { loadConfig, saveConfig };
}

export type CommissionService = ReturnType<typeof createCommissionService>;
