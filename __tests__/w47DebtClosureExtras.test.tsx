/**
 * w47DebtClosureExtras.test.tsx
 *
 * W47 — Technical Debt Closure (8 debts from W41–W42)
 *
 * Covers:
 *   - staffInviteService: W41-DEBT-1 validation & not-configured path
 *   - commissionService: W41-DEBT-2 not-configured, save validation
 *   - roleAuditService: W41-DEBT-4 not-configured
 *   - StaffCommissionScreen edit mode: W41-DEBT-2 UI additions
 *   - StaffScheduleScreen edit mode: W41-DEBT-5 UI additions
 *   - StaffServiceMappingScreen: W41-DEBT-6 full coverage
 *   - serviceCatalogAdapters: W42-DEBT-1 factory structure
 *   - routes.ts: StaffServiceMapping route registered
 */

import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

import { createStaffInviteService } from "../src/app/admin/staffInviteService";
import { createCommissionService } from "../src/app/admin/commissionService";
import { createRoleAuditService } from "../src/app/admin/roleAuditService";
import { StaffCommissionScreen } from "../src/app/admin/StaffCommissionScreen";
import { StaffScheduleScreen } from "../src/app/admin/StaffScheduleScreen";
import { StaffServiceMappingScreen } from "../src/app/admin/StaffServiceMappingScreen";
import {
  createServiceCategoryRepository,
  createServiceAddonRepository,
  createServiceSeasonalRuleRepository,
  createServiceBookingRulesRepository,
  createServiceVisibilityRepository,
  createServicePriceOverrideRepository,
  createServiceMediaRepository,
  createServiceSetupRepository,
  normaliseVariants,
} from "../src/app/admin/serviceCatalogAdapters";
import { appRoutes } from "../src/app/navigation/routes";

import type { StaffCommissionConfig } from "../src/app/admin/StaffCommissionScreen";
import type { EditWeekHours } from "../src/app/admin/StaffScheduleScreen";
import type { StaffScheduleTemplate } from "../src/domains/staff";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_CONFIG: StaffCommissionConfig = {
  commissionRate: 15,
  model: "percentage",
  flatRateCents: null,
  payoutSchedule: "monthly",
  currency: "EUR",
};

function makeEditWeekHours(): EditWeekHours {
  const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
  const hours = {} as EditWeekHours;
  for (const day of DAYS) {
    hours[day] = { enabled: day === "mon" || day === "tue", start: "09:00", end: "18:00" };
  }
  return hours;
}

function makeSchedule(): StaffScheduleTemplate {
  return {
    scheduleId: "sch1",
    tenantId: "t1",
    staffId: "s1",
    locationId: "loc1",
    weekTemplate: { mon: [{ start: "09:00", end: "17:00" }] },
    exceptions: [],
    updatedAt: {} as never,
  };
}

// ---------------------------------------------------------------------------
// staffInviteService — W41-DEBT-1
// ---------------------------------------------------------------------------

describe("staffInviteService (W41-DEBT-1)", () => {
  it("returns not-configured when db is absent", async () => {
    const svc = createStaffInviteService(undefined);
    const result = await svc.sendInvite({
      tenantId: "t1",
      email: "a@b.com",
      role: "technician",
      locationId: "loc1",
      invitedBy: "admin",
    });
    expect(result.ok).toBe(false);
    expect((result as { ok: false; message: string }).message).toMatch(/not configured/i);
  });

  it("returns validation error when email is empty", async () => {
    const svc = createStaffInviteService(undefined);
    // Validation runs before db check — let's verify by testing the guard
    // When db is undefined, not-configured is returned first. Test a second
    // validator by creating a minimal fake db stub.
    const fakeDb = {} as never;
    const svc2 = createStaffInviteService(fakeDb);
    // sendInvite internally calls setDoc which will throw — but the empty-email
    // guard fires before db interaction so we get the validation message.
    const result = await svc2.sendInvite({
      tenantId: "t1",
      email: "   ",
      role: "technician",
      locationId: "loc1",
      invitedBy: "admin",
    });
    expect(result.ok).toBe(false);
    expect((result as { ok: false; message: string }).message).toMatch(/email/i);
  });

  it("returns validation error when tenantId is missing", async () => {
    const fakeDb = {} as never;
    const svc = createStaffInviteService(fakeDb);
    const result = await svc.sendInvite({
      tenantId: "",
      email: "user@example.com",
      role: "technician",
      locationId: "loc1",
      invitedBy: "admin",
    });
    expect(result.ok).toBe(false);
    expect((result as { ok: false; message: string }).message).toMatch(/tenant/i);
  });

  it("is a factory that returns an object with sendInvite", () => {
    const svc = createStaffInviteService(undefined);
    expect(typeof svc.sendInvite).toBe("function");
  });
});

// ---------------------------------------------------------------------------
// commissionService — W41-DEBT-2
// ---------------------------------------------------------------------------

describe("commissionService (W41-DEBT-2)", () => {
  it("loadConfig returns not-configured when db is absent", async () => {
    const svc = createCommissionService(undefined);
    const result = await svc.loadConfig("s1", "t1");
    expect(result.ok).toBe(false);
    expect((result as { ok: false; message: string }).message).toMatch(/not configured/i);
  });

  it("saveConfig returns not-configured when db is absent", async () => {
    const svc = createCommissionService(undefined);
    const result = await svc.saveConfig("s1", "t1", MOCK_CONFIG);
    expect(result.ok).toBe(false);
    expect((result as { ok: false; message: string }).message).toMatch(/not configured/i);
  });

  it("saveConfig validates commission rate range", async () => {
    const fakeDb = {} as never;
    const svc = createCommissionService(fakeDb);
    const result = await svc.saveConfig("s1", "t1", { ...MOCK_CONFIG, commissionRate: 110 });
    expect(result.ok).toBe(false);
    expect((result as { ok: false; message: string }).message).toMatch(/rate/i);
  });

  it("saveConfig validates negative commission rate", async () => {
    const fakeDb = {} as never;
    const svc = createCommissionService(fakeDb);
    const result = await svc.saveConfig("s1", "t1", { ...MOCK_CONFIG, commissionRate: -1 });
    expect(result.ok).toBe(false);
    expect((result as { ok: false; message: string }).message).toMatch(/rate/i);
  });

  it("is a factory returning loadConfig and saveConfig", () => {
    const svc = createCommissionService(undefined);
    expect(typeof svc.loadConfig).toBe("function");
    expect(typeof svc.saveConfig).toBe("function");
  });
});

// ---------------------------------------------------------------------------
// roleAuditService — W41-DEBT-4
// ---------------------------------------------------------------------------

describe("roleAuditService (W41-DEBT-4)", () => {
  it("writeRoleAudit returns not-configured when db is absent", async () => {
    const svc = createRoleAuditService(undefined);
    const result = await svc.writeRoleAudit("s1", "t1", {
      fromRole: "technician",
      toRole: "manager",
      changedBy: "admin",
    });
    expect(result.ok).toBe(false);
    expect((result as { ok: false; message: string }).message).toMatch(/not configured/i);
  });

  it("listRoleAudit returns not-configured when db is absent", async () => {
    const svc = createRoleAuditService(undefined);
    const result = await svc.listRoleAudit("s1", "t1");
    expect(result.ok).toBe(false);
    expect((result as { ok: false; message: string }).message).toMatch(/not configured/i);
  });

  it("is a factory returning writeRoleAudit and listRoleAudit", () => {
    const svc = createRoleAuditService(undefined);
    expect(typeof svc.writeRoleAudit).toBe("function");
    expect(typeof svc.listRoleAudit).toBe("function");
  });
});

// ---------------------------------------------------------------------------
// StaffCommissionScreen edit mode — W41-DEBT-2
// ---------------------------------------------------------------------------

describe("StaffCommissionScreen — edit mode", () => {
  it("shows Edit button when onToggleEditMode is provided", () => {
    const { getByTestId } = render(
      <StaffCommissionScreen
        staffName="Ana"
        config={MOCK_CONFIG}
        onBack={jest.fn()}
        onToggleEditMode={jest.fn()}
        testID="scs"
      />,
    );
    expect(getByTestId("commission-edit-toggle")).toBeTruthy();
  });

  it("calls onToggleEditMode when Edit is pressed", () => {
    const toggle = jest.fn();
    const { getByTestId } = render(
      <StaffCommissionScreen
        staffName="Ana"
        config={MOCK_CONFIG}
        onBack={jest.fn()}
        onToggleEditMode={toggle}
        testID="scs"
      />,
    );
    fireEvent.press(getByTestId("commission-edit-toggle"));
    expect(toggle).toHaveBeenCalledTimes(1);
  });

  it("renders rate input in edit mode", () => {
    const { getByTestId } = render(
      <StaffCommissionScreen
        staffName="Ana"
        config={MOCK_CONFIG}
        onBack={jest.fn()}
        editMode
        editModel="percentage"
        editRate="15"
        testID="scs"
      />,
    );
    expect(getByTestId("commission-rate-input")).toBeTruthy();
  });

  it("renders flat rate input when model is flat_per_booking", () => {
    const { getByTestId } = render(
      <StaffCommissionScreen
        staffName="Ana"
        config={{ ...MOCK_CONFIG, model: "flat_per_booking" }}
        onBack={jest.fn()}
        editMode
        editModel="flat_per_booking"
        testID="scs"
      />,
    );
    expect(getByTestId("commission-flat-input")).toBeTruthy();
  });

  it("renders save button in edit mode and calls onSave", () => {
    const onSave = jest.fn();
    const { getByTestId } = render(
      <StaffCommissionScreen
        staffName="Ana"
        config={MOCK_CONFIG}
        onBack={jest.fn()}
        editMode
        editModel="percentage"
        editRate="15"
        editSchedule="monthly"
        onSave={onSave}
        testID="scs"
      />,
    );
    const btn = getByTestId("commission-save-btn");
    expect(btn).toBeTruthy();
    fireEvent.press(btn);
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it("shows submit error in edit mode", () => {
    const { getByTestId } = render(
      <StaffCommissionScreen
        staffName="Ana"
        config={MOCK_CONFIG}
        onBack={jest.fn()}
        editMode
        editModel="percentage"
        editRate="15"
        editSchedule="monthly"
        submitError="Something went wrong"
        testID="scs"
      />,
    );
    expect(getByTestId("commission-submit-error")).toBeTruthy();
  });

  it("shows schedule chips in edit mode", () => {
    const { getByTestId } = render(
      <StaffCommissionScreen
        staffName="Ana"
        config={MOCK_CONFIG}
        onBack={jest.fn()}
        editMode
        editModel="percentage"
        editRate="15"
        editSchedule="weekly"
        testID="scs"
      />,
    );
    expect(getByTestId("commission-schedule-weekly")).toBeTruthy();
    expect(getByTestId("commission-schedule-biweekly")).toBeTruthy();
    expect(getByTestId("commission-schedule-monthly")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// StaffScheduleScreen edit mode — W41-DEBT-5
// ---------------------------------------------------------------------------

describe("StaffScheduleScreen — edit mode", () => {
  it("shows Edit hours button when onToggleEditMode is provided", () => {
    const { getByTestId } = render(
      <StaffScheduleScreen
        staffName="Ana"
        loading={false}
        error={null}
        schedule={null}
        onRetry={jest.fn()}
        onBack={jest.fn()}
        onToggleEditMode={jest.fn()}
        testID="sss"
      />,
    );
    expect(getByTestId("schedule-edit-toggle")).toBeTruthy();
  });

  it("calls onToggleEditMode when Edit hours is pressed", () => {
    const toggle = jest.fn();
    const { getByTestId } = render(
      <StaffScheduleScreen
        staffName="Ana"
        loading={false}
        error={null}
        schedule={null}
        onRetry={jest.fn()}
        onBack={jest.fn()}
        onToggleEditMode={toggle}
        testID="sss"
      />,
    );
    fireEvent.press(getByTestId("schedule-edit-toggle"));
    expect(toggle).toHaveBeenCalledTimes(1);
  });

  it("renders day edit blocks in edit mode", () => {
    const { getByTestId } = render(
      <StaffScheduleScreen
        staffName="Ana"
        loading={false}
        error={null}
        schedule={makeSchedule()}
        onRetry={jest.fn()}
        onBack={jest.fn()}
        editMode
        editWeekHours={makeEditWeekHours()}
        testID="sss"
      />,
    );
    expect(getByTestId("schedule-edit-mon")).toBeTruthy();
    expect(getByTestId("schedule-edit-fri")).toBeTruthy();
  });

  it("renders start time input for enabled day", () => {
    const hours = makeEditWeekHours();
    const { getByTestId } = render(
      <StaffScheduleScreen
        staffName="Ana"
        loading={false}
        error={null}
        schedule={makeSchedule()}
        onRetry={jest.fn()}
        onBack={jest.fn()}
        editMode
        editWeekHours={hours}
        testID="sss"
      />,
    );
    // mon is enabled — start input should be present
    expect(getByTestId("schedule-start-mon")).toBeTruthy();
  });

  it("renders save button in edit mode and calls onSaveSchedule", () => {
    const onSave = jest.fn();
    const { getByTestId } = render(
      <StaffScheduleScreen
        staffName="Ana"
        loading={false}
        error={null}
        schedule={makeSchedule()}
        onRetry={jest.fn()}
        onBack={jest.fn()}
        editMode
        editWeekHours={makeEditWeekHours()}
        onSaveSchedule={onSave}
        testID="sss"
      />,
    );
    fireEvent.press(getByTestId("schedule-save-btn"));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it("shows save error in edit mode", () => {
    const { getByTestId } = render(
      <StaffScheduleScreen
        staffName="Ana"
        loading={false}
        error={null}
        schedule={makeSchedule()}
        onRetry={jest.fn()}
        onBack={jest.fn()}
        editMode
        editWeekHours={makeEditWeekHours()}
        scheduleSaveError="Cannot save schedule"
        testID="sss"
      />,
    );
    expect(getByTestId("schedule-save-error")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// StaffServiceMappingScreen — W41-DEBT-6
// ---------------------------------------------------------------------------

describe("StaffServiceMappingScreen (W41-DEBT-6)", () => {
  const services = [
    { serviceId: "svc1", name: "Haircut" },
    { serviceId: "svc2", name: "Color" },
    { serviceId: "svc3", name: "Nails" },
  ];

  it("renders with root testID", () => {
    const { getByTestId } = render(
      <StaffServiceMappingScreen
        staffName="Ana"
        assignedServiceIds={[]}
        skills={[]}
        serviceOptions={services}
        submitting={false}
        submitError={null}
        submitSuccess={null}
        onToggleService={jest.fn()}
        onSkillsChange={jest.fn()}
        onSave={jest.fn()}
        onBack={jest.fn()}
        testID="ssm"
      />,
    );
    expect(getByTestId("ssm")).toBeTruthy();
  });

  it("renders a toggle row for each service", () => {
    const { getByTestId } = render(
      <StaffServiceMappingScreen
        staffName="Ana"
        assignedServiceIds={["svc1"]}
        skills={[]}
        serviceOptions={services}
        submitting={false}
        submitError={null}
        submitSuccess={null}
        onToggleService={jest.fn()}
        onSkillsChange={jest.fn()}
        onSave={jest.fn()}
        onBack={jest.fn()}
      />,
    );
    expect(getByTestId("service-toggle-svc1")).toBeTruthy();
    expect(getByTestId("service-toggle-svc2")).toBeTruthy();
    expect(getByTestId("service-toggle-svc3")).toBeTruthy();
  });

  it("calls onToggleService when a service row is pressed", () => {
    const onToggle = jest.fn();
    const { getByTestId } = render(
      <StaffServiceMappingScreen
        staffName="Ana"
        assignedServiceIds={[]}
        skills={[]}
        serviceOptions={services}
        submitting={false}
        submitError={null}
        submitSuccess={null}
        onToggleService={onToggle}
        onSkillsChange={jest.fn()}
        onSave={jest.fn()}
        onBack={jest.fn()}
      />,
    );
    fireEvent.press(getByTestId("service-toggle-svc2"));
    expect(onToggle).toHaveBeenCalledWith("svc2");
  });

  it("renders skills text input", () => {
    const { getByTestId } = render(
      <StaffServiceMappingScreen
        staffName="Ana"
        assignedServiceIds={[]}
        skills={["balayage"]}
        serviceOptions={[]}
        submitting={false}
        submitError={null}
        submitSuccess={null}
        onToggleService={jest.fn()}
        onSkillsChange={jest.fn()}
        onSave={jest.fn()}
        onBack={jest.fn()}
      />,
    );
    expect(getByTestId("skills-input")).toBeTruthy();
  });

  it("calls onSkillsChange when skills input is changed", () => {
    const onSkillsChange = jest.fn();
    const { getByTestId } = render(
      <StaffServiceMappingScreen
        staffName="Ana"
        assignedServiceIds={[]}
        skills={[]}
        serviceOptions={[]}
        submitting={false}
        submitError={null}
        submitSuccess={null}
        onToggleService={jest.fn()}
        onSkillsChange={onSkillsChange}
        onSave={jest.fn()}
        onBack={jest.fn()}
      />,
    );
    fireEvent.changeText(getByTestId("skills-input"), "balayage, nail art");
    expect(onSkillsChange).toHaveBeenCalledWith("balayage, nail art");
  });

  it("renders save button and calls onSave when pressed", () => {
    const onSave = jest.fn();
    const { getByTestId } = render(
      <StaffServiceMappingScreen
        staffName="Ana"
        assignedServiceIds={[]}
        skills={[]}
        serviceOptions={services}
        submitting={false}
        submitError={null}
        submitSuccess={null}
        onToggleService={jest.fn()}
        onSkillsChange={jest.fn()}
        onSave={onSave}
        onBack={jest.fn()}
      />,
    );
    fireEvent.press(getByTestId("save-mapping-btn"));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it("shows submit error when submitError prop is set", () => {
    const { getByTestId } = render(
      <StaffServiceMappingScreen
        staffName="Ana"
        assignedServiceIds={[]}
        skills={[]}
        serviceOptions={[]}
        submitting={false}
        submitError="Failed to save mapping"
        submitSuccess={null}
        onToggleService={jest.fn()}
        onSkillsChange={jest.fn()}
        onSave={jest.fn()}
        onBack={jest.fn()}
      />,
    );
    expect(getByTestId("mapping-submit-error")).toBeTruthy();
  });

  it("disables save button while submitting", () => {
    const onSave = jest.fn();
    const { getByTestId } = render(
      <StaffServiceMappingScreen
        staffName="Ana"
        assignedServiceIds={[]}
        skills={[]}
        serviceOptions={[]}
        submitting
        submitError={null}
        submitSuccess={null}
        onToggleService={jest.fn()}
        onSkillsChange={jest.fn()}
        onSave={onSave}
        onBack={jest.fn()}
      />,
    );
    const btn = getByTestId("save-mapping-btn");
    expect(btn).toBeTruthy();
    // Disabled = should not fire onSave
    fireEvent.press(btn);
    expect(onSave).not.toHaveBeenCalled();
  });

  it("shows empty state when no services are available", () => {
    const { getByText } = render(
      <StaffServiceMappingScreen
        staffName="Ana"
        assignedServiceIds={[]}
        skills={[]}
        serviceOptions={[]}
        submitting={false}
        submitError={null}
        submitSuccess={null}
        onToggleService={jest.fn()}
        onSkillsChange={jest.fn()}
        onSave={jest.fn()}
        onBack={jest.fn()}
      />,
    );
    expect(getByText(/no services found/i)).toBeTruthy();
  });

  it("calls onBack when back row is pressed", () => {
    const onBack = jest.fn();
    const { getByText } = render(
      <StaffServiceMappingScreen
        staffName="Ana"
        assignedServiceIds={[]}
        skills={[]}
        serviceOptions={[]}
        submitting={false}
        submitError={null}
        submitSuccess={null}
        onToggleService={jest.fn()}
        onSkillsChange={jest.fn()}
        onSave={jest.fn()}
        onBack={onBack}
      />,
    );
    fireEvent.press(getByText(/‹/));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// serviceCatalogAdapters — W42-DEBT-1 structural tests
// ---------------------------------------------------------------------------

describe("serviceCatalogAdapters (W42-DEBT-1)", () => {
  // All factories require a real Firestore db — we test that they're callable
  // and return objects with the correct method signatures (no Firestore calls
  // are made in these structural tests).
  const fakeDb = {} as never;

  it("createServiceCategoryRepository returns object with required methods", () => {
    const repo = createServiceCategoryRepository(fakeDb);
    expect(typeof repo.listCategories).toBe("function");
    expect(typeof repo.createCategory).toBe("function");
    expect(typeof repo.updateCategory).toBe("function");
    expect(typeof repo.deleteCategory).toBe("function");
  });

  it("createServiceAddonRepository returns object with required methods", () => {
    const repo = createServiceAddonRepository(fakeDb);
    expect(typeof repo.listAddons).toBe("function");
    expect(typeof repo.createAddon).toBe("function");
    expect(typeof repo.updateAddon).toBe("function");
  });

  it("createServiceSeasonalRuleRepository returns object with required methods", () => {
    const repo = createServiceSeasonalRuleRepository(fakeDb);
    expect(typeof repo.listRules).toBe("function");
    expect(typeof repo.createRule).toBe("function");
    expect(typeof repo.deleteRule).toBe("function");
  });

  it("createServiceBookingRulesRepository returns object with required methods", () => {
    const repo = createServiceBookingRulesRepository(fakeDb);
    expect(typeof repo.getRules).toBe("function");
    expect(typeof repo.saveRules).toBe("function");
  });

  it("createServiceVisibilityRepository returns object with required methods", () => {
    const repo = createServiceVisibilityRepository(fakeDb);
    expect(typeof repo.getVisibility).toBe("function");
    expect(typeof repo.saveVisibility).toBe("function");
  });

  it("createServicePriceOverrideRepository returns object with required methods", () => {
    const repo = createServicePriceOverrideRepository(fakeDb);
    expect(typeof repo.listOverrides).toBe("function");
    expect(typeof repo.upsertOverride).toBe("function");
    expect(typeof repo.deleteOverride).toBe("function");
  });

  it("createServiceMediaRepository returns object with required methods", () => {
    const repo = createServiceMediaRepository(fakeDb);
    expect(typeof repo.listMedia).toBe("function");
  });

  it("createServiceSetupRepository returns object with all Phase 7 methods", () => {
    const repo = createServiceSetupRepository(fakeDb);
    expect(typeof repo.listPlatformCategories).toBe("function");
    expect(typeof repo.getNameSuggestions).toBe("function");
    expect(typeof repo.createServiceDraft).toBe("function");
    expect(typeof repo.saveVariants).toBe("function");
    expect(typeof repo.saveAddons).toBe("function");
    expect(typeof repo.saveVariantLabel).toBe("function");
    expect(typeof repo.addPhoto).toBe("function");
    expect(typeof repo.deletePhoto).toBe("function");
    expect(typeof repo.publishService).toBe("function");
  });
});

// ---------------------------------------------------------------------------
// normaliseVariants — Phase 7 variant validation (pure unit tests)
// ---------------------------------------------------------------------------

describe("normaliseVariants (Phase 7)", () => {
  it("auto-creates Standard variant when empty array provided", () => {
    const result = normaliseVariants([]);
    expect(result).toHaveLength(1);
    expect(result[0]!.name).toBe("Standard");
    expect(result[0]!.isDefault).toBe(true);
  });

  it("marks first variant as default when none is marked", () => {
    const result = normaliseVariants([
      { name: "Short", durationMinutes: 30, price: 2000, currency: "GBP", isDefault: false },
      { name: "Long", durationMinutes: 60, price: 3500, currency: "GBP", isDefault: false },
    ]);
    expect(result[0]!.isDefault).toBe(true);
    expect(result[1]!.isDefault).toBe(false);
  });

  it("keeps exactly one default when multiple are marked", () => {
    const result = normaliseVariants([
      { name: "A", durationMinutes: 30, price: 1000, currency: "GBP", isDefault: true },
      { name: "B", durationMinutes: 45, price: 1500, currency: "GBP", isDefault: true },
    ]);
    const defaults = result.filter((v) => v.isDefault);
    expect(defaults).toHaveLength(1);
    expect(defaults[0]!.name).toBe("A");
  });

  it("passes through a valid single-variant list unchanged", () => {
    const input = [{ name: "Standard", durationMinutes: 45, price: 4500, currency: "GBP", isDefault: true }];
    const result = normaliseVariants(input);
    expect(result).toHaveLength(1);
    expect(result[0]!.isDefault).toBe(true);
  });

  it("preserves all variants in a valid multi-variant list", () => {
    const input = [
      { name: "Short", durationMinutes: 30, price: 2000, currency: "GBP", isDefault: true },
      { name: "Long", durationMinutes: 60, price: 3500, currency: "GBP", isDefault: false },
      { name: "XL", durationMinutes: 90, price: 5000, currency: "GBP", isDefault: false },
    ];
    const result = normaliseVariants(input);
    expect(result).toHaveLength(3);
    expect(result.filter((v) => v.isDefault)).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// routes.ts — StaffServiceMapping registered (W41-DEBT-6)
// ---------------------------------------------------------------------------

describe("routes.ts — W41-DEBT-6 registration", () => {
  it("registers StaffServiceMapping route", () => {
    const found = appRoutes.find((r) => r.name === "StaffServiceMapping");
    expect(found).toBeDefined();
  });

  it("StaffServiceMapping route is in owner group", () => {
    const found = appRoutes.find((r) => r.name === "StaffServiceMapping");
    expect(found?.group).toBe("owner");
  });

  it("StaffServiceMapping route requires authentication", () => {
    const found = appRoutes.find((r) => r.name === "StaffServiceMapping");
    expect(found?.guard).toBe("authenticated");
  });
});
