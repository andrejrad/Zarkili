/**
 * w42ServiceCatalogExtras.test.tsx
 *
 * W42 — Service Catalog Depth (~70 tests)
 *
 * Covers:
 *   parseImportCsv (pure function)
 *   createServiceCatalogService (factory — readCategories, saveBookingRules)
 *   ServiceCategoriesScreen
 *   ServiceBulkImportScreen
 *   ServicePricingScreen
 *   ServiceAddOnsScreen
 *   ServiceSeasonalRulesScreen
 *   ServicePhotosScreen
 *   ServiceBookingRulesScreen
 *   ServiceVisibilityScreen
 *   routes.ts — 8 W42 routes
 */

import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import type { Timestamp } from "firebase/firestore";

import {
  parseImportCsv,
  createServiceCatalogService,
} from "../src/app/admin/serviceCatalogService";
import type {
  ServiceCategoryRepository,
  ServiceBookingRulesRepository,
} from "../src/app/admin/serviceCatalogService";

import { ServiceCategoriesScreen } from "../src/app/admin/ServiceCategoriesScreen";
import { ServiceBulkImportScreen } from "../src/app/admin/ServiceBulkImportScreen";
import { ServicePricingScreen } from "../src/app/admin/ServicePricingScreen";
import { ServiceAddOnsScreen } from "../src/app/admin/ServiceAddOnsScreen";
import { ServiceSeasonalRulesScreen } from "../src/app/admin/ServiceSeasonalRulesScreen";
import { ServicePhotosScreen } from "../src/app/admin/ServicePhotosScreen";
import { ServiceBookingRulesScreen } from "../src/app/admin/ServiceBookingRulesScreen";
import { ServiceVisibilityScreen } from "../src/app/admin/ServiceVisibilityScreen";

import { appRoutes as ROUTES } from "../src/app/navigation/routes";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Fake Timestamp for fixture data */
const fakeTs = { seconds: 0, nanoseconds: 0 } as unknown as Timestamp;

const VALID_CSV =
  "name,category,durationMinutes,price,currency\nHaircut,hair,45,35,USD\nBlowout,hair,30,25,USD\nColour,colour,120,90,EUR";

// ---------------------------------------------------------------------------
// parseImportCsv
// ---------------------------------------------------------------------------

describe("parseImportCsv — pure function", () => {
  it("returns an error for empty input", () => {
    const result = parseImportCsv("");
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.rows.length).toBe(0);
  });

  it("returns an error when a required column is missing", () => {
    const csv = "name,category,price,currency\nHaircut,hair,35,USD";
    const result = parseImportCsv(csv);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toMatch(/durationminutes/i);
  });

  it("parses a valid CSV and returns correct row count", () => {
    const result = parseImportCsv(VALID_CSV);
    expect(result.errors.length).toBe(0);
    expect(result.rows.length).toBe(3);
  });

  it("parses row fields correctly", () => {
    const result = parseImportCsv(VALID_CSV);
    expect(result.rows[0]).toMatchObject({
      name: "Haircut",
      category: "hair",
      durationMinutes: 45,
      price: 35,
      currency: "USD",
    });
  });

  it("returns a row error when name is empty", () => {
    const csv = "name,category,durationMinutes,price,currency\n,hair,45,35,USD";
    const result = parseImportCsv(csv);
    expect(result.errors.some((e) => /name is required/i.test(e))).toBe(true);
  });

  it("returns a row error when category is empty", () => {
    const csv = "name,category,durationMinutes,price,currency\nHaircut,,45,35,USD";
    const result = parseImportCsv(csv);
    expect(result.errors.some((e) => /category is required/i.test(e))).toBe(true);
  });

  it("returns a row error when currency is not 3 letters", () => {
    const csv = "name,category,durationMinutes,price,currency\nHaircut,hair,45,35,US";
    const result = parseImportCsv(csv);
    expect(result.errors.some((e) => /3-letter/i.test(e))).toBe(true);
  });

  it("returns a row error when durationMinutes is not a positive integer", () => {
    const csv = "name,category,durationMinutes,price,currency\nHaircut,hair,-5,35,USD";
    const result = parseImportCsv(csv);
    expect(result.errors.some((e) => /durationMinutes must be a positive integer/i.test(e))).toBe(true);
  });

  it("returns a row error when price is negative", () => {
    const csv = "name,category,durationMinutes,price,currency\nHaircut,hair,45,-1,USD";
    const result = parseImportCsv(csv);
    expect(result.errors.some((e) => /price must be/i.test(e))).toBe(true);
  });

  it("handles headers case-insensitively", () => {
    const csv = "Name,Category,DurationMinutes,Price,Currency\nHaircut,hair,45,35,USD";
    const result = parseImportCsv(csv);
    expect(result.errors.length).toBe(0);
    expect(result.rows.length).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// createServiceCatalogService — readCategories
// ---------------------------------------------------------------------------

describe("serviceCatalogService.readCategories", () => {
  it("returns not-configured when no repo provided", async () => {
    const svc = createServiceCatalogService();
    const result = await svc.readCategories("t1");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/Category repository not configured/i);
  });

  it("returns ok:true with data when repo resolves", async () => {
    const fakeCategory = {
      categoryId: "c1",
      tenantId: "t1",
      name: "Hair",
      sortOrder: 0,
      createdAt: fakeTs,
      updatedAt: fakeTs,
    };
    const repo: ServiceCategoryRepository = {
      listCategories: jest.fn().mockResolvedValue([fakeCategory]),
      createCategory: jest.fn(),
      updateCategory: jest.fn(),
      deleteCategory: jest.fn(),
    };
    const svc = createServiceCatalogService({ categoryRepository: repo });
    const result = await svc.readCategories("t1");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toHaveLength(1);
  });

  it("returns ok:false when repo throws", async () => {
    const repo: ServiceCategoryRepository = {
      listCategories: jest.fn().mockRejectedValue(new Error("Firestore down")),
      createCategory: jest.fn(),
      updateCategory: jest.fn(),
      deleteCategory: jest.fn(),
    };
    const svc = createServiceCatalogService({ categoryRepository: repo });
    const result = await svc.readCategories("t1");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toBe("Firestore down");
  });
});

// ---------------------------------------------------------------------------
// createServiceCatalogService — saveBookingRules
// ---------------------------------------------------------------------------

describe("serviceCatalogService.saveBookingRules", () => {
  it("returns not-configured when no repo provided", async () => {
    const svc = createServiceCatalogService();
    const result = await svc.saveBookingRules("t1", "s1", { depositPercent: 10 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/BookingRules repository not configured/i);
  });

  it("returns ok:true when repo resolves", async () => {
    const savedRules = {
      serviceId: "s1",
      tenantId: "t1",
      depositPercent: 10,
      cancellationWindowHours: 24,
      leadTimeHours: 1,
      bufferMinutes: 0,
      updatedAt: fakeTs,
    };
    const repo: ServiceBookingRulesRepository = {
      getRules: jest.fn().mockResolvedValue(null),
      saveRules: jest.fn().mockResolvedValue(savedRules),
    };
    const svc = createServiceCatalogService({ bookingRulesRepository: repo });
    const result = await svc.saveBookingRules("t1", "s1", { depositPercent: 10 });
    expect(result.ok).toBe(true);
  });

  it("returns ok:false when repo throws", async () => {
    const repo: ServiceBookingRulesRepository = {
      getRules: jest.fn().mockResolvedValue(null),
      saveRules: jest.fn().mockRejectedValue(new Error("Write failed")),
    };
    const svc = createServiceCatalogService({ bookingRulesRepository: repo });
    const result = await svc.saveBookingRules("t1", "s1", { depositPercent: 10 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toBe("Write failed");
  });
});

// ---------------------------------------------------------------------------
// ServiceCategoriesScreen
// ---------------------------------------------------------------------------

const defaultCatProps = {
  loading: false,
  error: null,
  categories: [],
  newCategoryName: "",
  submitting: false,
  formError: null,
  onNewCategoryNameChange: jest.fn(),
  onCreateCategory: jest.fn(),
  onDeleteCategory: jest.fn(),
  onRetry: jest.fn(),
  onBack: jest.fn(),
};

describe("ServiceCategoriesScreen", () => {
  it("shows loading state", () => {
    const { getByText } = render(
      <ServiceCategoriesScreen {...defaultCatProps} loading={true} />,
    );
    expect(getByText(/loading categories/i)).toBeTruthy();
  });

  it("shows error state", () => {
    const { getByText } = render(
      <ServiceCategoriesScreen {...defaultCatProps} error="DB error" />,
    );
    expect(getByText(/DB error/)).toBeTruthy();
  });

  it("renders screen root when data available", () => {
    const { getByTestId } = render(
      <ServiceCategoriesScreen {...defaultCatProps} testID="scs" />,
    );
    expect(getByTestId("scs")).toBeTruthy();
  });

  it("renders new category input and create button", () => {
    const { getByTestId } = render(
      <ServiceCategoriesScreen {...defaultCatProps} testID="scs" />,
    );
    expect(getByTestId("scs-new-name-input")).toBeTruthy();
    expect(getByTestId("scs-create-btn")).toBeTruthy();
  });

  it("calls onCreateCategory when create button pressed", () => {
    const onCreateCategory = jest.fn();
    const { getByTestId } = render(
      <ServiceCategoriesScreen
        {...defaultCatProps}
        onCreateCategory={onCreateCategory}
        testID="scs"
      />,
    );
    fireEvent.press(getByTestId("scs-create-btn"));
    expect(onCreateCategory).toHaveBeenCalled();
  });

  it("shows formError when present", () => {
    const { getByTestId } = render(
      <ServiceCategoriesScreen
        {...defaultCatProps}
        formError="Name required"
        testID="scs"
      />,
    );
    expect(getByTestId("scs-form-error")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// ServiceBulkImportScreen
// ---------------------------------------------------------------------------

const defaultImportProps = {
  csvText: "",
  parsedRows: [],
  parseErrors: [],
  importSubmitting: false,
  importSuccess: null,
  importError: null,
  onCsvChange: jest.fn(),
  onImport: jest.fn(),
  onBack: jest.fn(),
};

describe("ServiceBulkImportScreen", () => {
  it("renders CSV input", () => {
    const { getByTestId } = render(
      <ServiceBulkImportScreen {...defaultImportProps} testID="sbis" />,
    );
    expect(getByTestId("sbis-csv-input")).toBeTruthy();
  });

  it("calls onCsvChange when text changes", () => {
    const onCsvChange = jest.fn();
    const { getByTestId } = render(
      <ServiceBulkImportScreen
        {...defaultImportProps}
        onCsvChange={onCsvChange}
        testID="sbis"
      />,
    );
    fireEvent.changeText(getByTestId("sbis-csv-input"), "abc");
    expect(onCsvChange).toHaveBeenCalledWith("abc");
  });

  it("shows parse errors when present", () => {
    const { getByTestId } = render(
      <ServiceBulkImportScreen
        {...defaultImportProps}
        parseErrors={["Row 2: name required"]}
        testID="sbis"
      />,
    );
    expect(getByTestId("sbis-parse-errors")).toBeTruthy();
  });

  it("shows preview when parsedRows present and no errors", () => {
    const rows = [{ name: "Haircut", category: "hair", durationMinutes: 45, price: 35, currency: "USD" }];
    const { getByTestId } = render(
      <ServiceBulkImportScreen
        {...defaultImportProps}
        parsedRows={rows}
        testID="sbis"
      />,
    );
    expect(getByTestId("sbis-preview")).toBeTruthy();
  });

  it("shows importSuccess message when set", () => {
    const { getByTestId } = render(
      <ServiceBulkImportScreen
        {...defaultImportProps}
        importSuccess="3 services imported"
        testID="sbis"
      />,
    );
    expect(getByTestId("sbis-import-success")).toBeTruthy();
  });

  it("calls onImport when import button pressed with valid rows", () => {
    const onImport = jest.fn();
    const rows = [{ name: "Haircut", category: "hair", durationMinutes: 45, price: 35, currency: "USD" }];
    const { getByTestId } = render(
      <ServiceBulkImportScreen
        {...defaultImportProps}
        parsedRows={rows}
        onImport={onImport}
        testID="sbis"
      />,
    );
    fireEvent.press(getByTestId("sbis-import-btn"));
    expect(onImport).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// ServicePricingScreen
// ---------------------------------------------------------------------------

const defaultPricingProps = {
  serviceName: "Haircut",
  loading: false,
  error: null,
  overrides: [],
  locationId: "",
  price: "",
  currency: "",
  submitting: false,
  formError: null,
  onLocationIdChange: jest.fn(),
  onPriceChange: jest.fn(),
  onCurrencyChange: jest.fn(),
  onUpsert: jest.fn(),
  onDeleteOverride: jest.fn(),
  onRetry: jest.fn(),
  onBack: jest.fn(),
};

describe("ServicePricingScreen", () => {
  it("shows loading state", () => {
    const { getByText } = render(
      <ServicePricingScreen {...defaultPricingProps} loading={true} />,
    );
    expect(getByText(/loading price overrides/i)).toBeTruthy();
  });

  it("shows error state", () => {
    const { getByText } = render(
      <ServicePricingScreen {...defaultPricingProps} error="Fetch failed" />,
    );
    expect(getByText(/Fetch failed/)).toBeTruthy();
  });

  it("renders form inputs", () => {
    const { getByTestId } = render(
      <ServicePricingScreen {...defaultPricingProps} testID="sps" />,
    );
    expect(getByTestId("sps-location-input")).toBeTruthy();
    expect(getByTestId("sps-price-input")).toBeTruthy();
    expect(getByTestId("sps-currency-input")).toBeTruthy();
  });

  it("calls onUpsert when save override pressed", () => {
    const onUpsert = jest.fn();
    const { getByTestId } = render(
      <ServicePricingScreen {...defaultPricingProps} onUpsert={onUpsert} testID="sps" />,
    );
    fireEvent.press(getByTestId("sps-upsert-btn"));
    expect(onUpsert).toHaveBeenCalled();
  });

  it("calls onDeleteOverride when delete override pressed", () => {
    const onDeleteOverride = jest.fn();
    const override = {
      overrideId: "ov1",
      serviceId: "s1",
      locationId: "loc1",
      tenantId: "t1",
      price: 40,
      currency: "USD",
      updatedAt: fakeTs,
    };
    const { getByTestId } = render(
      <ServicePricingScreen
        {...defaultPricingProps}
        overrides={[override]}
        onDeleteOverride={onDeleteOverride}
        testID="sps"
      />,
    );
    fireEvent.press(getByTestId("sps-delete-override-ov1"));
    expect(onDeleteOverride).toHaveBeenCalledWith("ov1");
  });
});

// ---------------------------------------------------------------------------
// ServiceAddOnsScreen
// ---------------------------------------------------------------------------

const defaultAddonsProps = {
  loading: false,
  error: null,
  addons: [],
  newName: "",
  newPrice: "",
  newDuration: "",
  submitting: false,
  formError: null,
  onNewNameChange: jest.fn(),
  onNewPriceChange: jest.fn(),
  onNewDurationChange: jest.fn(),
  onCreate: jest.fn(),
  onToggleActive: jest.fn(),
  onRetry: jest.fn(),
  onBack: jest.fn(),
};

describe("ServiceAddOnsScreen", () => {
  it("shows loading state", () => {
    const { getByText } = render(
      <ServiceAddOnsScreen {...defaultAddonsProps} loading={true} />,
    );
    expect(getByText(/loading add-ons/i)).toBeTruthy();
  });

  it("renders create form fields", () => {
    const { getByTestId } = render(
      <ServiceAddOnsScreen {...defaultAddonsProps} testID="saos" />,
    );
    expect(getByTestId("saos-new-name")).toBeTruthy();
    expect(getByTestId("saos-new-price")).toBeTruthy();
    expect(getByTestId("saos-new-duration")).toBeTruthy();
  });

  it("calls onCreate when create button pressed", () => {
    const onCreate = jest.fn();
    const { getByTestId } = render(
      <ServiceAddOnsScreen {...defaultAddonsProps} onCreate={onCreate} testID="saos" />,
    );
    fireEvent.press(getByTestId("saos-create-btn"));
    expect(onCreate).toHaveBeenCalled();
  });

  it("renders addon rows in list", () => {
    const addon = {
      addonId: "a1",
      tenantId: "t1",
      name: "Deep conditioning",
      price: 15,
      currency: "USD",
      durationMinutes: 20,
      active: true,
      createdAt: fakeTs,
      updatedAt: fakeTs,
    };
    const { getByTestId } = render(
      <ServiceAddOnsScreen {...defaultAddonsProps} addons={[addon]} testID="saos" />,
    );
    expect(getByTestId("saos-addon-a1")).toBeTruthy();
  });

  it("calls onToggleActive when switch toggled", () => {
    const onToggleActive = jest.fn();
    const addon = {
      addonId: "a1",
      tenantId: "t1",
      name: "Deep conditioning",
      price: 15,
      currency: "USD",
      durationMinutes: 20,
      active: true,
      createdAt: fakeTs,
      updatedAt: fakeTs,
    };
    const { getByTestId } = render(
      <ServiceAddOnsScreen
        {...defaultAddonsProps}
        addons={[addon]}
        onToggleActive={onToggleActive}
        testID="saos"
      />,
    );
    fireEvent(getByTestId("saos-toggle-a1"), "valueChange", false);
    expect(onToggleActive).toHaveBeenCalledWith("a1", false);
  });

  it("shows formError when present", () => {
    const { getByTestId } = render(
      <ServiceAddOnsScreen
        {...defaultAddonsProps}
        formError="Name is required"
        testID="saos"
      />,
    );
    expect(getByTestId("saos-form-error")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// ServiceSeasonalRulesScreen
// ---------------------------------------------------------------------------

const defaultSeasonalProps = {
  serviceName: "Haircut",
  loading: false,
  error: null,
  rules: [],
  newLabel: "",
  newStart: "",
  newEnd: "",
  submitting: false,
  formError: null,
  onNewLabelChange: jest.fn(),
  onNewStartChange: jest.fn(),
  onNewEndChange: jest.fn(),
  onCreate: jest.fn(),
  onDeleteRule: jest.fn(),
  onRetry: jest.fn(),
  onBack: jest.fn(),
};

describe("ServiceSeasonalRulesScreen", () => {
  it("shows loading state", () => {
    const { getByText } = render(
      <ServiceSeasonalRulesScreen {...defaultSeasonalProps} loading={true} />,
    );
    expect(getByText(/loading seasonal rules/i)).toBeTruthy();
  });

  it("renders create form with label and date inputs", () => {
    const { getByTestId } = render(
      <ServiceSeasonalRulesScreen {...defaultSeasonalProps} testID="ssrs" />,
    );
    expect(getByTestId("ssrs-new-label-input")).toBeTruthy();
    expect(getByTestId("ssrs-new-start-input")).toBeTruthy();
    expect(getByTestId("ssrs-new-end-input")).toBeTruthy();
  });

  it("calls onCreate when create button pressed", () => {
    const onCreate = jest.fn();
    const { getByTestId } = render(
      <ServiceSeasonalRulesScreen {...defaultSeasonalProps} onCreate={onCreate} testID="ssrs" />,
    );
    fireEvent.press(getByTestId("ssrs-create-btn"));
    expect(onCreate).toHaveBeenCalled();
  });

  it("renders rule rows", () => {
    const rule = {
      ruleId: "r1",
      serviceId: "s1",
      tenantId: "t1",
      label: "Holiday closure",
      startDate: "2026-12-24",
      endDate: "2026-12-26",
      blockedCompletely: true,
      createdAt: fakeTs,
      updatedAt: fakeTs,
    };
    const { getByTestId } = render(
      <ServiceSeasonalRulesScreen {...defaultSeasonalProps} rules={[rule]} testID="ssrs" />,
    );
    expect(getByTestId("ssrs-rule-r1")).toBeTruthy();
  });

  it("calls onDeleteRule when remove pressed", () => {
    const onDeleteRule = jest.fn();
    const rule = {
      ruleId: "r1",
      serviceId: "s1",
      tenantId: "t1",
      label: "Holiday closure",
      startDate: "2026-12-24",
      endDate: "2026-12-26",
      blockedCompletely: false,
      createdAt: fakeTs,
      updatedAt: fakeTs,
    };
    const { getByTestId } = render(
      <ServiceSeasonalRulesScreen
        {...defaultSeasonalProps}
        rules={[rule]}
        onDeleteRule={onDeleteRule}
        testID="ssrs"
      />,
    );
    fireEvent.press(getByTestId("ssrs-delete-rule-r1"));
    expect(onDeleteRule).toHaveBeenCalledWith("r1");
  });
});

// ---------------------------------------------------------------------------
// ServicePhotosScreen
// ---------------------------------------------------------------------------

const defaultPhotosProps = {
  serviceName: "Haircut",
  loading: false,
  error: null,
  mediaUrls: [],
  uploading: false,
  uploadError: null,
  onUpload: jest.fn(),
  onRemovePhoto: jest.fn(),
  onRetry: jest.fn(),
  onBack: jest.fn(),
};

describe("ServicePhotosScreen", () => {
  it("shows loading state", () => {
    const { getByText } = render(
      <ServicePhotosScreen {...defaultPhotosProps} loading={true} />,
    );
    expect(getByText(/loading photos/i)).toBeTruthy();
  });

  it("renders upload button", () => {
    const { getByTestId } = render(
      <ServicePhotosScreen {...defaultPhotosProps} testID="sphs" />,
    );
    expect(getByTestId("sphs-upload-btn")).toBeTruthy();
  });

  it("calls onUpload when upload button pressed", () => {
    const onUpload = jest.fn();
    const { getByTestId } = render(
      <ServicePhotosScreen {...defaultPhotosProps} onUpload={onUpload} testID="sphs" />,
    );
    fireEvent.press(getByTestId("sphs-upload-btn"));
    expect(onUpload).toHaveBeenCalled();
  });

  it("shows upload error when present", () => {
    const { getByTestId } = render(
      <ServicePhotosScreen
        {...defaultPhotosProps}
        uploadError="Upload failed"
        testID="sphs"
      />,
    );
    expect(getByTestId("sphs-upload-error")).toBeTruthy();
  });

  it("renders photo grid with remove buttons when mediaUrls present", () => {
    const { getByTestId } = render(
      <ServicePhotosScreen
        {...defaultPhotosProps}
        mediaUrls={["https://example.com/photo1.jpg"]}
        testID="sphs"
      />,
    );
    expect(getByTestId("sphs-photos-grid")).toBeTruthy();
    expect(getByTestId("sphs-photo-0")).toBeTruthy();
    expect(getByTestId("sphs-remove-photo-0")).toBeTruthy();
  });

  it("calls onRemovePhoto with correct index", () => {
    const onRemovePhoto = jest.fn();
    const { getByTestId } = render(
      <ServicePhotosScreen
        {...defaultPhotosProps}
        mediaUrls={["https://example.com/photo1.jpg", "https://example.com/photo2.jpg"]}
        onRemovePhoto={onRemovePhoto}
        testID="sphs"
      />,
    );
    fireEvent.press(getByTestId("sphs-remove-photo-1"));
    expect(onRemovePhoto).toHaveBeenCalledWith(1);
  });
});

// ---------------------------------------------------------------------------
// ServiceBookingRulesScreen
// ---------------------------------------------------------------------------

const defaultBookingRulesProps = {
  serviceName: "Haircut",
  loading: false,
  error: null,
  rules: null,
  depositPercent: "",
  cancellationWindowHours: "",
  leadTimeHours: "",
  bufferMinutes: "",
  submitting: false,
  submitError: null,
  submitSuccess: null,
  onDepositChange: jest.fn(),
  onCancellationWindowChange: jest.fn(),
  onLeadTimeChange: jest.fn(),
  onBufferChange: jest.fn(),
  onSave: jest.fn(),
  onRetry: jest.fn(),
  onBack: jest.fn(),
};

describe("ServiceBookingRulesScreen", () => {
  it("shows loading state", () => {
    const { getByText } = render(
      <ServiceBookingRulesScreen {...defaultBookingRulesProps} loading={true} />,
    );
    expect(getByText(/loading booking rules/i)).toBeTruthy();
  });

  it("shows error state", () => {
    const { getByText } = render(
      <ServiceBookingRulesScreen {...defaultBookingRulesProps} error="Load failed" />,
    );
    expect(getByText(/Load failed/)).toBeTruthy();
  });

  it("renders all 4 input fields", () => {
    const { getByTestId } = render(
      <ServiceBookingRulesScreen {...defaultBookingRulesProps} testID="sbrs" />,
    );
    expect(getByTestId("sbrs-deposit-input")).toBeTruthy();
    expect(getByTestId("sbrs-cancellation-window-input")).toBeTruthy();
    expect(getByTestId("sbrs-lead-time-input")).toBeTruthy();
    expect(getByTestId("sbrs-buffer-input")).toBeTruthy();
  });

  it("calls onSave when save rules pressed", () => {
    const onSave = jest.fn();
    const { getByTestId } = render(
      <ServiceBookingRulesScreen
        {...defaultBookingRulesProps}
        onSave={onSave}
        testID="sbrs"
      />,
    );
    fireEvent.press(getByTestId("sbrs-save-rules-btn"));
    expect(onSave).toHaveBeenCalled();
  });

  it("shows submitError when present", () => {
    const { getByTestId } = render(
      <ServiceBookingRulesScreen
        {...defaultBookingRulesProps}
        submitError="Save failed"
        testID="sbrs"
      />,
    );
    expect(getByTestId("sbrs-submit-error")).toBeTruthy();
  });

  it("shows submitSuccess when present", () => {
    const { getByTestId } = render(
      <ServiceBookingRulesScreen
        {...defaultBookingRulesProps}
        submitSuccess="Rules saved"
        testID="sbrs"
      />,
    );
    expect(getByTestId("sbrs-submit-success")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// ServiceVisibilityScreen
// ---------------------------------------------------------------------------

const defaultVisibilityProps = {
  serviceName: "Haircut",
  onlineBooking: true,
  marketplaceListed: true,
  internalOnly: false,
  submitting: false,
  submitError: null,
  submitSuccess: null,
  onOnlineBookingChange: jest.fn(),
  onMarketplaceListedChange: jest.fn(),
  onInternalOnlyChange: jest.fn(),
  onSave: jest.fn(),
  onBack: jest.fn(),
};

describe("ServiceVisibilityScreen", () => {
  it("renders screen root", () => {
    const { getByTestId } = render(
      <ServiceVisibilityScreen {...defaultVisibilityProps} testID="svs" />,
    );
    expect(getByTestId("svs")).toBeTruthy();
  });

  it("renders all 3 toggle labels", () => {
    const { getByText } = render(
      <ServiceVisibilityScreen {...defaultVisibilityProps} testID="svs" />,
    );
    expect(getByText("Online booking")).toBeTruthy();
    expect(getByText("Marketplace listed")).toBeTruthy();
    expect(getByText("Internal only")).toBeTruthy();
  });

  it("shows internalOnly warning when internalOnly is true", () => {
    const { getByText } = render(
      <ServiceVisibilityScreen
        {...defaultVisibilityProps}
        internalOnly={true}
        testID="svs"
      />,
    );
    expect(getByText(/internal only is ON/i)).toBeTruthy();
  });

  it("does not show internalOnly warning when internalOnly is false", () => {
    const { queryByText } = render(
      <ServiceVisibilityScreen
        {...defaultVisibilityProps}
        internalOnly={false}
        testID="svs"
      />,
    );
    expect(queryByText(/internal only is ON/i)).toBeNull();
  });

  it("calls onSave when save visibility pressed", () => {
    const onSave = jest.fn();
    const { getByTestId } = render(
      <ServiceVisibilityScreen
        {...defaultVisibilityProps}
        onSave={onSave}
        testID="svs"
      />,
    );
    fireEvent.press(getByTestId("svs-save-visibility-btn"));
    expect(onSave).toHaveBeenCalled();
  });

  it("shows submitSuccess when present", () => {
    const { getByTestId } = render(
      <ServiceVisibilityScreen
        {...defaultVisibilityProps}
        submitSuccess="Saved"
        testID="svs"
      />,
    );
    expect(getByTestId("svs-submit-success")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// routes.ts — 8 W42 routes
// ---------------------------------------------------------------------------

const routeNames = ROUTES.map((r) => r.name);
const routeByName = (name: string) => ROUTES.find((r) => r.name === name);

describe("routes.ts — W42 service catalog routes", () => {
  it("has ServiceCategories route", () => {
    expect(routeNames).toContain("ServiceCategories");
  });
  it("ServiceCategories has correct path and group", () => {
    const r = routeByName("ServiceCategories");
    expect(r?.path).toBe("/owner/service/categories");
    expect(r?.group).toBe("owner");
    expect(r?.guard).toBe("authenticated");
  });

  it("has ServiceBulkImport route", () => {
    expect(routeNames).toContain("ServiceBulkImport");
  });
  it("ServiceBulkImport has correct path", () => {
    expect(routeByName("ServiceBulkImport")?.path).toBe("/owner/service/import");
  });

  it("has ServicePricing route", () => {
    expect(routeNames).toContain("ServicePricing");
  });
  it("ServicePricing has correct path", () => {
    expect(routeByName("ServicePricing")?.path).toBe("/owner/service/pricing");
  });

  it("has ServiceAddOns route", () => {
    expect(routeNames).toContain("ServiceAddOns");
  });
  it("ServiceAddOns has correct path", () => {
    expect(routeByName("ServiceAddOns")?.path).toBe("/owner/service/addons");
  });

  it("has ServiceSeasonalRules route", () => {
    expect(routeNames).toContain("ServiceSeasonalRules");
  });
  it("ServiceSeasonalRules has correct path", () => {
    expect(routeByName("ServiceSeasonalRules")?.path).toBe("/owner/service/seasonal");
  });

  it("has ServicePhotos route", () => {
    expect(routeNames).toContain("ServicePhotos");
  });
  it("ServicePhotos has correct path", () => {
    expect(routeByName("ServicePhotos")?.path).toBe("/owner/service/photos");
  });

  it("has ServiceBookingRules route", () => {
    expect(routeNames).toContain("ServiceBookingRules");
  });
  it("ServiceBookingRules has correct path", () => {
    expect(routeByName("ServiceBookingRules")?.path).toBe("/owner/service/booking-rules");
  });

  it("has ServiceVisibility route", () => {
    expect(routeNames).toContain("ServiceVisibility");
  });
  it("ServiceVisibility has correct path", () => {
    expect(routeByName("ServiceVisibility")?.path).toBe("/owner/service/visibility");
  });
});
