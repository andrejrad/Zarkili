import {
  appRoutes,
  canAccessPath,
  canAccessRoute,
  getRouteByPath,
  getAccessibleRoutes,
  resolveRouteFromPath,
  resolvePreferredRoute,
  parseSalonContextPath,
  type RouteAccessContext,
} from "../routes";

describe("navigation route guards", () => {
  it("allows all public routes for anonymous user", () => {
    const context: RouteAccessContext = { userId: null };

    const routes = getAccessibleRoutes(context);

    expect(routes.map((route) => route.name)).toEqual([
      "Landing",
      "Login",
      "Register",
      "DiscoverBusinesses",
      "TenantPublicProfile",
    ]);
  });

  it("adds authenticated route when user is signed in", () => {
    const context: RouteAccessContext = { userId: "u1" };

    const routes = getAccessibleRoutes(context);

    expect(routes.map((route) => route.name)).toContain("AppShell");
    expect(routes.map((route) => route.name)).toContain("TenantProfile");
    expect(routes.map((route) => route.name)).toContain("TenantLocations");
    expect(routes.map((route) => route.name)).toContain("CreateLocation");
    expect(routes.map((route) => route.name)).toContain("SalonOnboardingAccount");
    expect(routes.map((route) => route.name)).toContain("ClientOnboardingAccountGuest");
    expect(routes.map((route) => route.name)).not.toContain("OwnerAiBudgetSettings");
  });

  it("adds owner route only for platform admin users", () => {
    const nonAdminRoutes = getAccessibleRoutes({ userId: "u1", isPlatformAdmin: false });
    const adminRoutes = getAccessibleRoutes({ userId: "u1", isPlatformAdmin: true });

    expect(nonAdminRoutes.map((route) => route.name)).not.toContain("OwnerAiBudgetSettings");
    expect(adminRoutes.map((route) => route.name)).toContain("OwnerAiBudgetSettings");
  });

  it("returns app shell as preferred route when only authenticated", () => {
    const preferred = resolvePreferredRoute({ userId: "u1" });

    expect(preferred.name).toBe("AppShell");
  });

  it("returns landing as preferred route when anonymous", () => {
    const preferred = resolvePreferredRoute({ userId: null });

    expect(preferred.name).toBe("Landing");
  });

  it("canAccessRoute enforces authenticated guard", () => {
    const appShellRoute = appRoutes.find((route) => route.name === "AppShell");
    expect(appShellRoute).toBeTruthy();

    expect(canAccessRoute(appShellRoute!, { userId: null })).toBe(false);
    expect(canAccessRoute(appShellRoute!, { userId: "u1" })).toBe(true);
  });

  it("resolves route by path with normalization", () => {
    expect(getRouteByPath("discover")).toMatchObject({ name: "DiscoverBusinesses" });
    expect(getRouteByPath("/discover/")).toMatchObject({ name: "DiscoverBusinesses" });
    expect(getRouteByPath("/discover/tenant-profile")).toMatchObject({ name: "TenantPublicProfile" });
    expect(getRouteByPath("/app/tenant-profile")).toMatchObject({ name: "TenantProfile" });
    expect(getRouteByPath("/app/locations")).toMatchObject({ name: "TenantLocations" });
    expect(getRouteByPath("/app/locations/create")).toMatchObject({ name: "CreateLocation" });
    expect(getRouteByPath("/unknown")).toBeNull();
  });

  it("canAccessPath enforces guards for deep links", () => {
    expect(canAccessPath("/app", { userId: null })).toBe(false);
    expect(canAccessPath("/app", { userId: "u1" })).toBe(true);
    expect(canAccessPath("/app/tenant-profile", { userId: null })).toBe(false);
    expect(canAccessPath("/app/tenant-profile", { userId: "u1" })).toBe(true);
    expect(canAccessPath("/app/locations", { userId: null })).toBe(false);
    expect(canAccessPath("/app/locations", { userId: "u1" })).toBe(true);
    expect(canAccessPath("/app/locations/create", { userId: null })).toBe(false);
    expect(canAccessPath("/app/locations/create", { userId: "u1" })).toBe(true);
    expect(canAccessPath("/onboarding/salon/account", { userId: null })).toBe(false);
    expect(canAccessPath("/onboarding/salon/account", { userId: "u1" })).toBe(true);
    expect(canAccessPath("/owner/ai-budget", { userId: "u1", isPlatformAdmin: false })).toBe(false);
    expect(canAccessPath("/owner/ai-budget", { userId: "u1", isPlatformAdmin: true })).toBe(true);
    expect(canAccessPath("/missing", { userId: "u1" })).toBe(false);
  });

  it("resolveRouteFromPath redirects unauthorized paths to preferred route", () => {
    const resolution = resolveRouteFromPath("/app", { userId: null });

    expect(resolution.reason).toBe("redirect-unauthorized");
    expect(resolution.resolvedRoute.name).toBe("Landing");
  });

  it("resolveRouteFromPath redirects unknown paths to preferred route", () => {
    const resolution = resolveRouteFromPath("/does-not-exist", { userId: "u1" });

    expect(resolution.reason).toBe("redirect-not-found");
    expect(resolution.resolvedRoute.name).toBe("AppShell");
  });

  it("resolveRouteFromPath allows direct access when route is accessible", () => {
    const resolution = resolveRouteFromPath("/discover", { userId: null });

    expect(resolution.reason).toBe("direct");
    expect(resolution.resolvedRoute.name).toBe("DiscoverBusinesses");
  });

  it("SalonDashboard route exists and is authenticated-guarded", () => {
    expect(appRoutes.find((r) => r.name === "SalonDashboard")).toMatchObject({
      name: "SalonDashboard",
      group: "protected",
      guard: "authenticated",
    });
  });
});

// ---------------------------------------------------------------------------
// parseSalonContextPath
// ---------------------------------------------------------------------------

describe("parseSalonContextPath", () => {
  it("parses a bare tenant path with no section", () => {
    const result = parseSalonContextPath("/salon/tenant-abc");
    expect(result).toEqual({ tenantId: "tenant-abc", section: null });
  });

  it("parses a path with 'book' section", () => {
    expect(parseSalonContextPath("/salon/tenant-abc/book")).toEqual({
      tenantId: "tenant-abc",
      section: "book",
    });
  });

  it("parses a path with 'messages' section", () => {
    expect(parseSalonContextPath("/salon/t1/messages")).toEqual({
      tenantId: "t1",
      section: "messages",
    });
  });

  it("parses a path with 'loyalty' section", () => {
    expect(parseSalonContextPath("/salon/t1/loyalty")).toEqual({
      tenantId: "t1",
      section: "loyalty",
    });
  });

  it("parses a path with 'profile' section", () => {
    expect(parseSalonContextPath("/salon/t1/profile")).toEqual({
      tenantId: "t1",
      section: "profile",
    });
  });

  it("returns null for unknown section — section is set to null", () => {
    const result = parseSalonContextPath("/salon/t1/unknown-section");
    expect(result).toEqual({ tenantId: "t1", section: null });
  });

  it("returns null for non-salon paths", () => {
    expect(parseSalonContextPath("/app/tenant-profile")).toBeNull();
    expect(parseSalonContextPath("/discover")).toBeNull();
    expect(parseSalonContextPath("/")).toBeNull();
  });

  it("handles paths without leading slash", () => {
    const result = parseSalonContextPath("salon/tenant-abc");
    expect(result).toEqual({ tenantId: "tenant-abc", section: null });
  });

  it("handles paths with trailing slash", () => {
    const result = parseSalonContextPath("/salon/tenant-abc/");
    // Trailing slash results in an empty section segment → null section
    expect(result).not.toBeNull();
    expect(result?.tenantId).toBe("tenant-abc");
  });
});
