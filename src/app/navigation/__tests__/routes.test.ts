import {
  appRoutes,
  canAccessPath,
  canAccessRoute,
  getRouteByPath,
  getAccessibleRoutes,
  resolveRouteFromPath,
  resolvePreferredRoute,
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
    ]);
  });

  it("adds authenticated route when user is signed in", () => {
    const context: RouteAccessContext = { userId: "u1" };

    const routes = getAccessibleRoutes(context);

    expect(routes.map((route) => route.name)).toContain("AppShell");
    expect(routes.map((route) => route.name)).toContain("SalonOnboardingAccount");
    expect(routes.map((route) => route.name)).toContain("ClientOnboardingAccountGuest");
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
    expect(getRouteByPath("/unknown")).toBeNull();
  });

  it("canAccessPath enforces guards for deep links", () => {
    expect(canAccessPath("/app", { userId: null })).toBe(false);
    expect(canAccessPath("/app", { userId: "u1" })).toBe(true);
    expect(canAccessPath("/onboarding/salon/account", { userId: null })).toBe(false);
    expect(canAccessPath("/onboarding/salon/account", { userId: "u1" })).toBe(true);
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
});
