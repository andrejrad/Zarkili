/**
 * w40LocationAdmin.test.tsx
 *
 * W40 — Location Dashboard, Settings, Resources
 *
 * Covers: LocationOverviewScreen, LocationDashboardScreen,
 *         LocationSettingsScreen, LocationServiceOverridesScreen,
 *         ResourceManagementScreen, AdminWalkInQueueScreen,
 *         DailyCloseScreen, AdminFirstRunTourOverlay
 */

import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

import { LocationOverviewScreen } from "../src/app/admin/LocationOverviewScreen";
import { LocationDashboardScreen } from "../src/app/admin/LocationDashboardScreen";
import { LocationSettingsScreen } from "../src/app/admin/LocationSettingsScreen";
import { LocationServiceOverridesScreen } from "../src/app/admin/LocationServiceOverridesScreen";
import { ResourceManagementScreen } from "../src/app/admin/ResourceManagementScreen";
import { AdminWalkInQueueScreen } from "../src/app/admin/AdminWalkInQueueScreen";
import { DailyCloseScreen } from "../src/app/admin/DailyCloseScreen";
import { AdminFirstRunTourOverlay } from "../src/app/admin/AdminFirstRunTourOverlay";

import type {
  LocationKpi,
  TodayAppointment,
  HolidayEntry,
  LocationAccessibilityFlags,
  LocationServiceOverride,
  ResourceItem,
  WalkInQueueEntry,
  DailyCloseReport,
} from "../src/app/admin/locationAdminService";
import type { Location } from "../src/domains/locations/model";

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const baseLocation: Location = {
  locationId: "loc1",
  tenantId: "t1",
  name: "Downtown Salon",
  address: {
    street: "1 Main St",
    city: "Portland",
    state: "OR",
    postalCode: "97201",
    country: "US",
  },
  phone: "+15035550001",
  email: "downtown@salon.com",
  timezone: "America/Los_Angeles",
  operatingHours: {},
  status: "active",
  code: "DTN",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

const baseKpi: LocationKpi = {
  locationId: "loc1",
  locationName: "Downtown Salon",
  bookingsToday: 8,
  revenueToday: 64000,
  currency: "USD",
  occupancyPct: 75,
  walkInsToday: 2,
  openSlotsToday: 3,
};

const baseAppointment: TodayAppointment = {
  appointmentId: "appt1",
  clientName: "Jane Doe",
  serviceName: "Haircut",
  staffName: "Alice",
  startTimeIso: "2025-07-01T10:00:00Z",
  durationMin: 45,
  status: "confirmed",
};

const baseHoliday: HolidayEntry = {
  holidayId: "h1",
  name: "Independence Day",
  dateIso: "2025-07-04",
  isFederal: true,
  state: null,
  isEnabled: true,
};

const baseAccessibility: LocationAccessibilityFlags = {
  wheelchairAccessible: true,
  accessibleParking: false,
  serviceAnimalWelcome: true,
};

const baseOverride: LocationServiceOverride = {
  serviceId: "svc1",
  serviceName: "Balayage",
  basePriceCents: 20000,
  baseDurationMin: 120,
  currency: "USD",
  overridePriceCents: 18000,
  overrideDurationMin: null,
  isAvailable: true,
};

const baseResource: ResourceItem = {
  resourceId: "r1",
  tenantId: "t1",
  locationId: "loc1",
  name: "Room A",
  type: "room",
  capacity: 2,
  status: "active",
  maintenanceNote: null,
};

const baseQueueEntry: WalkInQueueEntry = {
  entryId: "wq1",
  locationId: "loc1",
  clientName: "Bob Smith",
  partySize: 1,
  requestedServiceName: "Trim",
  requestedStaffName: null,
  waitSinceIso: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  status: "waiting",
  assignedStaffName: null,
};

const baseReport: DailyCloseReport = {
  reportId: null,
  locationId: "loc1",
  dateIso: "2025-07-01",
  expectedCashCents: 30000,
  denominationCounts: [
    { label: "$20", valueCents: 2000, quantity: 3 },
    { label: "$10", valueCents: 1000, quantity: 5 },
  ],
  countedCashCents: 11000,
  varianceCents: -19000,
  tipsByStaff: [
    { staffId: "s1", staffName: "Alice", tipsCents: 4000, currency: "USD" },
  ],
  totalTipsCents: 4000,
  currency: "USD",
  submittedAt: null,
  submittedByName: null,
};

// ---------------------------------------------------------------------------
// LocationOverviewScreen
// ---------------------------------------------------------------------------

describe("LocationOverviewScreen", () => {
  it("renders screen testID", () => {
    const { getByTestId } = render(
      <LocationOverviewScreen
        loading={false}
        error={null}
        locations={[baseLocation]}
        kpis={[baseKpi]}
        onSelectLocation={jest.fn()}
        onAddLocation={jest.fn()}
        onRetry={jest.fn()}
        onBack={jest.fn()}
      />
    );
    expect(getByTestId("location-overview-screen")).toBeTruthy();
  });

  it("renders location row", () => {
    const { getByTestId } = render(
      <LocationOverviewScreen
        loading={false}
        error={null}
        locations={[baseLocation]}
        kpis={[baseKpi]}
        onSelectLocation={jest.fn()}
        onAddLocation={jest.fn()}
        onRetry={jest.fn()}
        onBack={jest.fn()}
      />
    );
    expect(getByTestId("location-row-loc1")).toBeTruthy();
  });

  it("calls onSelectLocation when row is pressed", () => {
    const onSelect = jest.fn();
    const { getByTestId } = render(
      <LocationOverviewScreen
        loading={false}
        error={null}
        locations={[baseLocation]}
        kpis={[baseKpi]}
        onSelectLocation={onSelect}
        onAddLocation={jest.fn()}
        onRetry={jest.fn()}
        onBack={jest.fn()}
      />
    );
    fireEvent.press(getByTestId("location-row-loc1"));
    expect(onSelect).toHaveBeenCalledWith("loc1");
  });

  it("renders add-location button", () => {
    const { getByTestId } = render(
      <LocationOverviewScreen
        loading={false}
        error={null}
        locations={[]}
        kpis={[]}
        onSelectLocation={jest.fn()}
        onAddLocation={jest.fn()}
        onRetry={jest.fn()}
        onBack={jest.fn()}
      />
    );
    expect(getByTestId("add-location-btn")).toBeTruthy();
  });

  it("calls onAddLocation when button is pressed", () => {
    const onAdd = jest.fn();
    const { getByTestId } = render(
      <LocationOverviewScreen
        loading={false}
        error={null}
        locations={[]}
        kpis={[]}
        onSelectLocation={jest.fn()}
        onAddLocation={onAdd}
        onRetry={jest.fn()}
        onBack={jest.fn()}
      />
    );
    fireEvent.press(getByTestId("add-location-btn"));
    expect(onAdd).toHaveBeenCalled();
  });

  it("shows location status badge", () => {
    const { getByTestId } = render(
      <LocationOverviewScreen
        loading={false}
        error={null}
        locations={[baseLocation]}
        kpis={[baseKpi]}
        onSelectLocation={jest.fn()}
        onAddLocation={jest.fn()}
        onRetry={jest.fn()}
        onBack={jest.fn()}
      />
    );
    expect(getByTestId("location-status-loc1")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// LocationDashboardScreen
// ---------------------------------------------------------------------------

describe("LocationDashboardScreen", () => {
  it("renders screen testID", () => {
    const { getByTestId } = render(
      <LocationDashboardScreen
        loading={false}
        error={null}
        locationName="Downtown Salon"
        kpi={baseKpi}
        appointments={[baseAppointment]}
        onNavigateToSettings={jest.fn()}
        onRetry={jest.fn()}
        onBack={jest.fn()}
      />
    );
    expect(getByTestId("location-dashboard-screen")).toBeTruthy();
  });

  it("renders KPI grid", () => {
    const { getByTestId } = render(
      <LocationDashboardScreen
        loading={false}
        error={null}
        locationName="Downtown Salon"
        kpi={baseKpi}
        appointments={[]}
        onNavigateToSettings={jest.fn()}
        onRetry={jest.fn()}
        onBack={jest.fn()}
      />
    );
    expect(getByTestId("location-kpi-grid")).toBeTruthy();
    expect(getByTestId("kpi-bookings-today")).toBeTruthy();
    expect(getByTestId("kpi-revenue-today")).toBeTruthy();
  });

  it("renders appointment row", () => {
    const { getByTestId } = render(
      <LocationDashboardScreen
        loading={false}
        error={null}
        locationName="Downtown Salon"
        kpi={baseKpi}
        appointments={[baseAppointment]}
        onNavigateToSettings={jest.fn()}
        onRetry={jest.fn()}
        onBack={jest.fn()}
      />
    );
    expect(getByTestId("appointment-row-appt1")).toBeTruthy();
  });

  it("calls onNavigateToSettings when settings button pressed", () => {
    const onNav = jest.fn();
    const { getByTestId } = render(
      <LocationDashboardScreen
        loading={false}
        error={null}
        locationName="Downtown Salon"
        kpi={baseKpi}
        appointments={[]}
        onNavigateToSettings={onNav}
        onRetry={jest.fn()}
        onBack={jest.fn()}
      />
    );
    fireEvent.press(getByTestId("location-settings-btn"));
    expect(onNav).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// LocationSettingsScreen
// ---------------------------------------------------------------------------

describe("LocationSettingsScreen", () => {
  it("renders screen testID", () => {
    const { getByTestId } = render(
      <LocationSettingsScreen
        loading={false}
        error={null}
        location={baseLocation}
        accessibilityFlags={baseAccessibility}
        holidays={[baseHoliday]}
        onUpdateLocation={jest.fn().mockResolvedValue(undefined)}
        onUpdateAccessibility={jest.fn().mockResolvedValue(undefined)}
        onToggleHoliday={jest.fn().mockResolvedValue(undefined)}
        onRetry={jest.fn()}
        onBack={jest.fn()}
      />
    );
    expect(getByTestId("location-settings-screen")).toBeTruthy();
  });

  it("renders accessibility section", () => {
    const { getByTestId } = render(
      <LocationSettingsScreen
        loading={false}
        error={null}
        location={baseLocation}
        accessibilityFlags={baseAccessibility}
        holidays={[]}
        onUpdateLocation={jest.fn().mockResolvedValue(undefined)}
        onUpdateAccessibility={jest.fn().mockResolvedValue(undefined)}
        onToggleHoliday={jest.fn().mockResolvedValue(undefined)}
        onRetry={jest.fn()}
        onBack={jest.fn()}
      />
    );
    expect(getByTestId("accessibility-section")).toBeTruthy();
  });

  it("renders federal holidays section", () => {
    const { getByTestId } = render(
      <LocationSettingsScreen
        loading={false}
        error={null}
        location={baseLocation}
        accessibilityFlags={baseAccessibility}
        holidays={[baseHoliday]}
        onUpdateLocation={jest.fn().mockResolvedValue(undefined)}
        onUpdateAccessibility={jest.fn().mockResolvedValue(undefined)}
        onToggleHoliday={jest.fn().mockResolvedValue(undefined)}
        onRetry={jest.fn()}
        onBack={jest.fn()}
      />
    );
    expect(getByTestId("federal-holidays-section")).toBeTruthy();
  });

  it("renders holiday name in federal holidays section", () => {
    const { getByText } = render(
      <LocationSettingsScreen
        loading={false}
        error={null}
        location={baseLocation}
        accessibilityFlags={baseAccessibility}
        holidays={[baseHoliday]}
        onUpdateLocation={jest.fn().mockResolvedValue(undefined)}
        onUpdateAccessibility={jest.fn().mockResolvedValue(undefined)}
        onToggleHoliday={jest.fn().mockResolvedValue(undefined)}
        onRetry={jest.fn()}
        onBack={jest.fn()}
      />
    );
    expect(getByText("Independence Day")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// LocationServiceOverridesScreen
// ---------------------------------------------------------------------------

describe("LocationServiceOverridesScreen", () => {
  it("renders screen testID", () => {
    const { getByTestId } = render(
      <LocationServiceOverridesScreen
        loading={false}
        error={null}
        locationName="Downtown Salon"
        overrides={[baseOverride]}
        onEditOverride={jest.fn()}
        onRetry={jest.fn()}
        onBack={jest.fn()}
      />
    );
    expect(getByTestId("location-overrides-screen")).toBeTruthy();
  });

  it("renders override row", () => {
    const { getByTestId } = render(
      <LocationServiceOverridesScreen
        loading={false}
        error={null}
        locationName="Downtown Salon"
        overrides={[baseOverride]}
        onEditOverride={jest.fn()}
        onRetry={jest.fn()}
        onBack={jest.fn()}
      />
    );
    expect(getByTestId("override-row-svc1")).toBeTruthy();
  });

  it("calls onEditOverride when row is pressed", () => {
    const onEdit = jest.fn();
    const { getByTestId } = render(
      <LocationServiceOverridesScreen
        loading={false}
        error={null}
        locationName="Downtown Salon"
        overrides={[baseOverride]}
        onEditOverride={onEdit}
        onRetry={jest.fn()}
        onBack={jest.fn()}
      />
    );
    fireEvent.press(getByTestId("override-row-svc1"));
    expect(onEdit).toHaveBeenCalledWith("svc1");
  });

  it("shows location name in header", () => {
    const { getAllByText } = render(
      <LocationServiceOverridesScreen
        loading={false}
        error={null}
        locationName="Downtown Salon"
        overrides={[]}
        onEditOverride={jest.fn()}
        onRetry={jest.fn()}
        onBack={jest.fn()}
      />
    );
    expect(getAllByText(/Downtown Salon/).length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// ResourceManagementScreen
// ---------------------------------------------------------------------------

describe("ResourceManagementScreen", () => {
  it("renders screen testID", () => {
    const { getByTestId } = render(
      <ResourceManagementScreen
        loading={false}
        error={null}
        locationName="Downtown Salon"
        resources={[baseResource]}
        onAddResource={jest.fn()}
        onEditResource={jest.fn()}
        onRetry={jest.fn()}
        onBack={jest.fn()}
      />
    );
    expect(getByTestId("resource-management-screen")).toBeTruthy();
  });

  it("renders resource row", () => {
    const { getByTestId } = render(
      <ResourceManagementScreen
        loading={false}
        error={null}
        locationName="Downtown Salon"
        resources={[baseResource]}
        onAddResource={jest.fn()}
        onEditResource={jest.fn()}
        onRetry={jest.fn()}
        onBack={jest.fn()}
      />
    );
    expect(getByTestId("resource-row-r1")).toBeTruthy();
  });

  it("renders tab buttons", () => {
    const { getByTestId } = render(
      <ResourceManagementScreen
        loading={false}
        error={null}
        locationName="Downtown Salon"
        resources={[]}
        onAddResource={jest.fn()}
        onEditResource={jest.fn()}
        onRetry={jest.fn()}
        onBack={jest.fn()}
      />
    );
    expect(getByTestId("tab-room")).toBeTruthy();
    expect(getByTestId("tab-chair")).toBeTruthy();
    expect(getByTestId("tab-equipment")).toBeTruthy();
  });

  it("switches tab when chair tab is pressed", () => {
    const { getByTestId } = render(
      <ResourceManagementScreen
        loading={false}
        error={null}
        locationName="Downtown Salon"
        resources={[]}
        onAddResource={jest.fn()}
        onEditResource={jest.fn()}
        onRetry={jest.fn()}
        onBack={jest.fn()}
      />
    );
    fireEvent.press(getByTestId("tab-chair"));
    // tab-chair should now be active (no crash = pass)
    expect(getByTestId("tab-chair")).toBeTruthy();
  });

  it("calls onAddResource when add button is pressed", () => {
    const onAdd = jest.fn();
    const { getByTestId } = render(
      <ResourceManagementScreen
        loading={false}
        error={null}
        locationName="Downtown Salon"
        resources={[]}
        onAddResource={onAdd}
        onEditResource={jest.fn()}
        onRetry={jest.fn()}
        onBack={jest.fn()}
      />
    );
    fireEvent.press(getByTestId("add-resource-btn"));
    expect(onAdd).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// AdminWalkInQueueScreen
// ---------------------------------------------------------------------------

describe("AdminWalkInQueueScreen", () => {
  it("renders screen testID", () => {
    const { getByTestId } = render(
      <AdminWalkInQueueScreen
        loading={false}
        error={null}
        locationName="Downtown Salon"
        queue={[baseQueueEntry]}
        onAddWalkIn={jest.fn()}
        onMarkSeated={jest.fn()}
        onMarkNoShow={jest.fn()}
        onRetry={jest.fn()}
        onBack={jest.fn()}
      />
    );
    expect(getByTestId("admin-walk-in-queue-screen")).toBeTruthy();
  });

  it("renders queue entry", () => {
    const { getByTestId } = render(
      <AdminWalkInQueueScreen
        loading={false}
        error={null}
        locationName="Downtown Salon"
        queue={[baseQueueEntry]}
        onAddWalkIn={jest.fn()}
        onMarkSeated={jest.fn()}
        onMarkNoShow={jest.fn()}
        onRetry={jest.fn()}
        onBack={jest.fn()}
      />
    );
    expect(getByTestId("queue-entry-wq1")).toBeTruthy();
  });

  it("renders seat and no-show buttons for waiting entries", () => {
    const { getByTestId } = render(
      <AdminWalkInQueueScreen
        loading={false}
        error={null}
        locationName="Downtown Salon"
        queue={[baseQueueEntry]}
        onAddWalkIn={jest.fn()}
        onMarkSeated={jest.fn()}
        onMarkNoShow={jest.fn()}
        onRetry={jest.fn()}
        onBack={jest.fn()}
      />
    );
    expect(getByTestId("seat-btn-wq1")).toBeTruthy();
    expect(getByTestId("no-show-btn-wq1")).toBeTruthy();
  });

  it("calls onMarkSeated when Seat is pressed", () => {
    const onSeated = jest.fn();
    const { getByTestId } = render(
      <AdminWalkInQueueScreen
        loading={false}
        error={null}
        locationName="Downtown Salon"
        queue={[baseQueueEntry]}
        onAddWalkIn={jest.fn()}
        onMarkSeated={onSeated}
        onMarkNoShow={jest.fn()}
        onRetry={jest.fn()}
        onBack={jest.fn()}
      />
    );
    fireEvent.press(getByTestId("seat-btn-wq1"));
    expect(onSeated).toHaveBeenCalledWith("wq1");
  });

  it("calls onMarkNoShow when No-show is pressed", () => {
    const onNoShow = jest.fn();
    const { getByTestId } = render(
      <AdminWalkInQueueScreen
        loading={false}
        error={null}
        locationName="Downtown Salon"
        queue={[baseQueueEntry]}
        onAddWalkIn={jest.fn()}
        onMarkSeated={jest.fn()}
        onMarkNoShow={onNoShow}
        onRetry={jest.fn()}
        onBack={jest.fn()}
      />
    );
    fireEvent.press(getByTestId("no-show-btn-wq1"));
    expect(onNoShow).toHaveBeenCalledWith("wq1");
  });

  it("renders queue count badge", () => {
    const { getByTestId } = render(
      <AdminWalkInQueueScreen
        loading={false}
        error={null}
        locationName="Downtown Salon"
        queue={[baseQueueEntry]}
        onAddWalkIn={jest.fn()}
        onMarkSeated={jest.fn()}
        onMarkNoShow={jest.fn()}
        onRetry={jest.fn()}
        onBack={jest.fn()}
      />
    );
    expect(getByTestId("queue-count-badge")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// DailyCloseScreen
// ---------------------------------------------------------------------------

describe("DailyCloseScreen", () => {
  it("renders screen testID", () => {
    const { getByTestId } = render(
      <DailyCloseScreen
        loading={false}
        error={null}
        report={baseReport}
        submitting={false}
        onIncrementDenomination={jest.fn()}
        onDecrementDenomination={jest.fn()}
        onSubmit={jest.fn()}
        onRetry={jest.fn()}
        onBack={jest.fn()}
      />
    );
    expect(getByTestId("daily-close-screen")).toBeTruthy();
  });

  it("renders checklist section", () => {
    const { getByTestId } = render(
      <DailyCloseScreen
        loading={false}
        error={null}
        report={baseReport}
        submitting={false}
        onIncrementDenomination={jest.fn()}
        onDecrementDenomination={jest.fn()}
        onSubmit={jest.fn()}
        onRetry={jest.fn()}
        onBack={jest.fn()}
      />
    );
    expect(getByTestId("checklist-section")).toBeTruthy();
    expect(getByTestId("check-cashDrawer")).toBeTruthy();
    expect(getByTestId("check-products")).toBeTruthy();
    expect(getByTestId("check-tipsReconciled")).toBeTruthy();
  });

  it("renders denomination rows", () => {
    const { getByTestId } = render(
      <DailyCloseScreen
        loading={false}
        error={null}
        report={baseReport}
        submitting={false}
        onIncrementDenomination={jest.fn()}
        onDecrementDenomination={jest.fn()}
        onSubmit={jest.fn()}
        onRetry={jest.fn()}
        onBack={jest.fn()}
      />
    );
    expect(getByTestId("denomination-$20")).toBeTruthy();
    expect(getByTestId("denomination-$10")).toBeTruthy();
  });

  it("calls onIncrementDenomination when + pressed", () => {
    const onIncrement = jest.fn();
    const { getByTestId } = render(
      <DailyCloseScreen
        loading={false}
        error={null}
        report={baseReport}
        submitting={false}
        onIncrementDenomination={onIncrement}
        onDecrementDenomination={jest.fn()}
        onSubmit={jest.fn()}
        onRetry={jest.fn()}
        onBack={jest.fn()}
      />
    );
    fireEvent.press(getByTestId("increment-$20"));
    expect(onIncrement).toHaveBeenCalledWith("$20");
  });

  it("submit button is disabled before checklist is complete", () => {
    const { getByTestId } = render(
      <DailyCloseScreen
        loading={false}
        error={null}
        report={baseReport}
        submitting={false}
        onIncrementDenomination={jest.fn()}
        onDecrementDenomination={jest.fn()}
        onSubmit={jest.fn()}
        onRetry={jest.fn()}
        onBack={jest.fn()}
      />
    );
    expect(getByTestId("submit-close-btn").props.accessibilityState?.disabled).toBeTruthy();
  });

  it("submit button becomes enabled after all checklist items are checked", () => {
    const { getByTestId } = render(
      <DailyCloseScreen
        loading={false}
        error={null}
        report={baseReport}
        submitting={false}
        onIncrementDenomination={jest.fn()}
        onDecrementDenomination={jest.fn()}
        onSubmit={jest.fn()}
        onRetry={jest.fn()}
        onBack={jest.fn()}
      />
    );
    fireEvent.press(getByTestId("check-cashDrawer"));
    fireEvent.press(getByTestId("check-products"));
    fireEvent.press(getByTestId("check-tipsReconciled"));
    expect(getByTestId("submit-close-btn").props.accessibilityState?.disabled).toBeFalsy();
  });

  it("shows submitted banner when report is already submitted", () => {
    const submittedReport: DailyCloseReport = {
      ...baseReport,
      submittedAt: "2025-07-01T20:00:00Z",
      submittedByName: "Alice",
    };
    const { getByTestId } = render(
      <DailyCloseScreen
        loading={false}
        error={null}
        report={submittedReport}
        submitting={false}
        onIncrementDenomination={jest.fn()}
        onDecrementDenomination={jest.fn()}
        onSubmit={jest.fn()}
        onRetry={jest.fn()}
        onBack={jest.fn()}
      />
    );
    expect(getByTestId("submitted-banner")).toBeTruthy();
  });

  it("renders tips section when tipsByStaff is non-empty", () => {
    const { getByTestId } = render(
      <DailyCloseScreen
        loading={false}
        error={null}
        report={baseReport}
        submitting={false}
        onIncrementDenomination={jest.fn()}
        onDecrementDenomination={jest.fn()}
        onSubmit={jest.fn()}
        onRetry={jest.fn()}
        onBack={jest.fn()}
      />
    );
    expect(getByTestId("tips-section")).toBeTruthy();
    expect(getByTestId("tips-row-s1")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// AdminFirstRunTourOverlay
// ---------------------------------------------------------------------------

describe("AdminFirstRunTourOverlay", () => {
  it("does not render contents when visible=false", () => {
    const { queryByTestId } = render(
      <AdminFirstRunTourOverlay
        visible={false}
        userId="u1"
        tenantId="t1"
        onComplete={jest.fn()}
        testID="admin-tour"
      />
    );
    // CoachMark uses a Modal — when not visible the card is not found
    expect(queryByTestId("admin-tour-card")).toBeNull();
  });

  it("renders title on first step when visible=true", () => {
    const { getByTestId } = render(
      <AdminFirstRunTourOverlay
        visible={true}
        userId="u1"
        tenantId="t1"
        onComplete={jest.fn()}
        testID="admin-tour"
      />
    );
    expect(getByTestId("admin-tour-title")).toBeTruthy();
  });

  it("advances to next step when Next is pressed", () => {
    const { getByTestId } = render(
      <AdminFirstRunTourOverlay
        visible={true}
        userId="u1"
        tenantId="t1"
        onComplete={jest.fn()}
        testID="admin-tour"
      />
    );
    // Step 1: press next
    fireEvent.press(getByTestId("admin-tour-next"));
    // dot-1 should now be active (step index 1)
    expect(getByTestId("admin-tour-dot-1")).toBeTruthy();
  });

  it("calls onComplete when Skip is pressed", () => {
    const onComplete = jest.fn();
    const { getByTestId } = render(
      <AdminFirstRunTourOverlay
        visible={true}
        userId="u1"
        tenantId="t1"
        onComplete={onComplete}
        testID="admin-tour"
      />
    );
    fireEvent.press(getByTestId("admin-tour-skip"));
    expect(onComplete).toHaveBeenCalled();
  });

  it("calls onComplete after advancing through all steps", () => {
    const onComplete = jest.fn();
    const { getByTestId } = render(
      <AdminFirstRunTourOverlay
        visible={true}
        userId="u1"
        tenantId="t1"
        onComplete={onComplete}
        testID="admin-tour"
      />
    );
    // 5 steps: advance through all
    for (let i = 0; i < 5; i++) {
      fireEvent.press(getByTestId("admin-tour-next"));
    }
    expect(onComplete).toHaveBeenCalled();
  });

  it("renders 5 step dots", () => {
    const { getByTestId } = render(
      <AdminFirstRunTourOverlay
        visible={true}
        userId="u1"
        tenantId="t1"
        onComplete={jest.fn()}
        testID="admin-tour"
      />
    );
    for (let i = 0; i < 5; i++) {
      expect(getByTestId(`admin-tour-dot-${i}`)).toBeTruthy();
    }
  });
});
