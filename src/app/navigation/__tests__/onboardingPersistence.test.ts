import { createOnboardingProgressPersistence } from "../onboarding/persistence";

describe("onboarding persistence adapter", () => {
  it("maps client account-guest step to account when saving draft", async () => {
    const service = {
      saveValidatedDraft: jest.fn(async () => ({
        draftId: "tenantA_userA_client",
      })),
      resumeValidatedDraft: jest.fn(),
      discardDraft: jest.fn(),
    };

    const persistence = createOnboardingProgressPersistence(service as never);

    await persistence.saveDraft({
      tenantId: "tenantA",
      userId: "userA",
      flow: "client",
      currentStep: "account-guest",
      completedSteps: ["account-guest"],
    });

    expect(service.saveValidatedDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        flowType: "client",
        currentStep: "account",
        payload: {
          completedSteps: ["account"],
        },
      })
    );
  });

  it("maps resumed account step back to account-guest for client flow", async () => {
    const service = {
      saveValidatedDraft: jest.fn(),
      resumeValidatedDraft: jest.fn(async () => ({
        draftId: "tenantA_userA_client",
        tenantId: "tenantA",
        userId: "userA",
        flowType: "client",
        schemaVersion: 2,
        status: "draft",
        currentStep: "account",
        payload: {
          completedSteps: ["account", "phone-verify"],
        },
        createdAt: new Date("2026-04-19T10:00:00.000Z"),
        updatedAt: new Date("2026-04-19T12:00:00.000Z"),
      })),
      discardDraft: jest.fn(),
    };

    const persistence = createOnboardingProgressPersistence(service as never);

    const state = await persistence.resumeDraft({
      tenantId: "tenantA",
      userId: "userA",
      flow: "client",
    });

    expect(state?.currentStep).toBe("account-guest");
    expect(state?.completedSteps).toEqual(["account-guest", "phone-verify"]);
    expect(state?.status).toBe("in_progress");
  });

  it("returns null when no draft exists", async () => {
    const service = {
      saveValidatedDraft: jest.fn(),
      resumeValidatedDraft: jest.fn(async () => null),
      discardDraft: jest.fn(),
    };

    const persistence = createOnboardingProgressPersistence(service as never);

    await expect(
      persistence.resumeDraft({
        tenantId: "tenantA",
        userId: "userA",
        flow: "salon",
      })
    ).resolves.toBeNull();
  });
});
