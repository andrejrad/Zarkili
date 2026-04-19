import {
  CURRENT_ONBOARDING_DRAFT_SCHEMA_VERSION,
  getFlowSteps,
  migrateOnboardingDraftToCurrentVersion,
  validateOnboardingDraftInput,
} from "../onboardingDraftContracts";

describe("onboardingDraftContracts", () => {
  it("validates valid salon business-profile payload", () => {
    expect(() =>
      validateOnboardingDraftInput({
        tenantId: "tenantA",
        userId: "userA",
        flowType: "salon",
        currentStep: "business-profile",
        payload: { businessName: "Luna" },
      })
    ).not.toThrow();
  });

  it("rejects invalid step for flow", () => {
    expect(() =>
      validateOnboardingDraftInput({
        tenantId: "tenantA",
        userId: "userA",
        flowType: "client",
        currentStep: "business-profile",
        payload: { businessName: "Luna" },
      })
    ).toThrow("not valid for flow");
  });

  it("rejects payload that does not satisfy step contract", () => {
    expect(() =>
      validateOnboardingDraftInput({
        tenantId: "tenantA",
        userId: "userA",
        flowType: "client",
        currentStep: "profile",
        payload: { nickname: "Luna" },
      })
    ).toThrow("Payload is invalid");
  });

  it("migrates missing schemaVersion to current", () => {
    const migrated = migrateOnboardingDraftToCurrentVersion({
      draftId: "d1",
      tenantId: "tenantA",
      userId: "userA",
      flowType: "client",
      schemaVersion: 0,
      status: "draft",
      currentStep: "profile",
      payload: { firstName: "Ana" },
      createdAt: null,
      updatedAt: null,
    });

    expect(migrated.schemaVersion).toBe(CURRENT_ONBOARDING_DRAFT_SCHEMA_VERSION);
    expect(migrated.payload.fullName).toBe("Ana");
  });

  it("migrates business-profile payload from v1 to v2", () => {
    const migrated = migrateOnboardingDraftToCurrentVersion({
      draftId: "d2",
      tenantId: "tenantA",
      userId: "userA",
      flowType: "salon",
      schemaVersion: 1,
      status: "draft",
      currentStep: "business-profile",
      payload: { businessName: "Luna Nails" },
      createdAt: null,
      updatedAt: null,
    });

    expect(migrated.schemaVersion).toBe(CURRENT_ONBOARDING_DRAFT_SCHEMA_VERSION);
    expect(migrated.payload.displayName).toBe("Luna Nails");
  });

  it("rejects future schema versions", () => {
    expect(() =>
      migrateOnboardingDraftToCurrentVersion({
        draftId: "d1",
        tenantId: "tenantA",
        userId: "userA",
        flowType: "client",
        schemaVersion: CURRENT_ONBOARDING_DRAFT_SCHEMA_VERSION + 1,
        status: "draft",
        currentStep: "profile",
        payload: { firstName: "Ana" },
        createdAt: null,
        updatedAt: null,
      })
    ).toThrow("Unsupported onboarding draft schema version");
  });

  it("returns known steps for each flow", () => {
    expect(getFlowSteps("salon")).toContain("business-profile");
    expect(getFlowSteps("client")).toContain("profile");
  });
});
