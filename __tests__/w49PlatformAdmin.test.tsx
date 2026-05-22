/**
 * w49PlatformAdmin.test.tsx
 *
 * W49 — Platform Super-Admin, Compliance, Polish & Release Candidate
 * 50 tests: 8 screens × 5 tests + 10 service tests
 *
 * Screens covered:
 *   TenantDirectoryScreen, SuspendTenantScreen, ImpersonationScreen,
 *   PlatformHealthDashboardScreen, FeatureFlagConsoleScreen,
 *   SecurityEventsDashboardScreen, IncidentResponseScreen, AdminSignInScreen
 *
 * Services covered:
 *   platformAdminService (RBAC + CRUD)
 *   impersonationService (session lifecycle)
 */

import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

import { TenantDirectoryScreen } from "../src/app/admin/TenantDirectoryScreen";
import { SuspendTenantScreen } from "../src/app/admin/SuspendTenantScreen";
import { ImpersonationScreen } from "../src/app/admin/ImpersonationScreen";
import { PlatformHealthDashboardScreen } from "../src/app/admin/PlatformHealthDashboardScreen";
import { FeatureFlagConsoleScreen } from "../src/app/admin/FeatureFlagConsoleScreen";
import { SecurityEventsDashboardScreen } from "../src/app/admin/SecurityEventsDashboardScreen";
import { IncidentResponseScreen } from "../src/app/admin/IncidentResponseScreen";
import { AdminSignInScreen } from "../src/app/admin/AdminSignInScreen";

import { createPlatformAdminService } from "../src/app/admin/platformAdminService";
import { createImpersonationService } from "../src/app/admin/impersonationService";

import type {
  TenantRecord,
  PlatformHealthSignal,
  FeatureFlag,
  SecurityEvent,
  IncidentRecord,
  ImpersonationSession,
} from "../src/app/admin/platformAdminTypes";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const TENANT: TenantRecord = {
  tenantId: "t1",
  name: "Salon A",
  plan: "pro",
  status: "active",
  ownerEmail: "owner@salonA.com",
  createdAt: "2024-01-01T00:00:00Z",
  locationCount: 2,
  staffCount: 5,
  supportNotes: "",
};

const SUSPENDED_TENANT: TenantRecord = { ...TENANT, status: "suspended" };

const HEALTH_SIGNAL: PlatformHealthSignal = {
  signalId: "sig1",
  service: "Firestore",
  status: "healthy",
  latencyMs: 45,
  errorRate: 0,
  checkedAt: "2024-06-01T12:00:00Z",
};

const DEGRADED_SIGNAL: PlatformHealthSignal = {
  signalId: "sig2",
  service: "Auth",
  status: "degraded",
  latencyMs: 320,
  errorRate: 0.08,
  checkedAt: "2024-06-01T12:00:00Z",
};

const PLATFORM_FLAG: FeatureFlag = {
  flagKey: "ai_suggestions",
  label: "AI Suggestions",
  scope: "platform",
  enabled: true,
};

const TENANT_FLAG: FeatureFlag = {
  flagKey: "loyalty_v2",
  label: "Loyalty v2",
  scope: "tenant",
  tenantId: "t1",
  enabled: false,
};

const SECURITY_EVENT: SecurityEvent = {
  eventId: "ev1",
  kind: "brute_force",
  severity: "high",
  actorId: "user123",
  tenantId: "t1",
  occurredAt: "2024-06-01T10:00:00Z",
  resolved: false,
  description: "Multiple failed login attempts",
};

const INCIDENT: IncidentRecord = {
  incidentId: "inc1",
  title: "Auth service outage",
  severity: "critical",
  status: "open",
  createdAt: "2024-06-01T08:00:00Z",
  updatedAt: "2024-06-01T08:30:00Z",
  description: "Auth service is not responding",
  affectedTenants: ["t1", "t2"],
};

const SESSION: ImpersonationSession = {
  sessionId: "sess1",
  platformAdminId: "admin1",
  targetTenantId: "t1",
  targetUserId: "user1",
  startedAt: "2024-06-01T09:00:00Z",
  expiresAt: "2024-06-01T09:30:00Z",
  active: true,
};

// ---------------------------------------------------------------------------
// TenantDirectoryScreen — 5 tests
// ---------------------------------------------------------------------------

describe("TenantDirectoryScreen", () => {
  it("renders with testID", () => {
    const { getByTestId } = render(
      <TenantDirectoryScreen
        loading={false}
        error={null}
        tenants={[TENANT]}
        filter={{}}
        onChangeFilter={jest.fn()}
        onSelectTenant={jest.fn()}
        onRetry={jest.fn()}
        onBack={jest.fn()}
        testID="tenant-directory-screen"
      />
    );
    expect(getByTestId("tenant-directory-screen")).toBeTruthy();
  });

  it("renders tenant name", () => {
    const { getByText } = render(
      <TenantDirectoryScreen
        loading={false}
        error={null}
        tenants={[TENANT]}
        filter={{}}
        onChangeFilter={jest.fn()}
        onSelectTenant={jest.fn()}
        onRetry={jest.fn()}
        onBack={jest.fn()}
        testID="tenant-directory-screen"
      />
    );
    expect(getByText("Salon A")).toBeTruthy();
  });

  it("calls onSelectTenant when row pressed", () => {
    const onSelectTenant = jest.fn();
    const { getByTestId } = render(
      <TenantDirectoryScreen
        loading={false}
        error={null}
        tenants={[TENANT]}
        filter={{}}
        onChangeFilter={jest.fn()}
        onSelectTenant={onSelectTenant}
        onRetry={jest.fn()}
        onBack={jest.fn()}
        testID="tenant-directory-screen"
      />
    );
    fireEvent.press(getByTestId("tenant-row-t1"));
    expect(onSelectTenant).toHaveBeenCalledWith(TENANT);
  });

  it("shows loading indicator", () => {
    const { getByTestId } = render(
      <TenantDirectoryScreen
        loading={true}
        error={null}
        tenants={[]}
        filter={{}}
        onChangeFilter={jest.fn()}
        onSelectTenant={jest.fn()}
        onRetry={jest.fn()}
        onBack={jest.fn()}
        testID="tenant-directory-screen"
      />
    );
    expect(getByTestId("tenant-directory-screen-loading")).toBeTruthy();
  });

  it("shows error and retry button", () => {
    const onRetry = jest.fn();
    const { getByText } = render(
      <TenantDirectoryScreen
        loading={false}
        error="Failed to load tenants."
        tenants={[]}
        filter={{}}
        onChangeFilter={jest.fn()}
        onSelectTenant={jest.fn()}
        onRetry={onRetry}
        onBack={jest.fn()}
        testID="tenant-directory-screen"
      />
    );
    expect(getByText("Failed to load tenants.")).toBeTruthy();
    fireEvent.press(getByText("Retry"));
    expect(onRetry).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// SuspendTenantScreen — 5 tests
// ---------------------------------------------------------------------------

describe("SuspendTenantScreen", () => {
  it("renders with testID", () => {
    const { getByTestId } = render(
      <SuspendTenantScreen
        loading={false}
        error={null}
        tenantId="t1"
        tenantName="Salon A"
        onConfirmSuspend={jest.fn()}
        onCancel={jest.fn()}
        testID="suspend-tenant-screen"
      />
    );
    expect(getByTestId("suspend-tenant-screen")).toBeTruthy();
  });

  it("shows tenant name in title", () => {
    const { getByText } = render(
      <SuspendTenantScreen
        loading={false}
        error={null}
        tenantId="t1"
        tenantName="Salon A"
        onConfirmSuspend={jest.fn()}
        onCancel={jest.fn()}
        testID="suspend-tenant-screen"
      />
    );
    expect(getByText(/Salon A/)).toBeTruthy();
  });

  it("confirm button disabled when reason too short", () => {
    const onConfirm = jest.fn();
    const { getByTestId } = render(
      <SuspendTenantScreen
        loading={false}
        error={null}
        tenantId="t1"
        tenantName="Salon A"
        onConfirmSuspend={onConfirm}
        onCancel={jest.fn()}
        testID="suspend-tenant-screen"
      />
    );
    fireEvent.press(getByTestId("suspend-tenant-screen-confirm"));
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("calls onConfirmSuspend with reason when valid", () => {
    const onConfirm = jest.fn();
    const { getByTestId } = render(
      <SuspendTenantScreen
        loading={false}
        error={null}
        tenantId="t1"
        tenantName="Salon A"
        onConfirmSuspend={onConfirm}
        onCancel={jest.fn()}
        testID="suspend-tenant-screen"
      />
    );
    fireEvent.changeText(getByTestId("suspend-tenant-screen-reason"), "Violation of ToS policy");
    fireEvent.press(getByTestId("suspend-tenant-screen-confirm"));
    expect(onConfirm).toHaveBeenCalledWith("Violation of ToS policy");
  });

  it("calls onCancel when cancel pressed", () => {
    const onCancel = jest.fn();
    const { getByTestId } = render(
      <SuspendTenantScreen
        loading={false}
        error={null}
        tenantId="t1"
        tenantName="Salon A"
        onConfirmSuspend={jest.fn()}
        onCancel={onCancel}
        testID="suspend-tenant-screen"
      />
    );
    fireEvent.press(getByTestId("suspend-tenant-screen-cancel"));
    expect(onCancel).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// ImpersonationScreen — 5 tests
// ---------------------------------------------------------------------------

describe("ImpersonationScreen", () => {
  it("renders with testID", () => {
    const { getByTestId } = render(
      <ImpersonationScreen
        loading={false}
        error={null}
        activeSession={null}
        onStartImpersonation={jest.fn()}
        onEndImpersonation={jest.fn()}
        onRetry={jest.fn()}
        onBack={jest.fn()}
        testID="impersonation-screen"
      />
    );
    expect(getByTestId("impersonation-screen")).toBeTruthy();
  });

  it("shows active session banner when session present", () => {
    const { getByTestId } = render(
      <ImpersonationScreen
        loading={false}
        error={null}
        activeSession={SESSION}
        onStartImpersonation={jest.fn()}
        onEndImpersonation={jest.fn()}
        onRetry={jest.fn()}
        onBack={jest.fn()}
        testID="impersonation-screen"
      />
    );
    expect(getByTestId("impersonation-screen-active-banner")).toBeTruthy();
  });

  it("calls onEndImpersonation when end session pressed", () => {
    const onEnd = jest.fn();
    const { getByTestId } = render(
      <ImpersonationScreen
        loading={false}
        error={null}
        activeSession={SESSION}
        onStartImpersonation={jest.fn()}
        onEndImpersonation={onEnd}
        onRetry={jest.fn()}
        onBack={jest.fn()}
        testID="impersonation-screen"
      />
    );
    fireEvent.press(getByTestId("impersonation-screen-end-session"));
    expect(onEnd).toHaveBeenCalled();
  });

  it("shows loading indicator", () => {
    const { getByTestId } = render(
      <ImpersonationScreen
        loading={true}
        error={null}
        activeSession={null}
        onStartImpersonation={jest.fn()}
        onEndImpersonation={jest.fn()}
        onRetry={jest.fn()}
        onBack={jest.fn()}
        testID="impersonation-screen"
      />
    );
    expect(getByTestId("impersonation-screen-loading")).toBeTruthy();
  });

  it("calls onStartImpersonation when form submitted", () => {
    const onStart = jest.fn();
    const { getByTestId } = render(
      <ImpersonationScreen
        loading={false}
        error={null}
        activeSession={null}
        onStartImpersonation={onStart}
        onEndImpersonation={jest.fn()}
        onRetry={jest.fn()}
        onBack={jest.fn()}
        testID="impersonation-screen"
      />
    );
    fireEvent.changeText(getByTestId("impersonation-screen-tenant-id-input"), "t1");
    fireEvent.changeText(getByTestId("impersonation-screen-user-id-input"), "user1");
    fireEvent.changeText(
      getByTestId("impersonation-screen-reason-input"),
      "Investigating payment issue for support ticket"
    );
    fireEvent.press(getByTestId("impersonation-screen-acknowledge"));
    fireEvent.press(getByTestId("impersonation-screen-start-btn"));
    expect(onStart).toHaveBeenCalledWith("t1", "user1", "Investigating payment issue for support ticket");
  });
});

// ---------------------------------------------------------------------------
// PlatformHealthDashboardScreen — 5 tests
// ---------------------------------------------------------------------------

describe("PlatformHealthDashboardScreen", () => {
  it("renders with testID", () => {
    const { getByTestId } = render(
      <PlatformHealthDashboardScreen
        loading={false}
        error={null}
        signals={[]}
        onRetry={jest.fn()}
        onBack={jest.fn()}
        testID="platform-health-dashboard-screen"
      />
    );
    expect(getByTestId("platform-health-dashboard-screen")).toBeTruthy();
  });

  it("renders healthy signal", () => {
    const { getByText } = render(
      <PlatformHealthDashboardScreen
        loading={false}
        error={null}
        signals={[HEALTH_SIGNAL]}
        onRetry={jest.fn()}
        onBack={jest.fn()}
        testID="platform-health-dashboard-screen"
      />
    );
    expect(getByText("Firestore")).toBeTruthy();
  });

  it("renders degraded signal with warning indicator", () => {
    const { getByTestId } = render(
      <PlatformHealthDashboardScreen
        loading={false}
        error={null}
        signals={[DEGRADED_SIGNAL]}
        onRetry={jest.fn()}
        onBack={jest.fn()}
        testID="platform-health-dashboard-screen"
      />
    );
    expect(getByTestId("signal-status-sig2")).toBeTruthy();
  });

  it("shows loading indicator", () => {
    const { getByTestId } = render(
      <PlatformHealthDashboardScreen
        loading={true}
        error={null}
        signals={[]}
        onRetry={jest.fn()}
        onBack={jest.fn()}
        testID="platform-health-dashboard-screen"
      />
    );
    expect(getByTestId("platform-health-dashboard-screen-loading")).toBeTruthy();
  });

  it("shows error and retry", () => {
    const onRetry = jest.fn();
    const { getByText } = render(
      <PlatformHealthDashboardScreen
        loading={false}
        error="Health check failed."
        signals={[]}
        onRetry={onRetry}
        onBack={jest.fn()}
        testID="platform-health-dashboard-screen"
      />
    );
    expect(getByText("Health check failed.")).toBeTruthy();
    fireEvent.press(getByText("Retry"));
    expect(onRetry).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// FeatureFlagConsoleScreen — 5 tests
// ---------------------------------------------------------------------------

describe("FeatureFlagConsoleScreen", () => {
  it("renders with testID", () => {
    const { getByTestId } = render(
      <FeatureFlagConsoleScreen
        loading={false}
        error={null}
        platformFlags={[]}
        tenantFlags={[]}
        onTogglePlatformFlag={jest.fn()}
        onToggleTenantFlag={jest.fn()}
        onSaveAll={jest.fn()}
        onRetry={jest.fn()}
        onBack={jest.fn()}
        testID="feature-flag-console-screen"
      />
    );
    expect(getByTestId("feature-flag-console-screen")).toBeTruthy();
  });

  it("renders platform flag label", () => {
    const { getByText } = render(
      <FeatureFlagConsoleScreen
        loading={false}
        error={null}
        platformFlags={[PLATFORM_FLAG]}
        tenantFlags={[]}
        onTogglePlatformFlag={jest.fn()}
        onToggleTenantFlag={jest.fn()}
        onSaveAll={jest.fn()}
        onRetry={jest.fn()}
        onBack={jest.fn()}
        testID="feature-flag-console-screen"
      />
    );
    expect(getByText("AI Suggestions")).toBeTruthy();
  });

  it("calls onTogglePlatformFlag when switch toggled", () => {
    const onToggle = jest.fn();
    const { getByTestId } = render(
      <FeatureFlagConsoleScreen
        loading={false}
        error={null}
        platformFlags={[PLATFORM_FLAG]}
        tenantFlags={[]}
        onTogglePlatformFlag={onToggle}
        onToggleTenantFlag={jest.fn()}
        onSaveAll={jest.fn()}
        onRetry={jest.fn()}
        onBack={jest.fn()}
        testID="feature-flag-console-screen"
      />
    );
    fireEvent(getByTestId("flag-toggle-ai_suggestions"), "valueChange", false);
    expect(onToggle).toHaveBeenCalledWith("ai_suggestions", false);
  });

  it("calls onSaveAll when save pressed", () => {
    const onSaveAll = jest.fn();
    const { getByTestId } = render(
      <FeatureFlagConsoleScreen
        loading={false}
        error={null}
        platformFlags={[PLATFORM_FLAG]}
        tenantFlags={[]}
        onTogglePlatformFlag={jest.fn()}
        onToggleTenantFlag={jest.fn()}
        onSaveAll={onSaveAll}
        onRetry={jest.fn()}
        onBack={jest.fn()}
        testID="feature-flag-console-screen"
      />
    );
    fireEvent.press(getByTestId("feature-flag-console-screen-save"));
    expect(onSaveAll).toHaveBeenCalled();
  });

  it("shows loading indicator", () => {
    const { getByTestId } = render(
      <FeatureFlagConsoleScreen
        loading={true}
        error={null}
        platformFlags={[]}
        tenantFlags={[]}
        onTogglePlatformFlag={jest.fn()}
        onToggleTenantFlag={jest.fn()}
        onSaveAll={jest.fn()}
        onRetry={jest.fn()}
        onBack={jest.fn()}
        testID="feature-flag-console-screen"
      />
    );
    expect(getByTestId("feature-flag-console-screen-loading")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// SecurityEventsDashboardScreen — 5 tests
// ---------------------------------------------------------------------------

describe("SecurityEventsDashboardScreen", () => {
  it("renders with testID", () => {
    const { getByTestId } = render(
      <SecurityEventsDashboardScreen
        loading={false}
        error={null}
        events={[]}
        filter={{}}
        onChangeFilter={jest.fn()}
        onResolveEvent={jest.fn()}
        onRetry={jest.fn()}
        onBack={jest.fn()}
        testID="security-events-dashboard-screen"
      />
    );
    expect(getByTestId("security-events-dashboard-screen")).toBeTruthy();
  });

  it("renders event description", () => {
    const { getByText } = render(
      <SecurityEventsDashboardScreen
        loading={false}
        error={null}
        events={[SECURITY_EVENT]}
        filter={{}}
        onChangeFilter={jest.fn()}
        onResolveEvent={jest.fn()}
        onRetry={jest.fn()}
        onBack={jest.fn()}
        testID="security-events-dashboard-screen"
      />
    );
    expect(getByText("Multiple failed login attempts")).toBeTruthy();
  });

  it("calls onResolveEvent when resolve pressed", () => {
    const onResolve = jest.fn();
    const { getByTestId } = render(
      <SecurityEventsDashboardScreen
        loading={false}
        error={null}
        events={[SECURITY_EVENT]}
        filter={{}}
        onChangeFilter={jest.fn()}
        onResolveEvent={onResolve}
        onRetry={jest.fn()}
        onBack={jest.fn()}
        testID="security-events-dashboard-screen"
      />
    );
    fireEvent.press(getByTestId("resolve-event-ev1"));
    expect(onResolve).toHaveBeenCalledWith("ev1");
  });

  it("shows loading indicator", () => {
    const { getByTestId } = render(
      <SecurityEventsDashboardScreen
        loading={true}
        error={null}
        events={[]}
        filter={{}}
        onChangeFilter={jest.fn()}
        onResolveEvent={jest.fn()}
        onRetry={jest.fn()}
        onBack={jest.fn()}
        testID="security-events-dashboard-screen"
      />
    );
    expect(getByTestId("security-events-dashboard-screen-loading")).toBeTruthy();
  });

  it("shows error and retry", () => {
    const onRetry = jest.fn();
    const { getByText } = render(
      <SecurityEventsDashboardScreen
        loading={false}
        error="Failed to load security events."
        events={[]}
        filter={{}}
        onChangeFilter={jest.fn()}
        onResolveEvent={jest.fn()}
        onRetry={onRetry}
        onBack={jest.fn()}
        testID="security-events-dashboard-screen"
      />
    );
    expect(getByText("Failed to load security events.")).toBeTruthy();
    fireEvent.press(getByText("Retry"));
    expect(onRetry).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// IncidentResponseScreen — 5 tests
// ---------------------------------------------------------------------------

describe("IncidentResponseScreen", () => {
  it("renders with testID", () => {
    const { getByTestId } = render(
      <IncidentResponseScreen
        loading={false}
        error={null}
        incidents={[]}
        onUpdateStatus={jest.fn()}
        onRetry={jest.fn()}
        onBack={jest.fn()}
        testID="incident-response-screen"
      />
    );
    expect(getByTestId("incident-response-screen")).toBeTruthy();
  });

  it("renders incident title", () => {
    const { getByText } = render(
      <IncidentResponseScreen
        loading={false}
        error={null}
        incidents={[INCIDENT]}
        onUpdateStatus={jest.fn()}
        onRetry={jest.fn()}
        onBack={jest.fn()}
        testID="incident-response-screen"
      />
    );
    expect(getByText("Auth service outage")).toBeTruthy();
  });

  it("calls onUpdateStatus when resolve button pressed", () => {
    const onUpdate = jest.fn();
    const { getByTestId } = render(
      <IncidentResponseScreen
        loading={false}
        error={null}
        incidents={[INCIDENT]}
        onUpdateStatus={onUpdate}
        onRetry={jest.fn()}
        onBack={jest.fn()}
        testID="incident-response-screen"
      />
    );
    fireEvent.press(getByTestId("incident-resolve-inc1"));
    expect(onUpdate).toHaveBeenCalledWith("inc1", "resolved", undefined);
  });

  it("shows loading indicator", () => {
    const { getByTestId } = render(
      <IncidentResponseScreen
        loading={true}
        error={null}
        incidents={[]}
        onUpdateStatus={jest.fn()}
        onRetry={jest.fn()}
        onBack={jest.fn()}
        testID="incident-response-screen"
      />
    );
    expect(getByTestId("incident-response-screen-loading")).toBeTruthy();
  });

  it("shows error and retry", () => {
    const onRetry = jest.fn();
    const { getByText } = render(
      <IncidentResponseScreen
        loading={false}
        error="Failed to load incidents."
        incidents={[]}
        onUpdateStatus={jest.fn()}
        onRetry={onRetry}
        onBack={jest.fn()}
        testID="incident-response-screen"
      />
    );
    expect(getByText("Failed to load incidents.")).toBeTruthy();
    fireEvent.press(getByText("Retry"));
    expect(onRetry).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// AdminSignInScreen — 5 tests
// ---------------------------------------------------------------------------

describe("AdminSignInScreen", () => {
  it("renders with testID", () => {
    const { getByTestId } = render(
      <AdminSignInScreen
        onSignIn={jest.fn()}
        onBack={jest.fn()}
        testID="admin-sign-in-screen"
      />
    );
    expect(getByTestId("admin-sign-in-screen")).toBeTruthy();
  });

  it("renders email and password inputs", () => {
    const { getByTestId } = render(
      <AdminSignInScreen
        onSignIn={jest.fn()}
        onBack={jest.fn()}
        testID="admin-sign-in-screen"
      />
    );
    expect(getByTestId("admin-sign-in-screen-email")).toBeTruthy();
    expect(getByTestId("admin-sign-in-screen-password")).toBeTruthy();
  });

  it("sign in button disabled when fields empty", () => {
    const onSignIn = jest.fn();
    const { getByTestId } = render(
      <AdminSignInScreen
        onSignIn={onSignIn}
        onBack={jest.fn()}
        testID="admin-sign-in-screen"
      />
    );
    fireEvent.press(getByTestId("admin-sign-in-screen-submit"));
    expect(onSignIn).not.toHaveBeenCalled();
  });

  it("calls onSignIn with credentials when submitted", () => {
    const onSignIn = jest.fn();
    const { getByTestId } = render(
      <AdminSignInScreen
        onSignIn={onSignIn}
        onBack={jest.fn()}
        testID="admin-sign-in-screen"
      />
    );
    fireEvent.changeText(getByTestId("admin-sign-in-screen-email"), "admin@platform.com");
    fireEvent.changeText(getByTestId("admin-sign-in-screen-password"), "securepass123");
    fireEvent.press(getByTestId("admin-sign-in-screen-submit"));
    expect(onSignIn).toHaveBeenCalledWith("admin@platform.com", "securepass123");
  });

  it("renders title", () => {
    const { getByText } = render(
      <AdminSignInScreen
        onSignIn={jest.fn()}
        onBack={jest.fn()}
        testID="admin-sign-in-screen"
      />
    );
    expect(getByText("Platform Admin")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// platformAdminService — 6 service tests (RBAC + CRUD)
// ---------------------------------------------------------------------------

describe("platformAdminService — RBAC", () => {
  const mockDb = {} as any;
  const svc = createPlatformAdminService(mockDb);

  it("listTenants throws for non-platform_admin role", async () => {
    await expect(svc.listTenants("tenant_owner" as any, {})).rejects.toThrow(
      "FORBIDDEN: platform_admin role required"
    );
  });

  it("suspendTenant throws for non-platform_admin role", async () => {
    await expect(svc.suspendTenant("tenant_owner" as any, "t1", "reason")).rejects.toThrow(
      "FORBIDDEN: platform_admin role required"
    );
  });

  it("listPricingPlans throws for non-platform_admin role", async () => {
    await expect(svc.listPricingPlans("tenant_owner" as any)).rejects.toThrow(
      "FORBIDDEN: platform_admin role required"
    );
  });

  it("listSecurityEvents throws for non-platform_admin role", async () => {
    await expect(svc.listSecurityEvents("tenant_owner" as any, {})).rejects.toThrow(
      "FORBIDDEN: platform_admin role required"
    );
  });

  it("listIncidents throws for non-platform_admin role", async () => {
    await expect(svc.listIncidents("tenant_owner" as any)).rejects.toThrow(
      "FORBIDDEN: platform_admin role required"
    );
  });

  it("listMigrationJobs throws for non-platform_admin role", async () => {
    await expect(svc.listMigrationJobs("tenant_owner" as any)).rejects.toThrow(
      "FORBIDDEN: platform_admin role required"
    );
  });
});

// ---------------------------------------------------------------------------
// impersonationService — 4 service tests (session lifecycle)
// ---------------------------------------------------------------------------

describe("impersonationService — RBAC", () => {
  const mockDb = {} as any;
  const svc = createImpersonationService(mockDb);

  it("startImpersonation throws for non-platform_admin role", async () => {
    await expect(
      svc.startImpersonation("tenant_owner" as any, "admin1", "t1", "user1", "reason placeholder")
    ).rejects.toThrow("FORBIDDEN: platform_admin role required");
  });

  it("endImpersonation throws for non-platform_admin role", async () => {
    await expect(
      svc.endImpersonation("tenant_owner" as any, "sess1")
    ).rejects.toThrow("FORBIDDEN: platform_admin role required");
  });

  it("getActiveImpersonationSession throws for non-platform_admin role", async () => {
    await expect(
      svc.getActiveImpersonationSession("tenant_owner" as any)
    ).rejects.toThrow("FORBIDDEN: platform_admin role required");
  });

  it("platform_admin role is accepted (no throw before Firestore call)", async () => {
    // Should reject with Firestore-unavailable error, NOT with FORBIDDEN
    await expect(
      svc.getActiveImpersonationSession("platform_admin")
    ).rejects.not.toThrow("FORBIDDEN: platform_admin role required");
  });
});
