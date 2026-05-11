/**
 * scheduledReportRepository.ts — W47
 *
 * Firestore persistence for owner-configured scheduled report deliveries.
 * Platform owner or tenant_owner configures a report type + cadence + email.
 * A Cloud Function (scheduledReportDispatcher) reads these and sends PDF/CSV
 * report emails on the configured cadence.
 *
 * Firestore path: tenants/{tenantId}/scheduledReports/{reportId}
 */

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  type Firestore,
} from "firebase/firestore";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ScheduledReportCadence = "daily" | "weekly" | "monthly";

export type ScheduledReportFormat = "csv" | "pdf";

export type ScheduledReportConfig = {
  reportId: string;
  tenantId: string;
  /** Display label (e.g. "Weekly Revenue Report") */
  label: string;
  /** Which analytics report to run */
  reportKey: string;
  cadence: ScheduledReportCadence;
  format: ScheduledReportFormat;
  /** Delivery email address */
  recipientEmail: string;
  /** ISO date string of last successful send */
  lastSentAt?: string;
  createdBy: string;
  createdAt: string;
  active: boolean;
};

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

type RepoResult<T> = { ok: true; data: T } | { ok: false; message: string };

// ---------------------------------------------------------------------------
// Repository interface
// ---------------------------------------------------------------------------

export type ScheduledReportRepository = {
  listScheduledReports(tenantId: string): Promise<ScheduledReportConfig[]>;
  createScheduledReport(
    config: Omit<ScheduledReportConfig, "reportId" | "createdAt">,
  ): Promise<RepoResult<ScheduledReportConfig>>;
  deleteScheduledReport(tenantId: string, reportId: string): Promise<RepoResult<void>>;
};

// ---------------------------------------------------------------------------
// Firestore adapter
// ---------------------------------------------------------------------------

const COLLECTION = "scheduledReports";

function toConfig(id: string, data: Record<string, unknown>): ScheduledReportConfig {
  return {
    reportId: id,
    tenantId: String(data.tenantId ?? ""),
    label: String(data.label ?? ""),
    reportKey: String(data.reportKey ?? ""),
    cadence: (data.cadence as ScheduledReportCadence) ?? "weekly",
    format: (data.format as ScheduledReportFormat) ?? "csv",
    recipientEmail: String(data.recipientEmail ?? ""),
    lastSentAt:
      data.lastSentAt &&
      typeof (data.lastSentAt as { toDate?: unknown }).toDate === "function"
        ? (data.lastSentAt as { toDate(): Date }).toDate().toISOString()
        : typeof data.lastSentAt === "string"
          ? data.lastSentAt
          : undefined,
    createdBy: String(data.createdBy ?? ""),
    createdAt:
      data.createdAt && typeof (data.createdAt as { toDate?: unknown }).toDate === "function"
        ? (data.createdAt as { toDate(): Date }).toDate().toISOString()
        : String(data.createdAt ?? ""),
    active: Boolean(data.active ?? true),
  };
}

export function createScheduledReportRepository(db: Firestore): ScheduledReportRepository {
  return {
    async listScheduledReports(tenantId) {
      const col = collection(db, "tenants", tenantId, COLLECTION);
      const snap = await getDocs(query(col, orderBy("createdAt", "desc")));
      return snap.docs.map((d) =>
        toConfig(d.id, d.data() as Record<string, unknown>),
      );
    },

    async createScheduledReport(config) {
      try {
        const col = collection(db, "tenants", config.tenantId, COLLECTION);
        const docRef = await addDoc(col, {
          ...config,
          active: true,
          createdAt: serverTimestamp(),
        });
        return {
          ok: true,
          data: { ...config, reportId: docRef.id, createdAt: new Date().toISOString(), active: true },
        };
      } catch (err) {
        return {
          ok: false,
          message: err instanceof Error ? err.message : "Failed to create scheduled report.",
        };
      }
    },

    async deleteScheduledReport(tenantId, reportId) {
      try {
        await deleteDoc(doc(db, "tenants", tenantId, COLLECTION, reportId));
        return { ok: true, data: undefined };
      } catch (err) {
        return {
          ok: false,
          message: err instanceof Error ? err.message : "Failed to delete scheduled report.",
        };
      }
    },
  };
}
