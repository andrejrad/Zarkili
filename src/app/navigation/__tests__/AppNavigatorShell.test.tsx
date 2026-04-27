import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import { AppProviders } from "../../providers/AppProviders";
import { AppNavigatorShell } from "../AppNavigatorShell";
import type { OnboardingProgressPersistence } from "../onboarding/contracts";
import type { OnboardingStep } from "../onboarding/contracts";
import type { DiscoveryService } from "../../../domains";
import type { AuthRepository, TenantMembership } from "../../../domains/auth";
import type { AiBudgetAdminService } from "../../../domains/ai";
import type { TenantLocationAdminService } from "../../admin/tenantLocationAdminService";
import type { StaffAdminService } from "../../admin/staffAdminService";
import type { ServiceAdminService } from "../../admin/serviceAdminService";
import type { UnreadAggregationService } from "../../dashboard/unreadAggregationService";
import { featureFlags } from "../../../shared/config/featureFlags";

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
  const suspendedDiscoveryService: DiscoveryService = {
    getHomeFeed: () => new Promise<never>(() => {}),
    getExploreFeed: () => new Promise<never>(() => {}),
  };

  function createDiscoveryServiceStub(overrides: Partial<DiscoveryService> = {}): DiscoveryService {
    return {
      getHomeFeed: async () => ({
        categories: [{ id: "all" }, { id: "nails" }, { id: "massage" }],
        featuredSalons: [
          {
            id: "salon-a",
            tenantId: "tenant-a",
            name: "Luna Studio",
            city: "Rijeka",
            categories: ["nails"],
            rating: 4.8,
            reviewCount: 122,
            priceFrom: 35,
            currency: "EUR",
            nextAvailableLabel: "Today",
            featuredService: "Gel manicure",
            member: true,
            bookingEnabled: true,
            messageEnabled: true,
          },
        ],
        recentBookings: [],
      }),
      getExploreFeed: async () => ({
        categories: [{ id: "all" }, { id: "nails" }, { id: "massage" }],
        salons: [
          {
            id: "salon-a",
            tenantId: "tenant-a",
            name: "Luna Studio",
            city: "Rijeka",
            categories: ["nails"],
            rating: 4.8,
            reviewCount: 122,
            priceFrom: 35,
            currency: "EUR",
            nextAvailableLabel: "Today",
            featuredService: "Gel manicure",
            member: true,
            bookingEnabled: true,
            messageEnabled: true,
          },
          {
            id: "salon-b",
            tenantId: "tenant-b",
            name: "Atelier Glow",
            city: "Zagreb",
            categories: ["massage"],
            rating: 4.5,
            reviewCount: 89,
            priceFrom: 40,
            currency: "EUR",
            nextAvailableLabel: "Tomorrow",
            featuredService: "Relax massage",
            member: false,
            bookingEnabled: false,
            messageEnabled: true,
          },
        ],
      }),
      ...overrides,
    };
  }

  function createAuthRepositoryStub(overrides: Partial<AuthRepository> = {}): AuthRepository {
    return {
      getCurrentSession: () => new Promise<never>(() => {}),
      signIn: async () => ({
        userId: "member-user",
        email: "member@example.com",
        firstName: "Member",
        lastName: "User",
      }),
      createAccount: async () => ({
        userId: "new-user",
        email: "new-user@example.com",
        firstName: null,
        lastName: null,
      }),
      updateProfile: async (_userId, input) => ({
        userId: "new-user",
        email: "new-user@example.com",
        firstName: input.firstName,
        lastName: input.lastName,
      }),
      updateEmailAddress: async (_userId, input) => ({
        userId: "new-user",
        email: input.email,
        firstName: "Member",
        lastName: "User",
      }),
      sendPasswordReset: async () => undefined,
      signOutCurrentUser: async () => undefined,
      listUserTenantMemberships: async () => [],
      ...overrides,
    };
  }

  function createTenantLocationAdminServiceStub(
    overrides: Partial<TenantLocationAdminService> = {}
  ): TenantLocationAdminService {
    return {
      readTenantProfile: async () => ({
        ok: true,
        data: {
          tenantId: "tenantA",
          name: "Tenant Alpha",
          slug: "tenant-alpha",
          status: "active",
          plan: "starter",
          country: "HR",
          timezone: "Europe/Zagreb",
          defaultLanguage: "hr",
          defaultCurrency: "EUR",
          brandingPrimary: "#111111",
          brandingSecondary: "#eeeeee",
          allowGuestBooking: true,
          requireDeposit: false,
        },
      }),
      readTenantLocations: async () => ({
        ok: true,
        data: [],
      }),
      createLocationForTenant: async () => ({
        ok: true,
        data: {
          locationId: "loc-created",
          tenantId: "tenantA",
          name: "Downtown Studio",
          code: "DOWNTOWN",
          status: "active",
          timezone: "Europe/Zagreb",
          phone: null,
          email: null,
          address: {
            line1: "",
            city: "Zagreb",
            country: "HR",
            postalCode: "",
          },
          operatingHours: {},
          createdAt: {} as never,
          updatedAt: {} as never,
        },
      }),
      ...overrides,
    };
  }

  function createStaffAdminServiceStub(
    overrides: Partial<StaffAdminService> = {}
  ): StaffAdminService {
    return {
      readStaffList: async () => ({ ok: true, data: [] }),
      createStaffForTenant: async () => ({
        ok: true,
        data: {
          staffId: "staff-created",
          tenantId: "tenantA",
          userId: "dev-user",
          displayName: "Jane Smith",
          role: "technician" as const,
          status: "active" as const,
          locationIds: [],
          serviceIds: [],
          skills: [],
          constraints: [],
          createdAt: {} as never,
          updatedAt: {} as never,
        },
      }),
      updateStaffMember: async () => ({ ok: true, data: undefined }),
      deactivateStaffMember: async () => ({ ok: true, data: undefined }),
      ...overrides,
    };
  }

  function createServiceAdminServiceStub(
    overrides: Partial<ServiceAdminService> = {}
  ): ServiceAdminService {
    return {
      readServicesList: async () => ({ ok: true, data: [] }),
      createServiceForTenant: async () => ({
        ok: true,
        data: {
          serviceId: "svc-created",
          tenantId: "tenantA",
          locationIds: [],
          name: "Haircut",
          category: "hair",
          durationMinutes: 60,
          bufferMinutes: 0,
          price: 50,
          currency: "EUR",
          active: true,
          sortOrder: 0,
          createdAt: {} as never,
          updatedAt: {} as never,
        },
      }),
      updateService: async () => ({ ok: true, data: undefined }),
      archiveService: async () => ({ ok: true, data: undefined }),
      ...overrides,
    };
  }

  const defaultMemberships: TenantMembership[] = [
    {
      membershipId: "tenantA_dev-user",
      tenantId: "tenantA",
      userId: "dev-user",
      role: "tenant_admin",
      status: "active",
    },
  ];

  afterEach(() => {
    (featureFlags as { marketplaceEnabled: boolean }).marketplaceEnabled = false;
  });

  it("shows coming soon on discover when marketplace flag is disabled", () => {
    render(
      <AppProviders>
        <AppNavigatorShell
          discoveryService={suspendedDiscoveryService}
          listTenantMemberships={async () => defaultMemberships}
        />
      </AppProviders>
    );

    fireEvent.press(screen.getByText("Discover businesses"));

    expect(screen.getByText("Coming soon. Marketplace is currently disabled by feature flag.")).toBeTruthy();
  });

  it("moves to app shell after dev sign-in", async () => {
    render(
      <AppProviders>
        <AppNavigatorShell
          discoveryService={suspendedDiscoveryService}
          listTenantMemberships={async () => defaultMemberships}
        />
      </AppProviders>
    );

    fireEvent.press(screen.getByText("Already have an account? Sign In"));
    fireEvent.press(screen.getByText("Sign in as dev user"));

    await waitFor(() => {
      expect(screen.getByText("Tenant context: tenantA")).toBeTruthy();
    });

    expect(screen.getByText("Current route: AppShell")).toBeTruthy();
    expect(screen.getByText("Protected area placeholder for authenticated users.")).toBeTruthy();
  });

  it("submits login through the injected auth repository and enters the app shell", async () => {
    const authRepository = createAuthRepositoryStub({
      signIn: jest.fn(async (input) => ({
        userId: "member-user",
        email: input.email,
        firstName: "Member",
        lastName: "User",
      })),
    });

    render(
      <AppProviders authRepository={authRepository}>
        <AppNavigatorShell
          discoveryService={suspendedDiscoveryService}
          listTenantMemberships={async (userId) =>
            userId === "member-user"
              ? [
                  {
                    membershipId: "tenantA_member-user",
                    tenantId: "tenantA",
                    userId,
                    role: "tenant_admin",
                    status: "active",
                  },
                ]
              : []
          }
        />
      </AppProviders>
    );

    fireEvent.press(screen.getByText("Already have an account? Sign In"));
    fireEvent.changeText(screen.getByPlaceholderText("name@example.com"), "member@example.com");
    fireEvent.changeText(screen.getByPlaceholderText("••••••••"), "strong-password");
    fireEvent.press(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(authRepository.signIn).toHaveBeenCalledWith({
        email: "member@example.com",
        password: "strong-password",
      });
      expect(screen.getByText("Tenant context: tenantA")).toBeTruthy();
    });

    expect(screen.getByText("Current route: AppShell")).toBeTruthy();
  });

  it("submits registration, completes profile, and enters the app shell", async () => {
    const authRepository = createAuthRepositoryStub({
      createAccount: jest.fn(async (input) => ({
        userId: "new-user",
        email: input.email,
        firstName: null,
        lastName: null,
      })),
      updateProfile: jest.fn(async (_userId, input) => ({
        userId: "new-user",
        email: "new-user@example.com",
        firstName: input.firstName,
        lastName: input.lastName,
      })),
    });

    render(
      <AppProviders authRepository={authRepository}>
        <AppNavigatorShell
          discoveryService={suspendedDiscoveryService}
          listTenantMemberships={async (userId) =>
            userId === "new-user"
              ? [
                  {
                    membershipId: "tenantA_new-user",
                    tenantId: "tenantA",
                    userId,
                    role: "tenant_admin",
                    status: "active",
                  },
                ]
              : []
          }
        />
      </AppProviders>
    );

    fireEvent.press(screen.getByText("Get Started"));
    fireEvent.changeText(screen.getByPlaceholderText("name@example.com"), "new-user@example.com");
    fireEvent.changeText(screen.getByPlaceholderText("••••••••"), "strong-password");
    fireEvent.press(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => {
      expect(screen.getByText("Complete your profile")).toBeTruthy();
    });

    fireEvent.changeText(screen.getByPlaceholderText("Ana"), "Ana");
    fireEvent.changeText(screen.getByPlaceholderText("Novak"), "Novak");
    fireEvent.press(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => {
      expect(authRepository.createAccount).toHaveBeenCalledWith({
        email: "new-user@example.com",
        password: "strong-password",
      });
      expect(authRepository.updateProfile).toHaveBeenCalledWith("new-user", {
        firstName: "Ana",
        lastName: "Novak",
      });
      expect(screen.getByText("Tenant context: tenantA")).toBeTruthy();
    });

    expect(screen.getByText("Current route: AppShell")).toBeTruthy();
  });

  it("saves profile changes from the profile tab", async () => {
    const authRepository = createAuthRepositoryStub({
      signIn: jest.fn(async (input) => ({
        userId: "member-user",
        email: input.email,
        firstName: "Member",
        lastName: "User",
      })),
      updateProfile: jest.fn(async (_userId, input) => ({
        userId: "member-user",
        email: "member@example.com",
        firstName: input.firstName,
        lastName: input.lastName,
      })),
      updateEmailAddress: jest.fn(async (_userId, input) => ({
        userId: "member-user",
        email: input.email,
        firstName: "Petra",
        lastName: "Horvat",
      })),
      sendPasswordReset: jest.fn(async () => undefined),
    });

    render(
      <AppProviders authRepository={authRepository}>
        <AppNavigatorShell
          discoveryService={suspendedDiscoveryService}
          listTenantMemberships={async (userId) =>
            userId === "member-user"
              ? [
                  {
                    membershipId: "tenantA_member-user",
                    tenantId: "tenantA",
                    userId,
                    role: "tenant_admin",
                    status: "active",
                  },
                ]
              : []
          }
        />
      </AppProviders>
    );

    fireEvent.press(screen.getByText("Already have an account? Sign In"));
    fireEvent.changeText(screen.getByPlaceholderText("name@example.com"), "member@example.com");
    fireEvent.changeText(screen.getByPlaceholderText("••••••••"), "strong-password");
    fireEvent.press(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(screen.getByText("Tenant context: tenantA")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Profile"));
    fireEvent.changeText(screen.getByPlaceholderText("Ana"), "Petra");
    fireEvent.changeText(screen.getByPlaceholderText("Novak"), "Horvat");
    fireEvent.press(screen.getByRole("button", { name: "Save profile" }));

    await waitFor(() => {
      expect(authRepository.updateProfile).toHaveBeenCalledWith("member-user", {
        firstName: "Petra",
        lastName: "Horvat",
      });
      expect(screen.getByText("Profile saved.")).toBeTruthy();
    });

    fireEvent.changeText(screen.getByPlaceholderText("name@example.com"), "petra@example.com");
    fireEvent.press(screen.getByRole("button", { name: "Save email" }));

    await waitFor(() => {
      expect(authRepository.updateEmailAddress).toHaveBeenCalledWith("member-user", {
        email: "petra@example.com",
      });
      expect(screen.getByText("Email saved.")).toBeTruthy();
    });

    fireEvent.press(screen.getByRole("button", { name: "Send password reset email" }));

    await waitFor(() => {
      expect(authRepository.sendPasswordReset).toHaveBeenCalledWith({
        email: "petra@example.com",
      });
      expect(screen.getByText("Password reset email sent.")).toBeTruthy();
    });
  });

  it("shows friendly Firebase auth errors for account email save and password reset", async () => {
    const authRepository = createAuthRepositoryStub({
      signIn: jest.fn(async (input) => ({
        userId: "member-user",
        email: input.email,
        firstName: "Member",
        lastName: "User",
      })),
      updateEmailAddress: jest.fn(async () => {
        const error = new Error("Firebase error") as Error & { code: string };
        error.code = "auth/requires-recent-login";
        throw error;
      }),
      sendPasswordReset: jest.fn(async () => {
        const error = new Error("Firebase error") as Error & { code: string };
        error.code = "auth/too-many-requests";
        throw error;
      }),
    });

    render(
      <AppProviders authRepository={authRepository}>
        <AppNavigatorShell
          discoveryService={suspendedDiscoveryService}
          listTenantMemberships={async (userId) =>
            userId === "member-user"
              ? [
                  {
                    membershipId: "tenantA_member-user",
                    tenantId: "tenantA",
                    userId,
                    role: "tenant_admin",
                    status: "active",
                  },
                ]
              : []
          }
        />
      </AppProviders>
    );

    fireEvent.press(screen.getByText("Already have an account? Sign In"));
    fireEvent.changeText(screen.getByPlaceholderText("name@example.com"), "member@example.com");
    fireEvent.changeText(screen.getByPlaceholderText("••••••••"), "strong-password");
    fireEvent.press(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(screen.getByText("Tenant context: tenantA")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Profile"));
    fireEvent.changeText(screen.getByPlaceholderText("name@example.com"), "petra@example.com");
    fireEvent.press(screen.getByRole("button", { name: "Save email" }));

    await waitFor(() => {
      expect(screen.getByText("For security, please log in again before changing your email.")).toBeTruthy();
    });

    fireEvent.press(screen.getByRole("button", { name: "Send password reset email" }));

    await waitFor(() => {
      expect(screen.getByText("Too many attempts. Please wait a moment and try again.")).toBeTruthy();
    });
  });

  it("shows repository auth errors on the login screen", async () => {
    const authRepository = createAuthRepositoryStub({
      signIn: jest.fn(async () => {
        throw new Error("Invalid credentials");
      }),
    });

    render(
      <AppProviders authRepository={authRepository}>
        <AppNavigatorShell
          discoveryService={suspendedDiscoveryService}
          listTenantMemberships={async () => defaultMemberships}
        />
      </AppProviders>
    );

    fireEvent.press(screen.getByText("Already have an account? Sign In"));
    fireEvent.changeText(screen.getByPlaceholderText("name@example.com"), "member@example.com");
    fireEvent.changeText(screen.getByPlaceholderText("••••••••"), "wrong-password");
    fireEvent.press(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(authRepository.signIn).toHaveBeenCalledWith({
        email: "member@example.com",
        password: "wrong-password",
      });
      expect(screen.getByText("Invalid credentials")).toBeTruthy();
    });

    expect(screen.getByText("Current route: Login")).toBeTruthy();
  });

  it("clears auth errors after navigating away from and back to login", async () => {
    const authRepository = createAuthRepositoryStub({
      signIn: jest.fn(async () => {
        throw new Error("Invalid credentials");
      }),
    });

    render(
      <AppProviders authRepository={authRepository}>
        <AppNavigatorShell
          discoveryService={suspendedDiscoveryService}
          listTenantMemberships={async () => defaultMemberships}
        />
      </AppProviders>
    );

    fireEvent.press(screen.getByText("Already have an account? Sign In"));
    fireEvent.changeText(screen.getByPlaceholderText("name@example.com"), "member@example.com");
    fireEvent.changeText(screen.getByPlaceholderText("••••••••"), "wrong-password");
    fireEvent.press(screen.getByRole("button", { name: "Login" }));

    await screen.findByText("Invalid credentials");

    fireEvent.press(screen.getByText("Back"));
    fireEvent.press(screen.getByText("Already have an account? Sign In"));

    expect(screen.queryByText("Invalid credentials")).toBeNull();
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
          discoveryService={suspendedDiscoveryService}
          onboardingProgressPersistence={persistence}
          listTenantMemberships={async () => defaultMemberships}
        />
      </AppProviders>
    );

    fireEvent.press(screen.getByText("Already have an account? Sign In"));
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
          discoveryService={suspendedDiscoveryService}
          onboardingProgressPersistence={persistence}
          listTenantMemberships={async () => defaultMemberships}
        />
      </AppProviders>
    );

    fireEvent.press(screen.getByText("Already have an account? Sign In"));
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
          discoveryService={suspendedDiscoveryService}
          onboardingProgressPersistence={persistence}
          listTenantMemberships={async () => []}
        />
      </AppProviders>
    );

    fireEvent.press(screen.getByText("Already have an account? Sign In"));
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
          discoveryService={suspendedDiscoveryService}
          onboardingProgressPersistence={persistence}
          listTenantMemberships={async () => memberships}
        />
      </AppProviders>
    );

    fireEvent.press(screen.getByText("Already have an account? Sign In"));
    fireEvent.press(screen.getByText("Sign in as dev user"));
    fireEvent.press(await screen.findByText("Select tenant tenantB"));
    fireEvent.press(screen.getByText("Start client onboarding"));

    await waitFor(() => {
      expect(persistence.resumeDraft).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: "tenantB" })
      );
    });
  });

  it("shows owner AI budget settings only for platform admin user", async () => {
    const aiBudgetAdminService: AiBudgetAdminService = {
      getBudgetConfigForAdmin: jest.fn(async () => ({
        globalMonthlyCapUsd: 1090,
        warningThreshold: 0.7,
        protectionThreshold: 0.9,
        featureCaps: {
          "content-creation": { monthlyCapUsd: 120 },
          "marketing-orchestration": { monthlyCapUsd: 180 },
          "service-recommendations": { monthlyCapUsd: 140 },
          "scheduling-optimization": { monthlyCapUsd: 180 },
          "retention-insights": { monthlyCapUsd: 150 },
          "support-triage": { monthlyCapUsd: 120 },
          "no-show-fraud": { monthlyCapUsd: 110 },
          "marketplace-personalization": { monthlyCapUsd: 90 },
        },
      })),
      listBudgetAuditLogsForAdmin: jest.fn(async () => ({
        items: [],
        count: 0,
        limit: 20,
        nextPageToken: null,
        filters: {
          eventType: null,
          targetPath: null,
        },
      })),
      updateBudgetConfigForAdmin: jest.fn(async () => ({
        globalMonthlyCapUsd: 1090,
        warningThreshold: 0.7,
        protectionThreshold: 0.9,
        featureCaps: {
          "content-creation": { monthlyCapUsd: 120 },
          "marketing-orchestration": { monthlyCapUsd: 180 },
          "service-recommendations": { monthlyCapUsd: 140 },
          "scheduling-optimization": { monthlyCapUsd: 180 },
          "retention-insights": { monthlyCapUsd: 150 },
          "support-triage": { monthlyCapUsd: 130 },
          "no-show-fraud": { monthlyCapUsd: 110 },
          "marketplace-personalization": { monthlyCapUsd: 90 },
        },
      })),
    };

    render(
      <AppProviders>
        <AppNavigatorShell
          discoveryService={suspendedDiscoveryService}
          listTenantMemberships={async () => defaultMemberships}
          aiBudgetAdminService={aiBudgetAdminService}
          isPlatformAdminUser={async () => true}
        />
      </AppProviders>
    );

    fireEvent.press(screen.getByText("Already have an account? Sign In"));
    fireEvent.press(screen.getByText("Sign in as dev user"));
    fireEvent.press(await screen.findByText("Owner AI budget settings"));
    fireEvent.press(await screen.findByText("Refresh budget config"));

    await waitFor(() => {
      expect(screen.getByText("Current route: OwnerAiBudgetSettings")).toBeTruthy();
      expect(screen.getByText("Global cap USD: 1090")).toBeTruthy();
    });

    expect(aiBudgetAdminService.getBudgetConfigForAdmin).toHaveBeenCalledWith({
      userId: "dev-user",
    });
  });

  it("navigates to tenant profile placeholder when booking is enabled", async () => {
    (featureFlags as { marketplaceEnabled: boolean }).marketplaceEnabled = true;

    render(
      <AppProviders>
        <AppNavigatorShell
          discoveryService={createDiscoveryServiceStub()}
          listTenantMemberships={async () => defaultMemberships}
        />
      </AppProviders>
    );

    fireEvent.press(screen.getByText("Discover businesses"));
    await screen.findByText("Luna Studio");

    fireEvent.press(screen.getByText("Book"));

    await waitFor(() => {
      expect(screen.getByText("Current route: TenantPublicProfile")).toBeTruthy();
      expect(screen.getByText("Selected tenant: tenant-a")).toBeTruthy();
    });
  });

  it("shows coming-soon notice when booking is disabled for a salon", async () => {
    (featureFlags as { marketplaceEnabled: boolean }).marketplaceEnabled = true;

    render(
      <AppProviders>
        <AppNavigatorShell
          discoveryService={createDiscoveryServiceStub()}
          listTenantMemberships={async () => defaultMemberships}
        />
      </AppProviders>
    );

    fireEvent.press(screen.getByText("Discover businesses"));
    await screen.findByText("Atelier Glow");

    fireEvent.press(screen.getByText("Book (coming soon)"));

    expect(await screen.findByText("Booking is coming soon for Atelier Glow.")).toBeTruthy();
    expect(screen.getByText("Current route: DiscoverBusinesses")).toBeTruthy();
  });

  it("filters discover results by search and shows empty state when nothing matches", async () => {
    (featureFlags as { marketplaceEnabled: boolean }).marketplaceEnabled = true;

    render(
      <AppProviders>
        <AppNavigatorShell
          discoveryService={createDiscoveryServiceStub()}
          listTenantMemberships={async () => defaultMemberships}
        />
      </AppProviders>
    );

    fireEvent.press(screen.getByText("Discover businesses"));
    await screen.findByText("Luna Studio");

    fireEvent.changeText(screen.getByPlaceholderText("Search services, salons..."), "luna");
    expect(screen.getByText("Luna Studio")).toBeTruthy();
    expect(screen.queryByText("Atelier Glow")).toBeNull();

    fireEvent.changeText(screen.getByPlaceholderText("Search services, salons..."), "does-not-exist");
    expect(await screen.findByText("No salons match your current filters.")).toBeTruthy();
  });

  it("shows discover error state when feed loading fails", async () => {
    (featureFlags as { marketplaceEnabled: boolean }).marketplaceEnabled = true;

    render(
      <AppProviders>
        <AppNavigatorShell
          discoveryService={createDiscoveryServiceStub({
            getHomeFeed: async () => {
              throw new Error("Failed home feed");
            },
            getExploreFeed: async () => {
              throw new Error("Failed explore feed");
            },
          })}
          listTenantMemberships={async () => defaultMemberships}
        />
      </AppProviders>
    );

    fireEvent.press(screen.getByText("Discover businesses"));

    expect(await screen.findByText("Unable to load discovery content.")).toBeTruthy();
  });

  it("renders tenant profile screen from app shell route entry", async () => {
    const adminService = createTenantLocationAdminServiceStub();

    render(
      <AppProviders>
        <AppNavigatorShell
          discoveryService={suspendedDiscoveryService}
          listTenantMemberships={async () => defaultMemberships}
          tenantLocationAdminService={adminService}
        />
      </AppProviders>
    );

    fireEvent.press(screen.getByText("Already have an account? Sign In"));
    fireEvent.press(screen.getByText("Sign in as dev user"));
    await screen.findByText("Tenant context: tenantA");

    fireEvent.press(screen.getByText("Tenant profile"));

    await waitFor(() => {
      expect(screen.getByText("Current route: TenantProfile")).toBeTruthy();
      expect(screen.getByText("Name: Tenant Alpha")).toBeTruthy();
    });
  });

  it("submits create location with tenant-scoped payload", async () => {
    const createLocationForTenant = jest.fn(async () => ({
      ok: true as const,
      data: {
        locationId: "loc-created",
        tenantId: "tenantA",
        name: "Downtown Studio",
        code: "DOWNTOWN",
        status: "active" as const,
        timezone: "Europe/Zagreb",
        phone: null,
        email: null,
        address: {
          line1: "",
          city: "Zagreb",
          country: "HR",
          postalCode: "",
        },
        operatingHours: {},
        createdAt: {} as never,
        updatedAt: {} as never,
      },
    }));
    const adminService = createTenantLocationAdminServiceStub({ createLocationForTenant });

    render(
      <AppProviders>
        <AppNavigatorShell
          discoveryService={suspendedDiscoveryService}
          listTenantMemberships={async () => defaultMemberships}
          tenantLocationAdminService={adminService}
        />
      </AppProviders>
    );

    fireEvent.press(screen.getByText("Already have an account? Sign In"));
    fireEvent.press(screen.getByText("Sign in as dev user"));
    await screen.findByText("Tenant context: tenantA");

    fireEvent.press(screen.getByText("Create location"));
    await screen.findByText("Current route: CreateLocation");

    fireEvent.changeText(screen.getByPlaceholderText("Downtown Studio"), "Downtown Studio");
    fireEvent.changeText(screen.getByPlaceholderText("DOWNTOWN"), "downtown");
    fireEvent.changeText(screen.getByPlaceholderText("Zagreb"), "Zagreb");
    fireEvent.changeText(screen.getByPlaceholderText("HR"), "hr");
    fireEvent.changeText(screen.getByPlaceholderText("Europe/Zagreb"), "Europe/Zagreb");
    fireEvent.press(screen.getByText("Submit location"));

    await waitFor(() => {
      expect(createLocationForTenant).toHaveBeenCalledTimes(1);
      expect(createLocationForTenant).toHaveBeenCalledWith(
        expect.stringMatching(/^tenantA_/),
        {
          tenantId: "tenantA",
          name: "Downtown Studio",
          code: "DOWNTOWN",
          status: "active",
          timezone: "Europe/Zagreb",
          phone: null,
          email: null,
          address: {
            line1: "",
            city: "Zagreb",
            country: "HR",
            postalCode: "",
          },
          operatingHours: {},
        }
      );
    });

    expect(await screen.findByText("Location Downtown Studio created.")).toBeTruthy();
  });

  it("renders staff list screen from app shell route entry", async () => {
    const staffService = createStaffAdminServiceStub();

    render(
      <AppProviders>
        <AppNavigatorShell
          discoveryService={suspendedDiscoveryService}
          listTenantMemberships={async () => defaultMemberships}
          staffAdminService={staffService}
        />
      </AppProviders>
    );

    fireEvent.press(screen.getByText("Already have an account? Sign In"));
    fireEvent.press(screen.getByText("Sign in as dev user"));
    await screen.findByText("Tenant context: tenantA");

    fireEvent.press(screen.getByText("Staff list"));

    await waitFor(() => {
      expect(screen.getByText("Current route: StaffList")).toBeTruthy();
      expect(screen.getByText("No staff members yet.")).toBeTruthy();
    });
  });

  it("submits create service with tenant-scoped payload", async () => {
    const createServiceForTenant = jest.fn(async () => ({
      ok: true as const,
      data: {
        serviceId: "svc-created",
        tenantId: "tenantA",
        locationIds: [],
        name: "Haircut",
        category: "hair",
        durationMinutes: 60,
        bufferMinutes: 0,
        price: 50,
        currency: "EUR",
        active: true as const,
        sortOrder: 0,
        createdAt: {} as never,
        updatedAt: {} as never,
      },
    }));
    const serviceService = createServiceAdminServiceStub({ createServiceForTenant });

    render(
      <AppProviders>
        <AppNavigatorShell
          discoveryService={suspendedDiscoveryService}
          listTenantMemberships={async () => defaultMemberships}
          serviceAdminService={serviceService}
        />
      </AppProviders>
    );

    fireEvent.press(screen.getByText("Already have an account? Sign In"));
    fireEvent.press(screen.getByText("Sign in as dev user"));
    await screen.findByText("Tenant context: tenantA");

    fireEvent.press(screen.getByText("Add service"));
    await screen.findByText("Current route: ServiceCreate");

    fireEvent.changeText(screen.getByPlaceholderText("Haircut"), "Haircut");
    fireEvent.changeText(screen.getByPlaceholderText("hair"), "hair");
    fireEvent.changeText(screen.getByPlaceholderText("60"), "60");
    fireEvent.changeText(screen.getByPlaceholderText("0"), "50");
    fireEvent.changeText(screen.getByPlaceholderText("EUR"), "EUR");
    fireEvent.press(screen.getByText("Submit service"));

    await waitFor(() => {
      expect(createServiceForTenant).toHaveBeenCalledTimes(1);
      expect(createServiceForTenant).toHaveBeenCalledWith(
        expect.stringMatching(/^tenantA_svc_/),
        expect.objectContaining({
          tenantId: "tenantA",
          name: "Haircut",
          category: "hair",
          durationMinutes: 60,
          price: 50,
          currency: "EUR",
        })
      );
    });

    expect(await screen.findByText("Service Haircut created.")).toBeTruthy();
  });

  // ---------------------------------------------------------------------------
  // Context isolation (5.5.3)
  // ---------------------------------------------------------------------------

  it("context switch: selecting a salon from the dashboard scopes subsequent operations to that tenant", async () => {
    // Provide the aggregation service so auto-navigate fires and the dashboard
    // renders with two salon cards: tenantA and tenantB.
    const unreadAggregationService: UnreadAggregationService = {
      loadSalonSummaries: jest.fn().mockResolvedValue({
        ok: true,
        summaries: [
          {
            tenantId: "tenantA",
            tenantName: "Alpha Salon",
            logoUrl: null,
            unreadMessageCount: 0,
            subscriptionStatus: "active",
            accessLevel: "owner",
          },
          {
            tenantId: "tenantB",
            tenantName: "Beta Salon",
            logoUrl: null,
            unreadMessageCount: 2,
            subscriptionStatus: "active",
            accessLevel: "client",
          },
        ],
        totalUnread: 2,
      }),
      subscribeToSalonSummaries: jest.fn().mockReturnValue(jest.fn()),
    };

    const readStaffList = jest.fn().mockResolvedValue({ ok: true, data: [] });
    const staffAdminService = createStaffAdminServiceStub({ readStaffList });

    render(
      <AppProviders>
        <AppNavigatorShell
          discoveryService={suspendedDiscoveryService}
          listTenantMemberships={async () => [
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
          ]}
          unreadAggregationService={unreadAggregationService}
          staffAdminService={staffAdminService}
        />
      </AppProviders>
    );

    // Sign in — auto-navigate fires to SalonDashboard because service is wired
    fireEvent.press(screen.getByText("Already have an account? Sign In"));
    fireEvent.press(screen.getByText("Sign in as dev user"));

    // Dashboard renders with both salon cards
    await screen.findByTestId("multi-salon-dashboard");
    expect(screen.getByTestId("salon-card-tenantA")).toBeTruthy();
    expect(screen.getByTestId("salon-card-tenantB")).toBeTruthy();

    // Select tenantB — context switches away from tenantA
    fireEvent.press(screen.getByTestId("salon-card-tenantB"));
    await screen.findByText("Current route: AppShell");

    // Navigate to staff list — must be scoped to tenantB, not tenantA
    fireEvent.press(screen.getByText("Staff list"));
    await screen.findByText("Current route: StaffList");

    await waitFor(() => {
      expect(readStaffList).toHaveBeenCalledWith("tenantB", expect.anything());
    });
    // Critically: tenantA's data must not have been requested
    expect(readStaffList).not.toHaveBeenCalledWith("tenantA", expect.anything());
  });
});

