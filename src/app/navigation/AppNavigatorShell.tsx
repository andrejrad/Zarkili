import { useEffect, useMemo, useState } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import type { AiBudgetAdminService, UpdateAiBudgetConfigInput } from "../../domains/ai";
import { useAuth } from "../providers/AuthProvider";
import { useLanguage } from "../providers/LanguageProvider";
import { useTenant } from "../providers/TenantProvider";
import type { TenantMembership } from "../../domains/auth";
import { featureFlags } from "../../shared/config/featureFlags";
import { OwnerAiBudgetSettingsScreen } from "../settings/OwnerAiBudgetSettingsScreen";

import {
  appRoutes,
  canAccessRoute,
  getAccessibleRoutes,
  resolvePreferredRoute,
  resolveRouteFromPath,
} from "./routes";
import {
  getNextOnboardingStep,
  type OnboardingFlow,
  type OnboardingProgressPersistence,
  type OnboardingStep,
} from "./onboarding/contracts";
import { createFirestoreOnboardingProgressPersistence } from "./onboarding/createPersistence";
import { listActiveTenantMembershipsForUser } from "./tenantMemberships";

type AppNavigatorShellProps = {
  onboardingProgressPersistence?: OnboardingProgressPersistence;
  listTenantMemberships?: (userId: string) => Promise<TenantMembership[]>;
  aiBudgetAdminService?: AiBudgetAdminService | null;
  isPlatformAdminUser?: (userId: string) => Promise<boolean>;
};

function isWebRuntime(): boolean {
  return Platform.OS === "web";
}

function getWebPathname(): string {
  if (!isWebRuntime() || typeof window === "undefined") {
    return "/";
  }

  return window.location.pathname || "/";
}

function replaceWebHistoryPath(path: string): void {
  if (!isWebRuntime() || typeof window === "undefined") {
    return;
  }

  if (window.history && typeof window.history.replaceState === "function") {
    window.history.replaceState(null, "", path);
  }
}

function pushWebHistoryPath(path: string): void {
  if (!isWebRuntime() || typeof window === "undefined") {
    return;
  }

  if (window.history && typeof window.history.pushState === "function") {
    window.history.pushState(null, "", path);
  }
}

function stepToRouteName(flow: OnboardingFlow, step: OnboardingStep): string {
  const routeNamePrefix = flow === "salon" ? "SalonOnboarding" : "ClientOnboarding";
  return `${routeNamePrefix}${step
    .split("-")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join("")}`;
}

function toOnboardingStepLabelKey(step: OnboardingStep):
  | "onboarding.step.account"
  | "onboarding.step.business-profile"
  | "onboarding.step.payment-setup"
  | "onboarding.step.services"
  | "onboarding.step.staff"
  | "onboarding.step.policies"
  | "onboarding.step.availability"
  | "onboarding.step.marketplace"
  | "onboarding.step.verification"
  | "onboarding.step.account-guest"
  | "onboarding.step.phone-verify"
  | "onboarding.step.profile"
  | "onboarding.step.payment-method"
  | "onboarding.step.preferences"
  | "onboarding.step.notifications"
  | "onboarding.step.loyalty" {
  return `onboarding.step.${step}` as
    | "onboarding.step.account"
    | "onboarding.step.business-profile"
    | "onboarding.step.payment-setup"
    | "onboarding.step.services"
    | "onboarding.step.staff"
    | "onboarding.step.policies"
    | "onboarding.step.availability"
    | "onboarding.step.marketplace"
    | "onboarding.step.verification"
    | "onboarding.step.account-guest"
    | "onboarding.step.phone-verify"
    | "onboarding.step.profile"
    | "onboarding.step.payment-method"
    | "onboarding.step.preferences"
    | "onboarding.step.notifications"
    | "onboarding.step.loyalty";
}

export function AppNavigatorShell({
  onboardingProgressPersistence,
  listTenantMemberships,
  aiBudgetAdminService,
  isPlatformAdminUser,
}: AppNavigatorShellProps) {
  const { userId, signInAsDev, signOut } = useAuth();
  const { t } = useLanguage();
  const { tenantId, setTenantId } = useTenant();
  const [activeRouteName, setActiveRouteName] = useState("Landing");
  const [completedStepsByFlow, setCompletedStepsByFlow] = useState<
    Partial<Record<OnboardingFlow, OnboardingStep[]>>
  >({});
  const [onboardingGuardMessage, setOnboardingGuardMessage] = useState<string | null>(null);
  const [availableMemberships, setAvailableMemberships] = useState<TenantMembership[]>([]);
  const [membershipsLoading, setMembershipsLoading] = useState(false);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);

  const settingsService = useMemo(
    () =>
      aiBudgetAdminService
        ? {
            getBudgetConfigForAdmin: (actor: { userId: string }) =>
              aiBudgetAdminService.getBudgetConfigForAdmin(actor),
            listBudgetAuditLogsForAdmin: (
              actor: { userId: string },
              input: {
                limit?: number;
                eventType?: string;
                targetPath?: string;
                nextPageToken?: string;
              }
            ) => aiBudgetAdminService.listBudgetAuditLogsForAdmin(actor, input),
            updateBudgetConfigForAdmin: (
              actor: { userId: string },
              input: UpdateAiBudgetConfigInput
            ) => aiBudgetAdminService.updateBudgetConfigForAdmin(actor, input),
          }
        : null,
    [aiBudgetAdminService]
  );

  const persistence = useMemo(
    () => onboardingProgressPersistence ?? createFirestoreOnboardingProgressPersistence(),
    [onboardingProgressPersistence]
  );
  const membershipsLoader = useMemo(
    () => listTenantMemberships ?? listActiveTenantMembershipsForUser,
    [listTenantMemberships]
  );

  const routeContext = useMemo(
    () => ({
      userId,
      isPlatformAdmin,
    }),
    [isPlatformAdmin, userId]
  );

  const preferredRoute = resolvePreferredRoute(routeContext);
  const accessibleRoutes = getAccessibleRoutes(routeContext);

  const activeRoute = useMemo(
    () => appRoutes.find((route) => route.name === activeRouteName) ?? preferredRoute,
    [activeRouteName, preferredRoute]
  );

  useEffect(() => {
    if (!isWebRuntime()) {
      return;
    }

    const resolution = resolveRouteFromPath(getWebPathname(), routeContext);
    setActiveRouteName(resolution.resolvedRoute.name);
    if (resolution.requestedPath !== resolution.resolvedRoute.path) {
      replaceWebHistoryPath(resolution.resolvedRoute.path);
    }

    const onPopState = () => {
      const popResolution = resolveRouteFromPath(getWebPathname(), routeContext);
      setActiveRouteName(popResolution.resolvedRoute.name);
      if (popResolution.requestedPath !== popResolution.resolvedRoute.path) {
        replaceWebHistoryPath(popResolution.resolvedRoute.path);
      }
    };

    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, [routeContext]);

  useEffect(() => {
    if (!isWebRuntime()) {
      return;
    }

    const currentPath = getWebPathname();
    if (currentPath !== activeRoute.path) {
      pushWebHistoryPath(activeRoute.path);
    }
  }, [activeRoute.path]);

  useEffect(() => {
    if (!canAccessRoute(activeRoute, routeContext)) {
      setActiveRouteName(preferredRoute.name);
    }
  }, [activeRoute, preferredRoute, routeContext]);

  useEffect(() => {
    let cancelled = false;

    async function resolvePlatformAdmin() {
      if (!userId) {
        setIsPlatformAdmin(false);
        return;
      }

      try {
        const resolver = isPlatformAdminUser;
        if (!resolver) {
          if (!cancelled) {
            setIsPlatformAdmin(false);
          }
          return;
        }

        const nextValue = await resolver(userId);
        if (!cancelled) {
          setIsPlatformAdmin(nextValue);
        }
      } catch {
        if (!cancelled) {
          setIsPlatformAdmin(false);
        }
      }
    }

    void resolvePlatformAdmin();

    return () => {
      cancelled = true;
    };
  }, [isPlatformAdminUser, userId]);

  useEffect(() => {
    let cancelled = false;

    async function loadMemberships() {
      if (!userId) {
        setAvailableMemberships([]);
        setMembershipsLoading(false);
        return;
      }

      setMembershipsLoading(true);
      try {
        const memberships = await membershipsLoader(userId);
        if (!cancelled) {
          setAvailableMemberships(memberships);
        }
      } catch {
        if (!cancelled) {
          setAvailableMemberships([]);
        }
      } finally {
        if (!cancelled) {
          setMembershipsLoading(false);
        }
      }
    }

    void loadMemberships();

    return () => {
      cancelled = true;
    };
  }, [membershipsLoader, userId]);

  useEffect(() => {
    if (!tenantId && availableMemberships.length === 1) {
      setTenantId(availableMemberships[0].tenantId);
      return;
    }

    if (tenantId && !availableMemberships.some((membership) => membership.tenantId === tenantId)) {
      setTenantId(null);
    }
  }, [availableMemberships, setTenantId, tenantId]);

  useEffect(() => {
    const segments = activeRoute.path.split("/").filter(Boolean);
    const isOnboardingRoute = segments.length === 3 && segments[0] === "onboarding";
    if (isOnboardingRoute && !tenantId) {
      setActiveRouteName("AppShell");
      setOnboardingGuardMessage(t("onboarding.guard.selectTenant"));
    }
  }, [activeRoute, t, tenantId]);

  function navigate(routeName: string) {
    const candidate = appRoutes.find((route) => route.name === routeName);
    if (!candidate) {
      return;
    }

    if (!canAccessRoute(candidate, routeContext)) {
      setActiveRouteName(preferredRoute.name);
      return;
    }

    setActiveRouteName(candidate.name);
  }

  function openOwnerAiBudgetSettings() {
    navigate("OwnerAiBudgetSettings");
  }

  function completeDevSignIn() {
    signInAsDev();
    setActiveRouteName("AppShell");
  }

  function getOnboardingGuardMessage(): string {
    if (membershipsLoading) {
      return t("membership.loading");
    }

    if (availableMemberships.length === 0) {
      return t("onboarding.guard.noMemberships");
    }

    return t("onboarding.guard.selectTenant");
  }

  function selectTenantContext(nextTenantId: string) {
    setTenantId(nextTenantId);
    setOnboardingGuardMessage(null);
  }

  async function navigateToOnboardingFlow(flow: OnboardingFlow) {
    if (!userId || !tenantId) {
      setOnboardingGuardMessage(getOnboardingGuardMessage());
      return;
    }

    if (!availableMemberships.some((membership) => membership.tenantId === tenantId)) {
      setOnboardingGuardMessage(t("onboarding.guard.selectedTenantInvalid"));
      return;
    }

    setOnboardingGuardMessage(null);

    const onboardingTenantId = tenantId;

    try {
      const resumedState = await persistence.resumeDraft({
        tenantId: onboardingTenantId,
        userId,
        flow,
      });

      if (resumedState) {
        setCompletedStepsByFlow((current) => ({
          ...current,
          [flow]: resumedState.completedSteps,
        }));
        navigate(stepToRouteName(flow, resumedState.currentStep));
        return;
      }
    } catch {
      // Keep route fallback deterministic even if persistence fails.
    }

    const firstRouteName = flow === "salon" ? "SalonOnboardingAccount" : "ClientOnboardingAccountGuest";
    setCompletedStepsByFlow((current) => ({
      ...current,
      [flow]: [],
    }));
    navigate(firstRouteName);
  }

  function parseOnboardingRoute(): { flow: OnboardingFlow; step: OnboardingStep } | null {
    const segments = activeRoute.path.split("/").filter(Boolean);
    if (segments.length !== 3 || segments[0] !== "onboarding") {
      return null;
    }

    const flowSegment = segments[1];
    const stepSegment = segments[2] as OnboardingStep;
    if (flowSegment !== "salon" && flowSegment !== "client") {
      return null;
    }

    return {
      flow: flowSegment,
      step: stepSegment,
    };
  }

  async function goToNextOnboardingStep() {
    const parsed = parseOnboardingRoute();
    if (!parsed || !userId || !tenantId) {
      return;
    }

    const onboardingTenantId = tenantId;
    const completedSteps = completedStepsByFlow[parsed.flow] ?? [];
    const nextCompletedSteps = Array.from(new Set([...completedSteps, parsed.step]));

    const nextStep = getNextOnboardingStep(parsed.flow, parsed.step);
    const persistedCurrentStep = nextStep ?? parsed.step;

    try {
      await persistence.saveDraft({
        tenantId: onboardingTenantId,
        userId,
        flow: parsed.flow,
        currentStep: persistedCurrentStep,
        completedSteps: nextCompletedSteps,
      });
    } catch {
      // Continue navigation for scaffold behavior even when persistence is unavailable.
    }

    setCompletedStepsByFlow((current) => ({
      ...current,
      [parsed.flow]: nextCompletedSteps,
    }));

    if (!nextStep) {
      navigate("AppShell");
      return;
    }

    navigate(stepToRouteName(parsed.flow, nextStep));
  }

  function renderRouteContent() {
    if (activeRoute.name === "Landing") {
      return (
        <>
          <Text style={styles.screenTitle}>{t("landing.welcome")}</Text>
          <Text style={styles.screenBody}>{t("landing.chooseAction")}</Text>
          <TouchableOpacity accessibilityRole="button" onPress={() => navigate("Login")} style={styles.button}>
            <Text style={styles.buttonText}>{t("action.login")}</Text>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" onPress={() => navigate("Register")} style={styles.buttonSecondary}>
            <Text style={styles.buttonText}>{t("action.createAccount")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => navigate("DiscoverBusinesses")}
            style={styles.buttonSecondary}
          >
            <Text style={styles.buttonText}>{t("action.discoverBusinesses")}</Text>
          </TouchableOpacity>
        </>
      );
    }

    if (activeRoute.name === "Login") {
      return (
        <>
          <Text style={styles.screenTitle}>{t("auth.login.title")}</Text>
          <Text style={styles.screenBody}>{t("auth.login.placeholder")}</Text>
          <TouchableOpacity accessibilityRole="button" onPress={completeDevSignIn} style={styles.button}>
            <Text style={styles.buttonText}>{t("auth.signInAsDev")}</Text>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" onPress={() => navigate("Landing")} style={styles.buttonSecondary}>
            <Text style={styles.buttonText}>{t("action.back")}</Text>
          </TouchableOpacity>
        </>
      );
    }

    if (activeRoute.name === "Register") {
      return (
        <>
          <Text style={styles.screenTitle}>{t("auth.register.title")}</Text>
          <Text style={styles.screenBody}>{t("auth.register.placeholder")}</Text>
          <TouchableOpacity accessibilityRole="button" onPress={completeDevSignIn} style={styles.button}>
            <Text style={styles.buttonText}>{t("auth.createAccountDev")}</Text>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" onPress={() => navigate("Landing")} style={styles.buttonSecondary}>
            <Text style={styles.buttonText}>{t("action.back")}</Text>
          </TouchableOpacity>
        </>
      );
    }

    if (activeRoute.name === "DiscoverBusinesses") {
      return (
        <>
          <Text style={styles.screenTitle}>{t("discover.title")}</Text>
          {featureFlags.marketplaceEnabled ? (
            <Text style={styles.screenBody}>{t("discover.enabled")}</Text>
          ) : (
            <Text style={styles.screenBody}>{t("discover.comingSoon")}</Text>
          )}
          <TouchableOpacity accessibilityRole="button" onPress={() => navigate("Landing")} style={styles.buttonSecondary}>
            <Text style={styles.buttonText}>{t("action.back")}</Text>
          </TouchableOpacity>
        </>
      );
    }

    const onboardingRoute = parseOnboardingRoute();
    if (onboardingRoute) {
      const flowLabel = onboardingRoute.flow === "salon" ? t("onboarding.salon") : t("onboarding.client");
      return (
        <>
          <Text style={styles.screenTitle}>{`${flowLabel} onboarding`}</Text>
          <Text style={styles.screenBody}>
            {t("onboarding.placeholderStep", {
              step: t(toOnboardingStepLabelKey(onboardingRoute.step)),
            })}
          </Text>
          <TouchableOpacity accessibilityRole="button" onPress={() => void goToNextOnboardingStep()} style={styles.button}>
            <Text style={styles.buttonText}>{t("action.nextStep")}</Text>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" onPress={() => navigate("AppShell")} style={styles.buttonSecondary}>
            <Text style={styles.buttonText}>{t("action.exitOnboarding")}</Text>
          </TouchableOpacity>
        </>
      );
    }

    if (activeRoute.name === "OwnerAiBudgetSettings") {
      return (
        <OwnerAiBudgetSettingsScreen
          userId={userId}
          service={settingsService}
          onBack={() => navigate("AppShell")}
        />
      );
    }

    return (
      <>
        <Text style={styles.screenTitle}>{t("appShell.title")}</Text>
        <Text style={styles.screenBody}>{t("appShell.protectedPlaceholder")}</Text>
        <Text style={styles.screenBody}>{t("appShell.tenantContext", { tenantId: tenantId ?? "none" })}</Text>
        {membershipsLoading ? <Text style={styles.screenBody}>{t("membership.loading")}</Text> : null}
        {!membershipsLoading && availableMemberships.length === 0 ? (
          <Text style={styles.screenBody}>{t("membership.none")}</Text>
        ) : null}
        {!membershipsLoading && availableMemberships.length > 1
          ? availableMemberships.map((membership) => (
              <TouchableOpacity
                key={membership.membershipId}
                accessibilityRole="button"
                onPress={() => selectTenantContext(membership.tenantId)}
                style={styles.buttonSecondary}
              >
                <Text style={styles.buttonText}>{t("membership.selectTenant", { tenantId: membership.tenantId })}</Text>
              </TouchableOpacity>
            ))
          : null}
        {onboardingGuardMessage ? (
          <Text style={styles.guardText}>{onboardingGuardMessage}</Text>
        ) : null}
        <TouchableOpacity accessibilityRole="button" onPress={() => void navigateToOnboardingFlow("salon")} style={styles.button}>
          <Text style={styles.buttonText}>{t("onboarding.startSalon")}</Text>
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" onPress={() => void navigateToOnboardingFlow("client")} style={styles.buttonSecondary}>
          <Text style={styles.buttonText}>{t("onboarding.startClient")}</Text>
        </TouchableOpacity>
        {isPlatformAdmin ? (
          <TouchableOpacity accessibilityRole="button" onPress={openOwnerAiBudgetSettings} style={styles.buttonSecondary}>
            <Text style={styles.buttonText}>Owner AI budget settings</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity accessibilityRole="button" onPress={signOut} style={styles.buttonSecondary}>
          <Text style={styles.buttonText}>{t("auth.signOut")}</Text>
        </TouchableOpacity>
      </>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.container}>
        <Text style={styles.title}>{t("app.title")}</Text>
        <Text style={styles.subtitle}>{t("app.currentRoute", { route: activeRoute.name })}</Text>
        <Text style={styles.caption}>{t("app.accessibleRoutes", { routes: accessibleRoutes.map((route) => route.name).join(", ") })}</Text>
        {renderRouteContent()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: "100%",
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  container: {
    width: "100%",
    maxWidth: Platform.OS === "web" ? 720 : undefined,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    color: "#4b5563",
  },
  caption: {
    marginTop: 8,
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 18,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  screenBody: {
    marginTop: 8,
    fontSize: 15,
    color: "#4b5563",
    textAlign: "center",
  },
  button: {
    marginTop: 16,
    backgroundColor: "#111827",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonSecondary: {
    marginTop: 12,
    backgroundColor: "#374151",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: "#f9fafb",
    fontWeight: "600",
  },
  guardText: {
    marginTop: 10,
    fontSize: 13,
    color: "#7f1d1d",
    textAlign: "center",
  },
});
