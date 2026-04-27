import {
  clientOnboardingSteps,
  salonOnboardingSteps,
} from "./onboarding/contracts";

export type AppRouteGroup =
  | "public"
  | "protected"
  | "owner"
  | "salonOnboarding"
  | "clientOnboarding";

export type AppRouteGuard = "none" | "authenticated" | "platform-admin";

export type AppRouteDefinition = {
  name: string;
  group: AppRouteGroup;
  path: string;
  guard: AppRouteGuard;
};

export type RouteAccessContext = {
  userId: string | null;
  isPlatformAdmin?: boolean;
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
    name: "TenantPublicProfile",
    group: "public",
    path: "/discover/tenant-profile",
    guard: "none",
  },
  {
    name: "AppShell",
    group: "protected",
    path: "/app",
    guard: "authenticated",
  },
  {
    name: "CompleteProfile",
    group: "protected",
    path: "/app/complete-profile",
    guard: "authenticated",
  },
  {
    name: "TenantProfile",
    group: "protected",
    path: "/app/tenant-profile",
    guard: "authenticated",
  },
  {
    name: "TenantLocations",
    group: "protected",
    path: "/app/locations",
    guard: "authenticated",
  },
  {
    name: "CreateLocation",
    group: "protected",
    path: "/app/locations/create",
    guard: "authenticated",
  },
  {
    name: "StaffList",
    group: "protected",
    path: "/app/staff",
    guard: "authenticated",
  },
  {
    name: "StaffCreate",
    group: "protected",
    path: "/app/staff/create",
    guard: "authenticated",
  },
  {
    name: "StaffEdit",
    group: "protected",
    path: "/app/staff/edit",
    guard: "authenticated",
  },
  {
    name: "ServiceList",
    group: "protected",
    path: "/app/services",
    guard: "authenticated",
  },
  {
    name: "ServiceCreate",
    group: "protected",
    path: "/app/services/create",
    guard: "authenticated",
  },
  {
    name: "ServiceEdit",
    group: "protected",
    path: "/app/services/edit",
    guard: "authenticated",
  },
  {
    name: "AdminBookingQueue",
    group: "protected",
    path: "/app/booking-queue",
    guard: "authenticated",
  },
  {
    name: "SalonDashboard",
    group: "protected",
    path: "/app/salon-dashboard",
    guard: "authenticated",
  },
  {
    name: "OwnerAiBudgetSettings",
    group: "owner",
    path: "/owner/ai-budget",
    guard: "platform-admin",
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

  if (route.guard === "platform-admin") {
    return Boolean(context.userId) && Boolean(context.isPlatformAdmin);
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

// ---------------------------------------------------------------------------
// Salon context deep-link parsing (5.5.3)
// Handles paths of the form: /salon/{tenantId}[/{section}]
// ---------------------------------------------------------------------------

export type SalonContextSection = "book" | "messages" | "loyalty" | "profile";

export type SalonContextDeepLink = {
  tenantId: string;
  section: SalonContextSection | null;
};

/**
 * Parses a salon context deep-link path.
 *
 * Examples:
 *   /salon/tenant-abc            → { tenantId: "tenant-abc", section: null }
 *   /salon/tenant-abc/messages   → { tenantId: "tenant-abc", section: "messages" }
 *   /salon/tenant-abc/book       → { tenantId: "tenant-abc", section: "book" }
 *
 * Returns null for paths that don't match the /salon/{id} pattern.
 */
export function parseSalonContextPath(path: string): SalonContextDeepLink | null {
  const normalized = normalizePath(path);
  const match = /^\/salon\/([^/]+)(?:\/([^/]+))?$/.exec(normalized);
  if (!match) return null;

  const tenantId = match[1];
  if (!tenantId || tenantId.trim().length === 0) return null;

  const rawSection = match[2];
  const validSections: SalonContextSection[] = ["book", "messages", "loyalty", "profile"];
  const section = validSections.includes(rawSection as SalonContextSection)
    ? (rawSection as SalonContextSection)
    : null;

  return { tenantId, section };
}
