import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import { AppProviders } from "../../providers/AppProviders";
import { AppNavigatorShell } from "../AppNavigatorShell";
import type { OnboardingProgressPersistence } from "../onboarding/contracts";
import type { OnboardingStep } from "../onboarding/contracts";
import type { TenantMembership } from "../../../domains/auth";

jest.mock("../onboarding/createPersistence", () => ({
  createFirestoreOnboardingProgressPersistence: () => ({
    saveDraft: async () => undefined,
    resumeDraft: async () => null,
  }),
}));

jest.mock("../tenantMemberships", () => ({
  listActiveTenantMembershipsForUser: async () => [],
}));

describe("AppNavigatorShell", () => {
  const defaultMemberships: TenantMembership[] = [
    {
      membershipId: "tenantA_dev-user",
      tenantId: "tenantA",
      userId: "dev-user",
      role: "tenant_admin",
      status: "active",
    },
  ];

  it("shows coming soon on discover when marketplace flag is disabled", () => {
    render(
      <AppProviders>
        <AppNavigatorShell listTenantMemberships={async () => defaultMemberships} />
      </AppProviders>
    );

    fireEvent.press(screen.getByText("Discover businesses"));

    expect(screen.getByText("Coming soon. Marketplace is currently disabled by feature flag.")).toBeTruthy();
  });

  it("moves to app shell after dev sign-in", async () => {
    render(
      <AppProviders>
        <AppNavigatorShell listTenantMemberships={async () => defaultMemberships} />
      </AppProviders>
    );

    fireEvent.press(screen.getByText("Login"));
    fireEvent.press(screen.getByText("Sign in as dev user"));

    await waitFor(() => {
      expect(screen.getByText("Tenant context: tenantA")).toBeTruthy();
    });

    expect(screen.getByText("Current route: AppShell")).toBeTruthy();
    expect(screen.getByText("Protected area placeholder for authenticated users.")).toBeTruthy();
  });

  it("resumes saved onboarding step on flow entry", async () => {
    const persistence: OnboardingProgressPersistence = {
      saveDraft: jest.fn(async () => undefined),
      resumeDraft: jest.fn(async () => ({
        tenantId: "tenant-dev",
        userId: "user_dev",
        flow: "client" as const,
        currentStep: "profile" as const,
        completedSteps: ["account-guest", "phone-verify"] as OnboardingStep[],
        status: "in_progress" as const,
        updatedAt: new Date("2026-04-19T12:00:00.000Z"),
      })),
    };

    render(
      <AppProviders>
        <AppNavigatorShell
          onboardingProgressPersistence={persistence}
          listTenantMemberships={async () => defaultMemberships}
        />
      </AppProviders>
    );

    fireEvent.press(screen.getByText("Login"));
    fireEvent.press(screen.getByText("Sign in as dev user"));
    await waitFor(() => {
      expect(screen.getByText("Tenant context: tenantA")).toBeTruthy();
    });
    fireEvent.press(screen.getByText("Start client onboarding"));

    expect(await screen.findByText("Placeholder step: Profile")).toBeTruthy();
    expect(persistence.resumeDraft).toHaveBeenCalled();
  });

  it("saves onboarding draft when moving to next step", async () => {
    const persistence: OnboardingProgressPersistence = {
      saveDraft: jest.fn(async () => undefined),
      resumeDraft: jest.fn(async () => null),
    };

    render(
      <AppProviders>
        <AppNavigatorShell
          onboardingProgressPersistence={persistence}
          listTenantMemberships={async () => defaultMemberships}
        />
      </AppProviders>
    );

    fireEvent.press(screen.getByText("Login"));
    fireEvent.press(screen.getByText("Sign in as dev user"));
    await waitFor(() => {
      expect(screen.getByText("Tenant context: tenantA")).toBeTruthy();
    });
    fireEvent.press(screen.getByText("Start salon onboarding"));
    fireEvent.press(await screen.findByText("Next step"));

    await waitFor(() => {
      expect(persistence.saveDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          flow: "salon",
          currentStep: "business-profile",
        })
      );
    });
  });

  it("blocks onboarding start without tenant context", async () => {
    const persistence: OnboardingProgressPersistence = {
      saveDraft: jest.fn(async () => undefined),
      resumeDraft: jest.fn(async () => null),
    };

    render(
      <AppProviders>
        <AppNavigatorShell
          onboardingProgressPersistence={persistence}
          listTenantMemberships={async () => []}
        />
      </AppProviders>
    );

    fireEvent.press(screen.getByText("Login"));
    fireEvent.press(screen.getByText("Sign in as dev user"));
    await screen.findByText("No active memberships available.");
    fireEvent.press(screen.getByText("Start client onboarding"));

    expect(await screen.findByText("No active tenant memberships found for this user.")).toBeTruthy();
    expect(screen.getByText("Current route: AppShell")).toBeTruthy();
    expect(persistence.resumeDraft).not.toHaveBeenCalled();
  });

  it("allows selecting tenant from multiple memberships", async () => {
    const persistence: OnboardingProgressPersistence = {
      saveDraft: jest.fn(async () => undefined),
      resumeDraft: jest.fn(async () => null),
    };

    const memberships: TenantMembership[] = [
      {
        membershipId: "tenantA_dev-user",
        tenantId: "tenantA",
        userId: "dev-user",
        role: "tenant_admin",
        status: "active",
      },
      {
        membershipId: "tenantB_dev-user",
        tenantId: "tenantB",
        userId: "dev-user",
        role: "tenant_admin",
        status: "active",
      },
    ];

    render(
      <AppProviders>
        <AppNavigatorShell
          onboardingProgressPersistence={persistence}
          listTenantMemberships={async () => memberships}
        />
      </AppProviders>
    );

    fireEvent.press(screen.getByText("Login"));
    fireEvent.press(screen.getByText("Sign in as dev user"));
    fireEvent.press(await screen.findByText("Select tenant tenantB"));
    fireEvent.press(screen.getByText("Start client onboarding"));

    await waitFor(() => {
      expect(persistence.resumeDraft).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: "tenantB" })
      );
    });
  });
});
