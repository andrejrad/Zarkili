import { createOnboardingDraftService } from "../onboardingDraftService";
import { CURRENT_ONBOARDING_DRAFT_SCHEMA_VERSION } from "../onboardingDraftContracts";

describe("OnboardingDraftService", () => {
  it("validates and saves draft through repository", async () => {
    const repository = {
      saveDraft: jest.fn(async (input) => ({
        draftId: "tenantA_userA_client",
        tenantId: input.tenantId,
        userId: input.userId,
        flowType: input.flowType,
        schemaVersion: 1,
        status: "draft",
        currentStep: input.currentStep,
        payload: input.payload,
        createdAt: null,
        updatedAt: null,
      })),
      resumeDraft: jest.fn(),
      discardDraft: jest.fn(),
      listUserDrafts: jest.fn(),
    };

    const service = createOnboardingDraftService(repository as never);

    const draft = await service.saveValidatedDraft({
      tenantId: "tenantA",
      userId: "userA",
      flowType: "client",
      currentStep: "profile",
      payload: { firstName: "Ana" },
    });

    expect(repository.saveDraft).toHaveBeenCalledTimes(1);
    expect(draft.currentStep).toBe("profile");
    expect(draft.schemaVersion).toBe(CURRENT_ONBOARDING_DRAFT_SCHEMA_VERSION);
  });

  it("rejects invalid draft payload before save", async () => {
    const repository = {
      saveDraft: jest.fn(),
      resumeDraft: jest.fn(),
      discardDraft: jest.fn(),
      listUserDrafts: jest.fn(),
    };

    const service = createOnboardingDraftService(repository as never);

    await expect(
      service.saveValidatedDraft({
        tenantId: "tenantA",
        userId: "userA",
        flowType: "client",
        currentStep: "profile",
        payload: { nickname: "Ana" },
      })
    ).rejects.toThrow("Payload is invalid");
    expect(repository.saveDraft).not.toHaveBeenCalled();
  });

  it("migrates resumed legacy draft to current schema version", async () => {
    const repository = {
      saveDraft: jest.fn(),
      resumeDraft: jest.fn(async () => ({
        draftId: "tenantA_userA_client",
        tenantId: "tenantA",
        userId: "userA",
        flowType: "client",
        schemaVersion: 0,
        status: "draft",
        currentStep: "profile",
        payload: { firstName: "Ana" },
        createdAt: null,
        updatedAt: null,
      })),
      discardDraft: jest.fn(),
      listUserDrafts: jest.fn(),
    };

    const service = createOnboardingDraftService(repository as never);

    const draft = await service.resumeValidatedDraft("tenantA", "userA", "client");

    expect(draft?.schemaVersion).toBe(CURRENT_ONBOARDING_DRAFT_SCHEMA_VERSION);
    expect(draft?.payload.fullName).toBe("Ana");
  });

  it("delegates discard to repository", async () => {
    const repository = {
      saveDraft: jest.fn(),
      resumeDraft: jest.fn(),
      discardDraft: jest.fn(async () => undefined),
      listUserDrafts: jest.fn(),
    };

    const service = createOnboardingDraftService(repository as never);

    await service.discardDraft("tenantA", "userA", "client");
    expect(repository.discardDraft).toHaveBeenCalledWith("tenantA", "userA", "client");
  });
});
