import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  type Firestore,
} from "firebase/firestore";
import type {
  TenantRecord,
  TenantFilter,
  CrossTenantKpi,
  PlatformHealthSignal,
  PricingPlan,
  PlatformAuditEntry,
  PlatformAuditFilter,
  ModerationQueueItem,
  ModerationItemStatus,
  TenantAiBudgetOverride,
  MigrationJob,
  MigrationJobStatus,
  BackupJob,
  SecurityEvent,
  SecurityEventFilter,
  DataExportRequest,
  ConsentPolicyEntry,
  IncidentRecord,
} from "./platformAdminTypes";

// ---------------------------------------------------------------------------
// RBAC
// ---------------------------------------------------------------------------

const ALLOWED_ROLES: string[] = ["platform_admin"];

function assertPlatformAdmin(role: string): void {
  if (!ALLOWED_ROLES.includes(role)) {
    throw new Error("FORBIDDEN: platform_admin role required");
  }
}

// ---------------------------------------------------------------------------
// Service factory
// ---------------------------------------------------------------------------

export function createPlatformAdminService(db: Firestore) {
  // ---- Tenant Directory ----

  async function listTenants(
    actorRole: string,
    filter?: TenantFilter
  ): Promise<TenantRecord[]> {
    assertPlatformAdmin(actorRole);
    const col = collection(db, "tenants");
    let q = query(col, orderBy("createdAt", "desc"), limit(200));
    if (filter?.status) {
      q = query(col, where("status", "==", filter.status), orderBy("createdAt", "desc"), limit(200));
    }
    const snap = await getDocs(q);
    const results: TenantRecord[] = snap.docs.map((d) => ({
      tenantId: d.id,
      ...(d.data() as Omit<TenantRecord, "tenantId">),
    }));
    if (filter?.query) {
      const q2 = filter.query.toLowerCase();
      return results.filter(
        (t) =>
          t.displayName.toLowerCase().includes(q2) ||
          t.ownerEmail.toLowerCase().includes(q2)
      );
    }
    return results;
  }

  async function getTenant(
    actorRole: string,
    tenantId: string
  ): Promise<TenantRecord | null> {
    assertPlatformAdmin(actorRole);
    const snap = await getDoc(doc(db, "tenants", tenantId));
    if (!snap.exists()) return null;
    return { tenantId: snap.id, ...(snap.data() as Omit<TenantRecord, "tenantId">) };
  }

  async function suspendTenant(
    actorRole: string,
    tenantId: string,
    reason: string,
    actorId: string
  ): Promise<void> {
    assertPlatformAdmin(actorRole);
    const ref = doc(db, "tenants", tenantId);
    await updateDoc(ref, {
      status: "suspended",
      suspendReason: reason,
      suspendedAt: new Date().toISOString(),
    });
    await addDoc(collection(db, "platformAuditLog"), {
      actorId,
      actorKind: "platform_admin",
      action: "tenant.suspended",
      targetKind: "tenant",
      targetId: tenantId,
      detail: reason,
      occurredAt: serverTimestamp(),
    });
  }

  async function reactivateTenant(
    actorRole: string,
    tenantId: string,
    actorId: string
  ): Promise<void> {
    assertPlatformAdmin(actorRole);
    const ref = doc(db, "tenants", tenantId);
    await updateDoc(ref, {
      status: "active",
      suspendReason: null,
      suspendedAt: null,
    });
    await addDoc(collection(db, "platformAuditLog"), {
      actorId,
      actorKind: "platform_admin",
      action: "tenant.reactivated",
      targetKind: "tenant",
      targetId: tenantId,
      occurredAt: serverTimestamp(),
    });
  }

  async function updateTenantSupportNotes(
    actorRole: string,
    tenantId: string,
    notes: string
  ): Promise<void> {
    assertPlatformAdmin(actorRole);
    await updateDoc(doc(db, "tenants", tenantId), { supportNotes: notes });
  }

  // ---- Cross-Tenant Analytics ----

  async function getCrossTenantKpi(actorRole: string): Promise<CrossTenantKpi> {
    assertPlatformAdmin(actorRole);
    const snap = await getDocs(collection(db, "tenants"));
    let active = 0, trial = 0, suspended = 0, churned = 0, totalRevenue = 0, totalHealth = 0;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    let newThisMonth = 0;
    let churnedThisMonth = 0;
    snap.docs.forEach((d) => {
      const data = d.data() as Partial<TenantRecord>;
      if (data.status === "active") active++;
      else if (data.status === "trial") trial++;
      else if (data.status === "suspended") suspended++;
      else if (data.status === "churned") churned++;
      totalHealth += data.healthScore ?? 80;
      totalRevenue += (data as Record<string, number>).mtdRevenueUsd ?? 0;
      if (data.createdAt && data.createdAt >= monthStart) newThisMonth++;
      if (data.status === "churned" && data.suspendedAt && data.suspendedAt >= monthStart) churnedThisMonth++;
    });
    const total = snap.size;
    return {
      totalTenants: total,
      activeTenants: active,
      trialTenants: trial,
      suspendedTenants: suspended,
      totalRevenueMtdUsd: totalRevenue,
      avgHealthScore: total > 0 ? Math.round(totalHealth / total) : 0,
      newTenantsThisMonth: newThisMonth,
      churnedThisMonth,
    };
  }

  // ---- Platform Health ----

  async function getPlatformHealthSignals(actorRole: string): Promise<PlatformHealthSignal[]> {
    assertPlatformAdmin(actorRole);
    const snap = await getDocs(collection(db, "platformHealth"));
    return snap.docs.map((d) => d.data() as PlatformHealthSignal);
  }

  // ---- Pricing Plans ----

  async function listPricingPlans(actorRole: string): Promise<PricingPlan[]> {
    assertPlatformAdmin(actorRole);
    const snap = await getDocs(collection(db, "pricingPlans"));
    return snap.docs.map((d) => ({ planId: d.id, ...(d.data() as Omit<PricingPlan, "planId">) })) as PricingPlan[];
  }

  async function updatePricingPlan(
    actorRole: string,
    planId: string,
    updates: Partial<Omit<PricingPlan, "planId">>
  ): Promise<void> {
    assertPlatformAdmin(actorRole);
    await updateDoc(doc(db, "pricingPlans", planId), { ...updates });
  }

  // ---- Platform Audit Log ----

  async function listPlatformAuditLog(
    actorRole: string,
    filter?: PlatformAuditFilter
  ): Promise<PlatformAuditEntry[]> {
    assertPlatformAdmin(actorRole);
    const col = collection(db, "platformAuditLog");
    let q = query(col, orderBy("occurredAt", "desc"), limit(100));
    if (filter?.actorKind) {
      q = query(col, where("actorKind", "==", filter.actorKind), orderBy("occurredAt", "desc"), limit(100));
    }
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      entryId: d.id,
      ...(d.data() as Omit<PlatformAuditEntry, "entryId">),
    }));
  }

  // ---- Marketplace Moderation ----

  async function listModerationQueue(
    actorRole: string,
    statusFilter?: ModerationItemStatus
  ): Promise<ModerationQueueItem[]> {
    assertPlatformAdmin(actorRole);
    const col = collection(db, "marketplaceModerationQueue");
    const q = statusFilter
      ? query(col, where("status", "==", statusFilter), orderBy("submittedAt", "desc"), limit(50))
      : query(col, orderBy("submittedAt", "desc"), limit(50));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ itemId: d.id, ...(d.data() as Omit<ModerationQueueItem, "itemId">) }));
  }

  async function flagModerationItem(
    actorRole: string,
    itemId: string,
    reason: string,
    reviewedBy: string
  ): Promise<void> {
    assertPlatformAdmin(actorRole);
    await updateDoc(doc(db, "marketplaceModerationQueue", itemId), {
      status: "flagged",
      flagReason: reason,
      reviewedBy,
      reviewedAt: new Date().toISOString(),
    });
  }

  async function clearModerationItem(
    actorRole: string,
    itemId: string,
    reviewedBy: string
  ): Promise<void> {
    assertPlatformAdmin(actorRole);
    await updateDoc(doc(db, "marketplaceModerationQueue", itemId), {
      status: "cleared",
      reviewedBy,
      reviewedAt: new Date().toISOString(),
    });
  }

  // ---- Cross-Tenant AI Budget Overrides ----

  async function listTenantAiBudgetOverrides(actorRole: string): Promise<TenantAiBudgetOverride[]> {
    assertPlatformAdmin(actorRole);
    const snap = await getDocs(collection(db, "platformAiBudgetOverrides"));
    return snap.docs.map((d) => ({
      tenantId: d.id,
      ...(d.data() as Omit<TenantAiBudgetOverride, "tenantId">),
    }));
  }

  async function setTenantAiBudgetOverride(
    actorRole: string,
    tenantId: string,
    platformCapUsd: number,
    overriddenBy: string
  ): Promise<void> {
    assertPlatformAdmin(actorRole);
    await updateDoc(doc(db, "platformAiBudgetOverrides", tenantId), {
      platformCapUsd,
      overriddenAt: new Date().toISOString(),
      overriddenBy,
    });
  }

  // ---- Migration Runner ----

  async function listMigrationJobs(actorRole: string): Promise<MigrationJob[]> {
    assertPlatformAdmin(actorRole);
    const snap = await getDocs(query(collection(db, "migrationJobs"), orderBy("createdAt", "desc"), limit(50)));
    return snap.docs.map((d) => ({ jobId: d.id, ...(d.data() as Omit<MigrationJob, "jobId">) }));
  }

  async function triggerMigrationJob(
    actorRole: string,
    jobId: string,
    actorId: string
  ): Promise<void> {
    assertPlatformAdmin(actorRole);
    await updateDoc(doc(db, "migrationJobs", jobId), {
      status: "running" as MigrationJobStatus,
      startedAt: new Date().toISOString(),
    });
    await addDoc(collection(db, "platformAuditLog"), {
      actorId,
      actorKind: "platform_admin",
      action: "migration.triggered",
      targetKind: "migration",
      targetId: jobId,
      occurredAt: serverTimestamp(),
    });
  }

  // ---- Backup / Restore ----

  async function listBackupJobs(actorRole: string): Promise<BackupJob[]> {
    assertPlatformAdmin(actorRole);
    const snap = await getDocs(query(collection(db, "backupJobs"), orderBy("startedAt", "desc"), limit(20)));
    return snap.docs.map((d) => ({ jobId: d.id, ...(d.data() as Omit<BackupJob, "jobId">) }));
  }

  // ---- Security Events ----

  async function listSecurityEvents(
    actorRole: string,
    filter?: SecurityEventFilter
  ): Promise<SecurityEvent[]> {
    assertPlatformAdmin(actorRole);
    const col = collection(db, "securityEvents");
    let q = query(col, orderBy("occurredAt", "desc"), limit(100));
    if (filter?.severity) {
      q = query(col, where("severity", "==", filter.severity), orderBy("occurredAt", "desc"), limit(100));
    }
    const snap = await getDocs(q);
    let rows = snap.docs.map((d) => ({ eventId: d.id, ...(d.data() as Omit<SecurityEvent, "eventId">) }));
    if (filter?.kind) rows = rows.filter((e) => e.kind === filter.kind);
    if (filter?.resolved !== undefined) rows = rows.filter((e) => e.resolved === filter.resolved);
    return rows;
  }

  async function resolveSecurityEvent(actorRole: string, eventId: string): Promise<void> {
    assertPlatformAdmin(actorRole);
    await updateDoc(doc(db, "securityEvents", eventId), {
      resolved: true,
      resolvedAt: new Date().toISOString(),
    });
  }

  // ---- Data Export Requests ----

  async function listDataExportRequests(actorRole: string): Promise<DataExportRequest[]> {
    assertPlatformAdmin(actorRole);
    const snap = await getDocs(query(collection(db, "dataExportRequests"), orderBy("submittedAt", "desc"), limit(100)));
    return snap.docs.map((d) => ({ requestId: d.id, ...(d.data() as Omit<DataExportRequest, "requestId">) }));
  }

  async function processDataExportRequest(actorRole: string, requestId: string): Promise<void> {
    assertPlatformAdmin(actorRole);
    await updateDoc(doc(db, "dataExportRequests", requestId), {
      status: "processing",
    });
  }

  // ---- Consent / Policy Log ----

  async function listConsentPolicyEntries(
    actorRole: string,
    tenantId?: string
  ): Promise<ConsentPolicyEntry[]> {
    assertPlatformAdmin(actorRole);
    const col = collection(db, "consentPolicyLog");
    const q = tenantId
      ? query(col, where("tenantId", "==", tenantId), orderBy("consentGivenAt", "desc"), limit(100))
      : query(col, orderBy("consentGivenAt", "desc"), limit(100));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ entryId: d.id, ...(d.data() as Omit<ConsentPolicyEntry, "entryId">) }));
  }

  // ---- Incident Response ----

  async function listIncidents(actorRole: string): Promise<IncidentRecord[]> {
    assertPlatformAdmin(actorRole);
    const snap = await getDocs(query(collection(db, "incidents"), orderBy("createdAt", "desc"), limit(50)));
    return snap.docs.map((d) => ({ incidentId: d.id, ...(d.data() as Omit<IncidentRecord, "incidentId">) }));
  }

  async function updateIncidentStatus(
    actorRole: string,
    incidentId: string,
    status: IncidentRecord["status"],
    mitigationNotes?: string
  ): Promise<void> {
    assertPlatformAdmin(actorRole);
    const updates: Record<string, unknown> = {
      status,
      updatedAt: new Date().toISOString(),
    };
    if (mitigationNotes) updates.mitigationNotes = mitigationNotes;
    if (status === "resolved") updates.resolvedAt = new Date().toISOString();
    await updateDoc(doc(db, "incidents", incidentId), updates);
  }

  return {
    listTenants,
    getTenant,
    suspendTenant,
    reactivateTenant,
    updateTenantSupportNotes,
    getCrossTenantKpi,
    getPlatformHealthSignals,
    listPricingPlans,
    updatePricingPlan,
    listPlatformAuditLog,
    listModerationQueue,
    flagModerationItem,
    clearModerationItem,
    listTenantAiBudgetOverrides,
    setTenantAiBudgetOverride,
    listMigrationJobs,
    triggerMigrationJob,
    listBackupJobs,
    listSecurityEvents,
    resolveSecurityEvent,
    listDataExportRequests,
    processDataExportRequest,
    listConsentPolicyEntries,
    listIncidents,
    updateIncidentStatus,
  };
}
