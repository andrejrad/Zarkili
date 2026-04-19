import {
  clientOnboardingSteps,
  salonOnboardingSteps,
} from "./onboarding/contracts";

export type AppRouteGroup =
  | "public"
  | "protected"
  | "salonOnboarding"
  | "clientOnboarding";

export type AppRouteGuard = "none" | "authenticated";

export type AppRouteDefinition = {
  name: string;
  group: AppRouteGroup;
  path: string;
  guard: AppRouteGuard;
};

export type RouteAccessContext = {
  userId: string | null;
};

export type RouteResolutionReason = "direct" | "redirect-unauthorized" | "redirect-not-found";

export type RouteResolution = {
  requestedPath: string;
  resolvedRoute: AppRouteDefinition;
  reason: RouteResolutionReason;
};

function toPascalCase(step: string): string {
  return step
    .split("-")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join("");
}

const salonOnboardingRoutes: AppRouteDefinition[] = salonOnboardingSteps.map((step) => ({
  name: `SalonOnboarding${toPascalCase(step)}`,
  group: "salonOnboarding",
  path: `/onboarding/salon/${step}`,
  guard: "authenticated",
}));

const clientOnboardingRoutes: AppRouteDefinition[] = clientOnboardingSteps.map((step) => ({
  name: `ClientOnboarding${toPascalCase(step)}`,
  group: "clientOnboarding",
  path: `/onboarding/client/${step}`,
  guard: "authenticated",
}));

export const appRoutes: AppRouteDefinition[] = [
  { name: "Landing", group: "public", path: "/", guard: "none" },
  { name: "Login", group: "public", path: "/login", guard: "none" },
  { name: "Register", group: "public", path: "/register", guard: "none" },
  {
    name: "DiscoverBusinesses",
    group: "public",
    path: "/discover",
    guard: "none",
  },
  {
    name: "AppShell",
    group: "protected",
    path: "/app",
    guard: "authenticated",
  },
  ...salonOnboardingRoutes,
  ...clientOnboardingRoutes,
];

export function canAccessRoute(route: AppRouteDefinition, context: RouteAccessContext): boolean {
  if (route.guard === "none") {
    return true;
  }

  if (route.guard === "authenticated") {
    return Boolean(context.userId);
  }

  return false;
}

export function getAccessibleRoutes(context: RouteAccessContext): AppRouteDefinition[] {
  return appRoutes.filter((route) => canAccessRoute(route, context));
}

export function resolvePreferredRoute(context: RouteAccessContext): AppRouteDefinition {
  const accessibleRoutes = getAccessibleRoutes(context);
  const authRoute = accessibleRoutes.find((route) => route.guard === "authenticated");
  if (authRoute) {
    return authRoute;
  }

  return appRoutes[0];
}

function normalizePath(path: string): string {
  const trimmed = path.trim();
  if (trimmed.length === 0) {
    return "/";
  }

  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  if (withLeadingSlash.length > 1 && withLeadingSlash.endsWith("/")) {
    return withLeadingSlash.slice(0, -1);
  }

  return withLeadingSlash;
}

export function getRouteByPath(path: string): AppRouteDefinition | null {
  const normalizedPath = normalizePath(path);
  return appRoutes.find((route) => route.path === normalizedPath) ?? null;
}

export function canAccessPath(path: string, context: RouteAccessContext): boolean {
  const route = getRouteByPath(path);
  if (!route) {
    return false;
  }

  return canAccessRoute(route, context);
}

export function resolveRouteFromPath(path: string, context: RouteAccessContext): RouteResolution {
  const route = getRouteByPath(path);
  const preferredRoute = resolvePreferredRoute(context);

  if (!route) {
    return {
      requestedPath: normalizePath(path),
      resolvedRoute: preferredRoute,
      reason: "redirect-not-found",
    };
  }

  if (!canAccessRoute(route, context)) {
    return {
      requestedPath: normalizePath(path),
      resolvedRoute: preferredRoute,
      reason: "redirect-unauthorized",
    };
  }

  return {
    requestedPath: normalizePath(path),
    resolvedRoute: route,
    reason: "direct",
  };
}
