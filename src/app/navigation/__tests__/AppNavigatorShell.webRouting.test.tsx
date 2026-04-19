/** @jest-environment jsdom */

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { Platform } from "react-native";

import { AppProviders } from "../../providers/AppProviders";
import { AppNavigatorShell } from "../AppNavigatorShell";
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

describe("AppNavigatorShell web routing", () => {
  const originalPlatformOs = Platform.OS;
  const defaultMemberships: TenantMembership[] = [
    {
      membershipId: "tenantA_dev-user",
      tenantId: "tenantA",
      userId: "dev-user",
      role: "tenant_admin",
      status: "active",
    },
  ];

  beforeEach(() => {
    Object.defineProperty(Platform, "OS", {
      value: "web",
      configurable: true,
    });
    window.history.replaceState(null, "", "/");
  });

  afterEach(() => {
    Object.defineProperty(Platform, "OS", {
      value: originalPlatformOs,
      configurable: true,
    });
    window.history.replaceState(null, "", "/");
  });

  it("redirects unauthorized web path to safe public route", async () => {
    window.history.replaceState(null, "", "/app");

    render(
      <AppProviders>
        <AppNavigatorShell listTenantMemberships={async () => defaultMemberships} />
      </AppProviders>
    );

    expect(await screen.findByText("Current route: Landing")).toBeTruthy();
    expect(window.location.pathname).toBe("/");
  });

  it("syncs URL when navigation changes route", async () => {
    render(
      <AppProviders>
        <AppNavigatorShell listTenantMemberships={async () => defaultMemberships} />
      </AppProviders>
    );

    fireEvent.press(screen.getByText("Discover businesses"));

    await waitFor(() => {
      expect(screen.getByText("Current route: DiscoverBusinesses")).toBeTruthy();
      expect(window.location.pathname).toBe("/discover");
    });
  });

  it("handles browser popstate and updates active route", async () => {
    render(
      <AppProviders>
        <AppNavigatorShell listTenantMemberships={async () => defaultMemberships} />
      </AppProviders>
    );

    fireEvent.press(screen.getByText("Discover businesses"));
    await screen.findByText("Current route: DiscoverBusinesses");

    await act(async () => {
      window.history.pushState(null, "", "/login");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    expect(await screen.findByText("Current route: Login")).toBeTruthy();
  });

  it("falls back to app shell when authenticated onboarding deep-link has no tenant context", async () => {
    window.history.replaceState(null, "", "/login");

    render(
      <AppProviders>
        <AppNavigatorShell listTenantMemberships={async () => []} />
      </AppProviders>
    );

    fireEvent.press(await screen.findByText("Sign in as dev user"));
    await waitFor(() => {
      expect(screen.getByText(/Accessible routes: .*AppShell/)).toBeTruthy();
    });

    await act(async () => {
      window.history.pushState(null, "", "/onboarding/client/profile");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    await waitFor(() => {
      expect(screen.getByText("Current route: AppShell")).toBeTruthy();
      expect(screen.getByText("Select tenant context before onboarding.")).toBeTruthy();
    });
  });
});
