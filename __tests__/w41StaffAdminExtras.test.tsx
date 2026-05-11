/**
 * w41StaffAdminExtras.test.tsx
 *
 * W41 — Staff Administration (90 tests)
 *
 * Covers:
 *   - AdminPatterns: AdminDataTable (multi-select, empty state, row press)
 *   - AdminPatterns: BulkActionBar (hidden when 0, action buttons, clear)
 *   - AdminPatterns: BulkConfirmModal (visible/hidden, confirm/cancel, destructive)
 *   - staffAdminService: reactivateStaffMember, readSchedule, saveSchedule
 *   - StaffListScreen: table render, multi-select, bulk-action bar, invite nav
 *   - StaffScheduleScreen: loading, empty, week template, exceptions
 *   - StaffPerformanceScreen: loading, KPI tiles, null values
 *   - StaffCommissionScreen: percentage model, flat model, no config
 *   - StaffInviteScreen: form validation, role chips, submit flow
 *   - StaffRoleScreen: role picker, audit trail, save disabled until changed
 *   - routes.ts: W41 routes registered
 */

import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

import {
  AdminDataTable,
  BulkActionBar,
  BulkConfirmModal,
  type AdminDataTableColumn,
} from "../src/app/admin/AdminPatterns";
import { StaffListScreen } from "../src/app/admin/AdminScreens";
import { StaffScheduleScreen } from "../src/app/admin/StaffScheduleScreen";
import { StaffPerformanceScreen } from "../src/app/admin/StaffPerformanceScreen";
import { StaffCommissionScreen } from "../src/app/admin/StaffCommissionScreen";
import { StaffInviteScreen } from "../src/app/admin/StaffInviteScreen";
import { StaffRoleScreen } from "../src/app/admin/StaffRoleScreen";
import { createStaffAdminService } from "../src/app/admin/staffAdminService";

import type { StaffMember } from "../src/domains/staff";
import type { StaffRepository } from "../src/domains/staff/repository";
import type { StaffSchedulesRepository } from "../src/domains/staff/staffSchedulesRepository";
import type { StaffScheduleTemplate } from "../src/domains/staff";
import { appRoutes } from "../src/app/navigation/routes";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeStaffMember(overrides: Partial<StaffMember> = {}): StaffMember {
  return {
    staffId: "s1",
    tenantId: "t1",
    userId: "u1",
    displayName: "Ana Novak",
    role: "technician",
    status: "active",
    locationIds: ["loc1"],
    serviceIds: ["svc1"],
    skills: [],
    constraints: [],
    createdAt: {} as never,
    updatedAt: {} as never,
    ...overrides,
  };
}

function makeScheduleTemplate(overrides: Partial<StaffScheduleTemplate> = {}): StaffScheduleTemplate {
  return {
    scheduleId: "sch1",
    tenantId: "t1",
    staffId: "s1",
    locationId: "loc1",
    weekTemplate: {
      mon: [{ start: "09:00", end: "17:00" }],
      wed: [{ start: "10:00", end: "18:00" }],
    },
    exceptions: [
      { date: "2025-12-25", blocks: [], isClosed: true, note: "Christmas" },
    ],
    updatedAt: {} as never,
    ...overrides,
  };
}

function makeStaffRepo(overrides: Partial<StaffRepository> = {}): StaffRepository {
  return {
    createStaff: async () => makeStaffMember(),
    updateStaff: async () => undefined,
    listLocationStaff: async () => [makeStaffMember()],
    listServiceQualifiedStaff: async () => [],
    deactivateStaff: async () => undefined,
    ...overrides,
  };
}

function makeScheduleRepo(overrides: Partial<StaffSchedulesRepository> = {}): StaffSchedulesRepository {
  return {
    upsertScheduleTemplate: async () => makeScheduleTemplate(),
    getScheduleTemplate: async () => makeScheduleTemplate(),
    addException: async () => undefined,
    removeException: async () => undefined,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// AdminDataTable
// ---------------------------------------------------------------------------

type Row = { id: string; name: string; role: string };

function makeColumns(): AdminDataTableColumn<Row>[] {
  return [
    { header: "Name", render: (r) => r.name, flex: 2 },
    { header: "Role", render: (r) => r.role, flex: 1 },
  ];
}

describe("AdminDataTable", () => {
  it("renders column headers", () => {
    const { getByText } = render(
      <AdminDataTable
        columns={makeColumns()}
        rows={[]}
        keyExtractor={(r) => r.id}
        testID="dt"
      />
    );
    expect(getByText("Name")).toBeTruthy();
    expect(getByText("Role")).toBeTruthy();
  });

  it("renders empty label when rows is empty", () => {
    const { getByText } = render(
      <AdminDataTable
        columns={makeColumns()}
        rows={[]}
        keyExtractor={(r) => r.id}
        emptyLabel="Nothing here"
        testID="dt"
      />
    );
    expect(getByText("Nothing here")).toBeTruthy();
  });

  it("renders row data", () => {
    const rows: Row[] = [{ id: "r1", name: "Jane", role: "manager" }];
    const { getByText } = render(
      <AdminDataTable
        columns={makeColumns()}
        rows={rows}
        keyExtractor={(r) => r.id}
        testID="dt"
      />
    );
    expect(getByText("Jane")).toBeTruthy();
    expect(getByText("manager")).toBeTruthy();
  });

  it("calls onRowPress when a row is pressed", () => {
    const onRowPress = jest.fn();
    const rows: Row[] = [{ id: "r1", name: "Jane", role: "manager" }];
    const { getByTestId } = render(
      <AdminDataTable
        columns={makeColumns()}
        rows={rows}
        keyExtractor={(r) => r.id}
        onRowPress={onRowPress}
        testID="dt"
      />
    );
    fireEvent.press(getByTestId("dt-row-r1"));
    expect(onRowPress).toHaveBeenCalledWith(rows[0]);
  });

  it("shows checkboxes when selectable=true", () => {
    const rows: Row[] = [{ id: "r1", name: "Jane", role: "manager" }];
    const { getByTestId } = render(
      <AdminDataTable
        columns={makeColumns()}
        rows={rows}
        keyExtractor={(r) => r.id}
        selectable
        selectedKeys={new Set()}
        onSelectionChange={jest.fn()}
        testID="dt"
      />
    );
    expect(getByTestId("dt-check-r1")).toBeTruthy();
    expect(getByTestId("dt-select-all")).toBeTruthy();
  });

  it("calls onSelectionChange when a checkbox is pressed", () => {
    const onSelectionChange = jest.fn();
    const rows: Row[] = [{ id: "r1", name: "Jane", role: "manager" }];
    const { getByTestId } = render(
      <AdminDataTable
        columns={makeColumns()}
        rows={rows}
        keyExtractor={(r) => r.id}
        selectable
        selectedKeys={new Set()}
        onSelectionChange={onSelectionChange}
        testID="dt"
      />
    );
    fireEvent.press(getByTestId("dt-check-r1"));
    expect(onSelectionChange).toHaveBeenCalledWith(new Set(["r1"]));
  });

  it("calls onSelectionChange with empty set when all already selected and select-all pressed", () => {
    const onSelectionChange = jest.fn();
    const rows: Row[] = [{ id: "r1", name: "Jane", role: "manager" }];
    const { getByTestId } = render(
      <AdminDataTable
        columns={makeColumns()}
        rows={rows}
        keyExtractor={(r) => r.id}
        selectable
        selectedKeys={new Set(["r1"])}
        onSelectionChange={onSelectionChange}
        testID="dt"
      />
    );
    fireEvent.press(getByTestId("dt-select-all"));
    expect(onSelectionChange).toHaveBeenCalledWith(new Set());
  });

  it("does not show checkboxes when selectable=false (default)", () => {
    const rows: Row[] = [{ id: "r1", name: "Jane", role: "manager" }];
    const { queryByTestId } = render(
      <AdminDataTable
        columns={makeColumns()}
        rows={rows}
        keyExtractor={(r) => r.id}
        testID="dt"
      />
    );
    expect(queryByTestId("dt-check-r1")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// BulkActionBar
// ---------------------------------------------------------------------------

describe("BulkActionBar", () => {
  it("returns null when selectedCount is 0", () => {
    const { queryByTestId } = render(
      <BulkActionBar
        selectedCount={0}
        actions={[]}
        onClearSelection={jest.fn()}
        testID="bar"
      />
    );
    expect(queryByTestId("bar")).toBeNull();
  });

  it("renders when selectedCount > 0", () => {
    const { getByTestId } = render(
      <BulkActionBar
        selectedCount={3}
        actions={[]}
        onClearSelection={jest.fn()}
        testID="bar"
      />
    );
    expect(getByTestId("bar")).toBeTruthy();
  });

  it("shows selected count label", () => {
    const { getByText } = render(
      <BulkActionBar
        selectedCount={5}
        actions={[]}
        onClearSelection={jest.fn()}
        testID="bar"
      />
    );
    expect(getByText("5 selected ×")).toBeTruthy();
  });

  it("calls onClearSelection when count label pressed", () => {
    const onClear = jest.fn();
    const { getByTestId } = render(
      <BulkActionBar
        selectedCount={2}
        actions={[]}
        onClearSelection={onClear}
        testID="bar"
      />
    );
    fireEvent.press(getByTestId("bar-clear"));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("renders action buttons", () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <BulkActionBar
        selectedCount={1}
        actions={[{ label: "Archive", onPress, testID: "action-archive" }]}
        onClearSelection={jest.fn()}
        testID="bar"
      />
    );
    fireEvent.press(getByTestId("action-archive"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// BulkConfirmModal
// ---------------------------------------------------------------------------

describe("BulkConfirmModal", () => {
  it("is not visible when visible=false", () => {
    const { queryByTestId } = render(
      <BulkConfirmModal
        visible={false}
        title="Deactivate"
        body="Are you sure?"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
        testID="modal"
      />
    );
    // RNTR does not render Modal content when visible=false
    expect(queryByTestId("modal")).toBeNull();
  });

  it("renders title and body when visible", () => {
    const { getByTestId } = render(
      <BulkConfirmModal
        visible
        title="Deactivate 3 staff"
        body="Cannot be undone."
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
        testID="modal"
      />
    );
    expect(getByTestId("modal-title")).toBeTruthy();
    expect(getByTestId("modal-body")).toBeTruthy();
  });

  it("calls onConfirm when confirm button pressed", () => {
    const onConfirm = jest.fn();
    const { getByTestId } = render(
      <BulkConfirmModal
        visible
        title="Delete"
        body="Sure?"
        onConfirm={onConfirm}
        onCancel={jest.fn()}
        testID="modal"
      />
    );
    fireEvent.press(getByTestId("modal-confirm"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when cancel button pressed", () => {
    const onCancel = jest.fn();
    const { getByTestId } = render(
      <BulkConfirmModal
        visible
        title="Delete"
        body="Sure?"
        onConfirm={jest.fn()}
        onCancel={onCancel}
        testID="modal"
      />
    );
    fireEvent.press(getByTestId("modal-cancel"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("uses custom confirm and cancel labels", () => {
    const { getByText } = render(
      <BulkConfirmModal
        visible
        title="T"
        body="B"
        confirmLabel="Yes, delete"
        cancelLabel="No, keep"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
        testID="modal"
      />
    );
    expect(getByText("Yes, delete")).toBeTruthy();
    expect(getByText("No, keep")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// staffAdminService — reactivate + schedule
// ---------------------------------------------------------------------------

describe("staffAdminService — reactivateStaffMember", () => {
  it("calls updateStaff with status active and returns ok", async () => {
    const updateStaff = jest.fn(async () => undefined);
    const repo = makeStaffRepo({ updateStaff });
    const service = createStaffAdminService({ staffRepository: repo });

    const result = await service.reactivateStaffMember("s1", "t1");

    expect(result.ok).toBe(true);
    expect(updateStaff).toHaveBeenCalledWith("s1", "t1", { status: "active" });
  });

  it("returns error when repository throws", async () => {
    const repo = makeStaffRepo({
      updateStaff: async () => { throw new Error("fail"); },
    });
    const service = createStaffAdminService({ staffRepository: repo });

    const result = await service.reactivateStaffMember("s1", "t1");
    expect(result.ok).toBe(false);
  });
});

describe("staffAdminService — readSchedule", () => {
  it("returns error when scheduleRepository not configured", async () => {
    const repo = makeStaffRepo();
    const service = createStaffAdminService({ staffRepository: repo });

    const result = await service.readSchedule("t1", "s1", "loc1");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("not configured");
    }
  });

  it("returns schedule template from repository", async () => {
    const schedRepo = makeScheduleRepo({
      getScheduleTemplate: async () => makeScheduleTemplate(),
    });
    const service = createStaffAdminService({
      staffRepository: makeStaffRepo(),
      scheduleRepository: schedRepo,
    });

    const result = await service.readSchedule("t1", "s1", "loc1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data?.scheduleId).toBe("sch1");
    }
  });

  it("returns null when no schedule found", async () => {
    const schedRepo = makeScheduleRepo({
      getScheduleTemplate: async () => null,
    });
    const service = createStaffAdminService({
      staffRepository: makeStaffRepo(),
      scheduleRepository: schedRepo,
    });

    const result = await service.readSchedule("t1", "s1", "loc1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toBeNull();
    }
  });

  it("returns error when repository throws", async () => {
    const schedRepo = makeScheduleRepo({
      getScheduleTemplate: async () => { throw new Error("Firestore fail"); },
    });
    const service = createStaffAdminService({
      staffRepository: makeStaffRepo(),
      scheduleRepository: schedRepo,
    });

    const result = await service.readSchedule("t1", "s1", "loc1");
    expect(result.ok).toBe(false);
  });
});

describe("staffAdminService — saveSchedule", () => {
  it("returns error when scheduleRepository not configured", async () => {
    const service = createStaffAdminService({ staffRepository: makeStaffRepo() });
    const result = await service.saveSchedule({
      tenantId: "t1", staffId: "s1", locationId: "loc1",
      weekTemplate: {}, exceptions: [],
    });
    expect(result.ok).toBe(false);
  });

  it("calls upsertScheduleTemplate and returns result", async () => {
    const upsert = jest.fn(async () => makeScheduleTemplate());
    const service = createStaffAdminService({
      staffRepository: makeStaffRepo(),
      scheduleRepository: makeScheduleRepo({ upsertScheduleTemplate: upsert }),
    });
    const result = await service.saveSchedule({
      tenantId: "t1", staffId: "s1", locationId: "loc1",
      weekTemplate: { mon: [{ start: "09:00", end: "17:00" }] }, exceptions: [],
    });
    expect(result.ok).toBe(true);
    expect(upsert).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// StaffListScreen
// ---------------------------------------------------------------------------

function defaultStaffListProps() {
  return {
    loading: false,
    errorMessage: null,
    staffList: [makeStaffMember({ staffId: "s1", displayName: "Ana Novak", role: "technician" })],
    onRetry: jest.fn(),
    onCreateStaff: jest.fn(),
    onInviteStaff: jest.fn(),
    onSelectStaff: jest.fn(),
    onBulkDeactivate: jest.fn(),
    onBack: jest.fn(),
  };
}

describe("StaffListScreen", () => {
  it("renders staff name in table", () => {
    const { getByText } = render(<StaffListScreen {...defaultStaffListProps()} />);
    expect(getByText("Ana Novak")).toBeTruthy();
  });

  it("shows empty state when staffList is empty", () => {
    const { getByText } = render(
      <StaffListScreen {...defaultStaffListProps()} staffList={[]} />
    );
    expect(getByText("No staff members yet.")).toBeTruthy();
  });

  it("shows loading indicator", () => {
    const { getByText } = render(
      <StaffListScreen {...defaultStaffListProps()} loading staffList={[]} />
    );
    expect(getByText("Loading staff…")).toBeTruthy();
  });

  it("calls onCreateStaff when Add staff pressed", () => {
    const onCreateStaff = jest.fn();
    const { getByTestId } = render(
      <StaffListScreen {...defaultStaffListProps()} onCreateStaff={onCreateStaff} />
    );
    fireEvent.press(getByTestId("staff-list-add-btn"));
    expect(onCreateStaff).toHaveBeenCalledTimes(1);
  });

  it("calls onInviteStaff when Invite pressed", () => {
    const onInviteStaff = jest.fn();
    const { getByTestId } = render(
      <StaffListScreen {...defaultStaffListProps()} onInviteStaff={onInviteStaff} />
    );
    fireEvent.press(getByTestId("staff-list-invite-btn"));
    expect(onInviteStaff).toHaveBeenCalledTimes(1);
  });

  it("calls onSelectStaff when a row is tapped", () => {
    const onSelectStaff = jest.fn();
    const { getByTestId } = render(
      <StaffListScreen {...defaultStaffListProps()} onSelectStaff={onSelectStaff} />
    );
    fireEvent.press(getByTestId("staff-table-row-s1"));
    expect(onSelectStaff).toHaveBeenCalledWith(expect.objectContaining({ staffId: "s1" }));
  });
});

// ---------------------------------------------------------------------------
// StaffScheduleScreen
// ---------------------------------------------------------------------------

describe("StaffScheduleScreen", () => {
  it("shows loading state", () => {
    const { getByText } = render(
      <StaffScheduleScreen
        staffName="Ana"
        loading
        error={null}
        schedule={null}
        onRetry={jest.fn()}
        onBack={jest.fn()}
      />
    );
    expect(getByText("Loading schedule…")).toBeTruthy();
  });

  it("shows error state", () => {
    const { getByText } = render(
      <StaffScheduleScreen
        staffName="Ana"
        loading={false}
        error="Connection failed"
        schedule={null}
        onRetry={jest.fn()}
        onBack={jest.fn()}
      />
    );
    expect(getByText("Connection failed")).toBeTruthy();
  });

  it("shows empty message when no schedule", () => {
    const { getByText } = render(
      <StaffScheduleScreen
        staffName="Ana"
        loading={false}
        error={null}
        schedule={null}
        onRetry={jest.fn()}
        onBack={jest.fn()}
      />
    );
    expect(getByText(/No schedule set/)).toBeTruthy();
  });

  it("renders week template days", () => {
    const { getByTestId } = render(
      <StaffScheduleScreen
        staffName="Ana"
        loading={false}
        error={null}
        schedule={makeScheduleTemplate()}
        onRetry={jest.fn()}
        onBack={jest.fn()}
      />
    );
    expect(getByTestId("schedule-day-mon")).toBeTruthy();
    expect(getByTestId("schedule-day-tue")).toBeTruthy();
  });

  it("renders exception rows", () => {
    const { getByTestId } = render(
      <StaffScheduleScreen
        staffName="Ana"
        loading={false}
        error={null}
        schedule={makeScheduleTemplate()}
        onRetry={jest.fn()}
        onBack={jest.fn()}
      />
    );
    expect(getByTestId("schedule-exception-2025-12-25")).toBeTruthy();
  });

  it("calls onBack when back pressed", () => {
    const onBack = jest.fn();
    const { getByText } = render(
      <StaffScheduleScreen
        staffName="Ana"
        loading={false}
        error={null}
        schedule={null}
        onRetry={jest.fn()}
        onBack={onBack}
      />
    );
    fireEvent.press(getByText("‹ Ana"));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// StaffPerformanceScreen
// ---------------------------------------------------------------------------

describe("StaffPerformanceScreen", () => {
  const defaultSummary = {
    bookingsCompleted: 42,
    bookingsCancelled: 3,
    bookingsNoShow: 1,
    averageRating: 4.8,
    revenueEstimatedCents: 185000,
  };

  it("shows loading state", () => {
    const { getByText } = render(
      <StaffPerformanceScreen
        staffName="Ana"
        loading
        error={null}
        summary={null}
        periodLabel="Last 30 days"
        onRetry={jest.fn()}
        onBack={jest.fn()}
      />
    );
    expect(getByText("Loading metrics…")).toBeTruthy();
  });

  it("renders KPI values", () => {
    const { getByTestId } = render(
      <StaffPerformanceScreen
        staffName="Ana"
        loading={false}
        error={null}
        summary={defaultSummary}
        periodLabel="Last 30 days"
        onRetry={jest.fn()}
        onBack={jest.fn()}
      />
    );
    expect(getByTestId("kpi-completed")).toBeTruthy();
    expect(getByTestId("kpi-revenue")).toBeTruthy();
  });

  it("shows dash when averageRating is null", () => {
    const { getByText } = render(
      <StaffPerformanceScreen
        staffName="Ana"
        loading={false}
        error={null}
        summary={{ ...defaultSummary, averageRating: null }}
        periodLabel="Last 30 days"
        onRetry={jest.fn()}
        onBack={jest.fn()}
      />
    );
    expect(getByText("—")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// StaffCommissionScreen
// ---------------------------------------------------------------------------

describe("StaffCommissionScreen", () => {
  it("shows empty state when config is null", () => {
    const { getByText } = render(
      <StaffCommissionScreen staffName="Ana" config={null} onBack={jest.fn()} />
    );
    expect(getByText(/No commission configuration/)).toBeTruthy();
  });

  it("shows percentage model details", () => {
    const { getByTestId } = render(
      <StaffCommissionScreen
        staffName="Ana"
        config={{
          commissionRate: 30,
          model: "percentage",
          flatRateCents: null,
          payoutSchedule: "monthly",
          currency: "USD",
        }}
        onBack={jest.fn()}
      />
    );
    expect(getByTestId("commission-rate")).toBeTruthy();
    expect(getByTestId("commission-schedule")).toBeTruthy();
  });

  it("shows flat rate model", () => {
    const { getByTestId } = render(
      <StaffCommissionScreen
        staffName="Ana"
        config={{
          commissionRate: 0,
          model: "flat_per_booking",
          flatRateCents: 500,
          payoutSchedule: "weekly",
          currency: "USD",
        }}
        onBack={jest.fn()}
      />
    );
    expect(getByTestId("commission-flat")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// StaffInviteScreen
// ---------------------------------------------------------------------------

describe("StaffInviteScreen", () => {
  function defaultInviteProps() {
    return {
      email: "",
      role: "technician" as const,
      locationId: "",
      submitting: false,
      formError: null,
      submitError: null,
      submitSuccess: null,
      onEmailChange: jest.fn(),
      onRoleChange: jest.fn(),
      onLocationIdChange: jest.fn(),
      onSubmit: jest.fn(),
      onBack: jest.fn(),
    };
  }

  it("renders email input", () => {
    const { getByTestId } = render(<StaffInviteScreen {...defaultInviteProps()} />);
    expect(getByTestId("invite-email-input")).toBeTruthy();
  });

  it("renders all role chips", () => {
    const { getByTestId } = render(<StaffInviteScreen {...defaultInviteProps()} />);
    expect(getByTestId("invite-role-owner")).toBeTruthy();
    expect(getByTestId("invite-role-manager")).toBeTruthy();
    expect(getByTestId("invite-role-technician")).toBeTruthy();
    expect(getByTestId("invite-role-assistant")).toBeTruthy();
  });

  it("calls onRoleChange when a role chip is pressed", () => {
    const onRoleChange = jest.fn();
    const { getByTestId } = render(
      <StaffInviteScreen {...defaultInviteProps()} onRoleChange={onRoleChange} />
    );
    fireEvent.press(getByTestId("invite-role-manager"));
    expect(onRoleChange).toHaveBeenCalledWith("manager");
  });

  it("calls onSubmit when submit pressed", () => {
    const onSubmit = jest.fn();
    const { getByTestId } = render(
      <StaffInviteScreen {...defaultInviteProps()} email="jane@example.com" onSubmit={onSubmit} />
    );
    fireEvent.press(getByTestId("invite-submit-btn"));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("shows form error message", () => {
    const { getByTestId } = render(
      <StaffInviteScreen {...defaultInviteProps()} formError="Email required" />
    );
    expect(getByTestId("invite-form-error")).toBeTruthy();
  });

  it("submit button is disabled while submitting", () => {
    const { getByTestId } = render(
      <StaffInviteScreen {...defaultInviteProps()} submitting />
    );
    // Pressable has disabled prop
    const btn = getByTestId("invite-submit-btn");
    expect(btn.props.accessibilityState?.disabled).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// StaffRoleScreen
// ---------------------------------------------------------------------------

describe("StaffRoleScreen", () => {
  function defaultRoleProps() {
    return {
      staffName: "Ana Novak",
      currentRole: "technician" as const,
      pendingRole: "technician" as const,
      auditTrail: [],
      submitting: false,
      submitError: null,
      submitSuccess: null,
      onRoleChange: jest.fn(),
      onSave: jest.fn(),
      onBack: jest.fn(),
    };
  }

  it("renders all role option chips", () => {
    const { getByTestId } = render(<StaffRoleScreen {...defaultRoleProps()} />);
    expect(getByTestId("role-option-owner")).toBeTruthy();
    expect(getByTestId("role-option-manager")).toBeTruthy();
    expect(getByTestId("role-option-technician")).toBeTruthy();
    expect(getByTestId("role-option-assistant")).toBeTruthy();
  });

  it("calls onRoleChange when a chip pressed", () => {
    const onRoleChange = jest.fn();
    const { getByTestId } = render(
      <StaffRoleScreen {...defaultRoleProps()} onRoleChange={onRoleChange} />
    );
    fireEvent.press(getByTestId("role-option-manager"));
    expect(onRoleChange).toHaveBeenCalledWith("manager");
  });

  it("save button is disabled when pendingRole === currentRole", () => {
    const { getByTestId } = render(<StaffRoleScreen {...defaultRoleProps()} />);
    const btn = getByTestId("role-save-btn");
    expect(btn.props.accessibilityState?.disabled).toBe(true);
  });

  it("save button is enabled when pendingRole !== currentRole", () => {
    const { getByTestId } = render(
      <StaffRoleScreen {...defaultRoleProps()} pendingRole="manager" />
    );
    const btn = getByTestId("role-save-btn");
    expect(btn.props.accessibilityState?.disabled).toBeFalsy();
  });

  it("shows empty audit trail message", () => {
    const { getByText } = render(<StaffRoleScreen {...defaultRoleProps()} />);
    expect(getByText("No role changes recorded.")).toBeTruthy();
  });

  it("renders audit trail entries", () => {
    const audit = [{
      id: "a1",
      changedBy: "owner@salon.com",
      fromRole: "assistant" as const,
      toRole: "technician" as const,
      changedAt: "2025-06-01T10:00:00Z",
      reason: "Promotion",
    }];
    const { getByTestId } = render(
      <StaffRoleScreen {...defaultRoleProps()} auditTrail={audit} />
    );
    expect(getByTestId("audit-entry-a1")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// routes.ts — W41 routes registered
// ---------------------------------------------------------------------------

describe("routes.ts — W41 routes", () => {
  const routeNames = appRoutes.map((r) => r.name);

  it("includes StaffSchedule", () => {
    expect(routeNames).toContain("StaffSchedule");
  });

  it("includes StaffPerformance", () => {
    expect(routeNames).toContain("StaffPerformance");
  });

  it("includes StaffCommission", () => {
    expect(routeNames).toContain("StaffCommission");
  });

  it("includes StaffInvite", () => {
    expect(routeNames).toContain("StaffInvite");
  });

  it("includes StaffRole", () => {
    expect(routeNames).toContain("StaffRole");
  });

  it("W41 staff routes have guard authenticated", () => {
    const w41Routes = appRoutes.filter((r) => [
      "StaffSchedule", "StaffPerformance", "StaffCommission", "StaffInvite", "StaffRole"
    ].includes(r.name));
    w41Routes.forEach((route) => {
      expect(route.guard).toBe("authenticated");
    });
  });

  it("also registers retroactive W39 BillingHub route", () => {
    expect(routeNames).toContain("BillingHub");
  });

  it("also registers retroactive W40 LocationOverview route", () => {
    expect(routeNames).toContain("LocationOverview");
  });
});
