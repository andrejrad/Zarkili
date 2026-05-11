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
  // W21 Batch A — Auth surfaces
  { name: "SignIn", group: "public", path: "/auth/sign-in", guard: "none" },
  { name: "SignUp", group: "public", path: "/auth/sign-up", guard: "none" },
  { name: "SocialSignIn", group: "public", path: "/auth/social", guard: "none" },
  { name: "ForgotPassword", group: "public", path: "/auth/forgot-password", guard: "none" },
  { name: "ResetPassword", group: "public", path: "/auth/reset-password", guard: "none" },
  { name: "EmailVerification", group: "public", path: "/auth/verify-email", guard: "none" },
  { name: "OtpVerification", group: "public", path: "/auth/verify-phone", guard: "none" },
  { name: "AccountMerge", group: "public", path: "/auth/account-merge", guard: "none" },
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
  // W22 Batch B — Discover, Explore, Profile
  { name: "DiscoverHome", group: "public", path: "/discover/home", guard: "none" },
  { name: "DiscoverFeed", group: "public", path: "/discover/feed", guard: "none" },
  { name: "ExploreResults", group: "public", path: "/discover/explore", guard: "none" },
  { name: "ExploreMap", group: "public", path: "/discover/explore/map", guard: "none" },
  { name: "DiscoverFilters", group: "public", path: "/discover/filters", guard: "none" },
  { name: "SalonProfile", group: "public", path: "/discover/salon", guard: "none" },
  { name: "ServiceDetail", group: "public", path: "/discover/service", guard: "none" },
  { name: "StaffDetail", group: "public", path: "/discover/staff", guard: "none" },
  // W23 Batch C — Booking flow
  { name: "BookingService", group: "public", path: "/book/service", guard: "none" },
  { name: "BookingStaff", group: "public", path: "/book/staff", guard: "none" },
  { name: "BookingDate", group: "public", path: "/book/date", guard: "none" },
  { name: "BookingReview", group: "public", path: "/book/review", guard: "none" },
  { name: "BookingPolicies", group: "public", path: "/book/policies", guard: "none" },
  { name: "BookingPayment", group: "public", path: "/book/payment", guard: "none" },
  { name: "BookingConfirmation", group: "public", path: "/book/confirmation", guard: "none" },
  { name: "ManageBooking", group: "public", path: "/book/manage", guard: "none" },
  { name: "GuestContact", group: "public", path: "/book/guest", guard: "none" },
  { name: "PostBookingUpgrade", group: "public", path: "/book/upgrade", guard: "none" },
  // W24 Batch D — Payments, tipping, receipts (consumer)
  { name: "SavedPaymentMethods", group: "public", path: "/payments/methods", guard: "none" },
  { name: "AddPaymentMethod", group: "public", path: "/payments/add", guard: "none" },
  { name: "Tipping", group: "public", path: "/payments/tip", guard: "none" },
  { name: "Receipt", group: "public", path: "/payments/receipt", guard: "none" },
  { name: "BookingHistory", group: "public", path: "/bookings/history", guard: "none" },
  { name: "RefundStatus", group: "public", path: "/payments/refund", guard: "none" },
  // W25 Batch E — Loyalty, Activities, Reviews (consumer)
  { name: "LoyaltyLanding", group: "public", path: "/loyalty", guard: "none" },
  { name: "RewardCatalog", group: "public", path: "/loyalty/rewards", guard: "none" },
  { name: "RewardRedemption", group: "public", path: "/loyalty/rewards/redeem", guard: "none" },
  { name: "Activities", group: "public", path: "/loyalty/activities", guard: "none" },
  { name: "ActivityDetail", group: "public", path: "/loyalty/activities/detail", guard: "none" },
  { name: "ClaimActivityReward", group: "public", path: "/loyalty/activities/claim", guard: "none" },
  { name: "ReviewPrompt", group: "public", path: "/reviews/prompt", guard: "none" },
  { name: "ReviewDetail", group: "public", path: "/reviews/detail", guard: "none" },
  { name: "Referral", group: "public", path: "/loyalty/referral", guard: "none" },
  // W26 Batch F — Messaging, Notifications, Waitlist (consumer)
  { name: "Inbox", group: "public", path: "/messages", guard: "none" },
  { name: "Thread", group: "public", path: "/messages/thread", guard: "none" },
  { name: "Compose", group: "public", path: "/messages/compose", guard: "none" },
  { name: "NotificationCenter", group: "public", path: "/notifications", guard: "none" },
  { name: "NotificationPreferences", group: "public", path: "/notifications/preferences", guard: "none" },
  { name: "EditProfile", group: "public", path: "/profile/edit", guard: "none" },
  { name: "SettingsShell", group: "public", path: "/settings", guard: "none" },
  { name: "LegalPage", group: "public", path: "/settings/legal", guard: "none" },
  { name: "Waitlist", group: "public", path: "/waitlist", guard: "none" },
  { name: "WaitlistJoin", group: "public", path: "/waitlist/join", guard: "none" },
  { name: "WaitlistPosition", group: "public", path: "/waitlist/position", guard: "none" },
  {
    name: "AppShell",
    group: "public",
    path: "/app",
    guard: "none",
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
  // W38 Phase 3 — Owner console
  { name: "OwnerHome", group: "owner", path: "/owner/home", guard: "authenticated" },
  { name: "TenantSettingsShell", group: "owner", path: "/owner/settings", guard: "authenticated" },
  { name: "BusinessProfile", group: "owner", path: "/owner/settings/profile", guard: "authenticated" },
  { name: "BrandSettings", group: "owner", path: "/owner/settings/brand", guard: "authenticated" },
  { name: "TaxSettings", group: "owner", path: "/owner/settings/tax", guard: "authenticated" },
  { name: "CurrencySettings", group: "owner", path: "/owner/settings/currency", guard: "authenticated" },
  { name: "LegalDocuments", group: "owner", path: "/owner/settings/legal-docs", guard: "authenticated" },
  { name: "DomainSettings", group: "owner", path: "/owner/settings/domain", guard: "authenticated" },
  { name: "OwnerNotificationPreferences", group: "owner", path: "/owner/settings/notifications", guard: "authenticated" },
  {
    name: "OwnerAiBudgetSettings",
    group: "owner",
    path: "/owner/ai-budget",
    guard: "platform-admin",
  },
  // W39 — Billing & payouts admin
  { name: "BillingHub", group: "owner", path: "/owner/billing", guard: "authenticated" },
  { name: "SubscriptionPlan", group: "owner", path: "/owner/billing/plan", guard: "authenticated" },
  { name: "InvoiceHistory", group: "owner", path: "/owner/billing/invoices", guard: "authenticated" },
  { name: "AdminPaymentMethod", group: "owner", path: "/owner/billing/payment-method", guard: "authenticated" },
  { name: "CancelSubscription", group: "owner", path: "/owner/billing/cancel", guard: "authenticated" },
  { name: "StripeConnectOnboarding", group: "owner", path: "/owner/billing/connect", guard: "authenticated" },
  { name: "ConnectHealth", group: "owner", path: "/owner/billing/connect-health", guard: "authenticated" },
  { name: "PayoutHistory", group: "owner", path: "/owner/billing/payouts", guard: "authenticated" },
  { name: "RefundDisputeAdmin", group: "owner", path: "/owner/billing/refunds", guard: "authenticated" },
  { name: "PrintPdfLayout", group: "owner", path: "/owner/billing/print", guard: "authenticated" },
  // W40 — Location admin
  { name: "LocationOverview", group: "owner", path: "/owner/locations/overview", guard: "authenticated" },
  { name: "LocationDashboard", group: "owner", path: "/owner/locations/dashboard", guard: "authenticated" },
  { name: "LocationSettings", group: "owner", path: "/owner/locations/settings", guard: "authenticated" },
  { name: "LocationServiceOverrides", group: "owner", path: "/owner/locations/service-overrides", guard: "authenticated" },
  { name: "ResourceManagement", group: "owner", path: "/owner/locations/resources", guard: "authenticated" },
  { name: "AdminWalkInQueue", group: "owner", path: "/owner/locations/walk-in-queue", guard: "authenticated" },
  { name: "DailyClose", group: "owner", path: "/owner/locations/daily-close", guard: "authenticated" },
  // W41 — Staff admin
  { name: "StaffSchedule", group: "owner", path: "/owner/staff/schedule", guard: "authenticated" },
  { name: "StaffPerformance", group: "owner", path: "/owner/staff/performance", guard: "authenticated" },
  { name: "StaffCommission", group: "owner", path: "/owner/staff/commission", guard: "authenticated" },
  { name: "StaffInvite", group: "owner", path: "/owner/staff/invite", guard: "authenticated" },
  { name: "StaffRole", group: "owner", path: "/owner/staff/role", guard: "authenticated" },
  // W41-DEBT-6 — Service/skill assignment per staff member
  { name: "StaffServiceMapping", group: "owner", path: "/owner/staff/service-mapping", guard: "authenticated" },
  // W42 — Service catalog depth
  { name: "ServiceCategories", group: "owner", path: "/owner/service/categories", guard: "authenticated" },
  { name: "ServiceBulkImport", group: "owner", path: "/owner/service/import", guard: "authenticated" },
  { name: "ServicePricing", group: "owner", path: "/owner/service/pricing", guard: "authenticated" },
  { name: "ServiceAddOns", group: "owner", path: "/owner/service/addons", guard: "authenticated" },
  { name: "ServiceSeasonalRules", group: "owner", path: "/owner/service/seasonal", guard: "authenticated" },
  { name: "ServicePhotos", group: "owner", path: "/owner/service/photos", guard: "authenticated" },
  { name: "ServiceBookingRules", group: "owner", path: "/owner/service/booking-rules", guard: "authenticated" },
  { name: "ServiceVisibility", group: "owner", path: "/owner/service/visibility", guard: "authenticated" },
  // W43 — Booking operations
  { name: "BookingCalendar", group: "owner", path: "/owner/bookings/calendar", guard: "authenticated" },
  { name: "BookingDetailAdmin", group: "owner", path: "/owner/bookings/detail", guard: "authenticated" },
  { name: "ManualBooking", group: "owner", path: "/owner/bookings/manual", guard: "authenticated" },
  { name: "BlockTime", group: "owner", path: "/owner/bookings/block-time", guard: "authenticated" },
  { name: "ForceBook", group: "owner", path: "/owner/bookings/force-book", guard: "authenticated" },
  { name: "NoShowMark", group: "owner", path: "/owner/bookings/no-show", guard: "authenticated" },
  { name: "CancellationAdmin", group: "owner", path: "/owner/bookings/cancel", guard: "authenticated" },
  { name: "RescheduleAdmin", group: "owner", path: "/owner/bookings/reschedule", guard: "authenticated" },
  // W44 — Client / CRM
  { name: "ClientListAdmin", group: "owner", path: "/owner/clients", guard: "authenticated" },
  { name: "ClientDetailAdmin", group: "owner", path: "/owner/clients/detail", guard: "authenticated" },
  { name: "MergeClients", group: "owner", path: "/owner/clients/merge", guard: "authenticated" },
  { name: "BlockClient", group: "owner", path: "/owner/clients/block", guard: "authenticated" },
  { name: "GdprExport", group: "owner", path: "/owner/clients/gdpr", guard: "authenticated" },
  { name: "DeleteClient", group: "owner", path: "/owner/clients/delete", guard: "authenticated" },
  { name: "SegmentBuilder", group: "owner", path: "/owner/segments/new", guard: "authenticated" },
  { name: "TargetedMessage", group: "owner", path: "/owner/segments/message", guard: "authenticated" },
  // W45 — Loyalty admin
  { name: "LoyaltyConfig", group: "owner", path: "/owner/loyalty/config", guard: "authenticated" },
  { name: "AdminRewardCatalog", group: "owner", path: "/owner/loyalty/rewards", guard: "authenticated" },
  { name: "PointAdjustment", group: "owner", path: "/owner/loyalty/points", guard: "authenticated" },
  { name: "LoyaltyDashboard", group: "owner", path: "/owner/loyalty/dashboard", guard: "authenticated" },
  { name: "TierMigration", group: "owner", path: "/owner/loyalty/tiers", guard: "authenticated" },
  // W45 — Activity admin
  { name: "ActivityCatalog", group: "owner", path: "/owner/activities", guard: "authenticated" },
  { name: "ActivityAnalytics", group: "owner", path: "/owner/activities/analytics", guard: "authenticated" },
  // W45 — Campaign admin
  { name: "CampaignList", group: "owner", path: "/owner/campaigns", guard: "authenticated" },
  { name: "CampaignBuilder", group: "owner", path: "/owner/campaigns/new", guard: "authenticated" },
  { name: "CampaignPerformance", group: "owner", path: "/owner/campaigns/performance", guard: "authenticated" },
  // W45 — Transactional templates & Promotions
  { name: "TransactionalTemplates", group: "owner", path: "/owner/templates/transactional", guard: "authenticated" },
  { name: "PromotionAdmin", group: "owner", path: "/owner/promotions", guard: "authenticated" },
  // W46 — Review admin
  { name: "ReviewQueue", group: "owner", path: "/owner/reviews", guard: "authenticated" },
  { name: "ReviewReply", group: "owner", path: "/owner/reviews/reply", guard: "authenticated" },
  { name: "ReviewFlag", group: "owner", path: "/owner/reviews/flag", guard: "authenticated" },
  { name: "ReviewAutomation", group: "owner", path: "/owner/reviews/automation", guard: "authenticated" },
  { name: "ReputationDashboard", group: "owner", path: "/owner/reputation", guard: "authenticated" },
  // W46 — Messaging admin
  { name: "InboxTriage", group: "owner", path: "/owner/inbox/triage", guard: "authenticated" },
  { name: "ThreadAssign", group: "owner", path: "/owner/inbox/assign", guard: "authenticated" },
  { name: "CannedReplies", group: "owner", path: "/owner/replies/canned", guard: "authenticated" },
  { name: "AutoReplyConfig", group: "owner", path: "/owner/autoreply", guard: "authenticated" },
  { name: "MessageArchive", group: "owner", path: "/owner/messages/archive", guard: "authenticated" },
  // W46 — Waitlist admin
  { name: "WaitlistAdminList", group: "owner", path: "/owner/waitlist/admin", guard: "authenticated" },
  { name: "WaitlistConvert", group: "owner", path: "/owner/waitlist/convert", guard: "authenticated" },
  { name: "WaitlistPolicies", group: "owner", path: "/owner/waitlist/policies", guard: "authenticated" },
  // W47 — Analytics & Reporting
  { name: "RevenueDashboard", group: "owner", path: "/owner/analytics/revenue", guard: "authenticated" },
  { name: "BookingFunnel", group: "owner", path: "/owner/analytics/funnel", guard: "authenticated" },
  { name: "StaffProductivity", group: "owner", path: "/owner/analytics/staff", guard: "authenticated" },
  { name: "ServicePerformance", group: "owner", path: "/owner/analytics/services", guard: "authenticated" },
  { name: "ClientRetention", group: "owner", path: "/owner/analytics/retention", guard: "authenticated" },
  { name: "MarketplaceAttribution", group: "owner", path: "/owner/analytics/marketplace", guard: "authenticated" },
  { name: "CustomReportBuilder", group: "owner", path: "/owner/analytics/custom", guard: "authenticated" },
  { name: "ScheduledReports", group: "owner", path: "/owner/analytics/scheduled", guard: "authenticated" },
  { name: "OperatorAuditLog", group: "owner", path: "/owner/analytics/audit", guard: "authenticated" },
  // W48 — AI Admin & Marketplace Tenant Tools
  { name: "AiToggles", group: "owner", path: "/owner/ai/toggles", guard: "authenticated" },
  { name: "AiBudgetConfig", group: "owner", path: "/owner/ai/budget", guard: "authenticated" },
  { name: "AiSuggestionQueue", group: "owner", path: "/owner/ai/suggestions", guard: "authenticated" },
  { name: "AiUsageAnalytics", group: "owner", path: "/owner/ai/usage", guard: "authenticated" },
  { name: "AiAuditLog", group: "owner", path: "/owner/ai/audit", guard: "authenticated" },
  { name: "MarketplacePostComposer", group: "owner", path: "/owner/marketplace/compose", guard: "authenticated" },
  { name: "PerPostPerformance", group: "owner", path: "/owner/marketplace/post-performance", guard: "authenticated" },
  { name: "AntiTheftCompliance", group: "owner", path: "/owner/compliance/anti-theft", guard: "authenticated" },
  // W15-DEBT-1 — Onboarding admin (status dashboard + action buttons)
  { name: "OnboardingAdmin", group: "owner", path: "/owner/onboarding/admin", guard: "authenticated" },
  ...salonOnboardingRoutes,
  ...clientOnboardingRoutes,
  // W49 — Platform Super-Admin, Compliance, Polish & Release Candidate
  { name: "TenantDirectory", group: "platform_admin", path: "/platform/tenants", guard: "platform-admin" },
  { name: "TenantDetail", group: "platform_admin", path: "/platform/tenant/detail", guard: "platform-admin" },
  { name: "SuspendTenant", group: "platform_admin", path: "/platform/tenant/suspend", guard: "platform-admin" },
  { name: "Impersonation", group: "platform_admin", path: "/platform/impersonation", guard: "platform-admin" },
  { name: "CrossTenantAnalytics", group: "platform_admin", path: "/platform/analytics", guard: "platform-admin" },
  { name: "PlatformHealthDashboard", group: "platform_admin", path: "/platform/health", guard: "platform-admin" },
  { name: "PricingPlanManagement", group: "platform_admin", path: "/platform/pricing", guard: "platform-admin" },
  { name: "FeatureFlagConsole", group: "platform_admin", path: "/platform/feature-flags", guard: "platform-admin" },
  { name: "PlatformAuditLog", group: "platform_admin", path: "/platform/audit", guard: "platform-admin" },
  { name: "MarketplaceModerationQueue", group: "platform_admin", path: "/platform/marketplace/moderation", guard: "platform-admin" },
  { name: "CrossTenantAiBudget", group: "platform_admin", path: "/platform/ai/budget", guard: "platform-admin" },
  { name: "MigrationRunner", group: "platform_admin", path: "/platform/migration", guard: "platform-admin" },
  { name: "BackupRestoreStatus", group: "platform_admin", path: "/platform/backup", guard: "platform-admin" },
  { name: "SupportInbox", group: "platform_admin", path: "/platform/support", guard: "platform-admin" },
  { name: "SecurityEventsDashboard", group: "platform_admin", path: "/platform/security/events", guard: "platform-admin" },
  { name: "DataExportRequests", group: "platform_admin", path: "/platform/compliance/data-export", guard: "platform-admin" },
  { name: "ConsentPolicyLog", group: "platform_admin", path: "/platform/compliance/consent", guard: "platform-admin" },
  { name: "IncidentResponse", group: "platform_admin", path: "/platform/compliance/incidents", guard: "platform-admin" },
  { name: "AdminSignIn", group: "platform_admin", path: "/platform/sign-in", guard: "none" },
  { name: "RoleDenied", group: "platform_admin", path: "/role-denied", guard: "none" },
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

export function resolvePreferredRoute(_context: RouteAccessContext): AppRouteDefinition {
  return appRoutes.find((r) => r.name === "AppShell")!;
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
