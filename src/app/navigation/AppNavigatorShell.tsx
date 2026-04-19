import { useEffect, useMemo, useState } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useAuth } from "../providers/AuthProvider";
import { useTenant } from "../providers/TenantProvider";
import type { TenantMembership } from "../../domains/auth";
import { featureFlags } from "../../shared/config/featureFlags";

import {
  appRoutes,
  canAccessRoute,
  getAccessibleRoutes,
  resolvePreferredRoute,
  resolveRouteFromPath,
} from "./routes";
import {
  getNextOnboardingStep,
  onboardingStepLabels,
  type OnboardingFlow,
  type OnboardingProgressPersistence,
  type OnboardingStep,
} from "./onboarding/contracts";
import { createFirestoreOnboardingProgressPersistence } from "./onboarding/createPersistence";
import { listActiveTenantMembershipsForUser } from "./tenantMemberships";

type AppNavigatorShellProps = {
  onboardingProgressPersistence?: OnboardingProgressPersistence;
  listTenantMemberships?: (userId: string) => Promise<TenantMembership[]>;
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

export function AppNavigatorShell({
  onboardingProgressPersistence,
  listTenantMemberships,
}: AppNavigatorShellProps) {
  const { userId, signInAsDev, signOut } = useAuth();
  const { tenantId, setTenantId } = useTenant();
  const [activeRouteName, setActiveRouteName] = useState("Landing");
  const [completedStepsByFlow, setCompletedStepsByFlow] = useState<
    Partial<Record<OnboardingFlow, OnboardingStep[]>>
  >({});
  const [onboardingGuardMessage, setOnboardingGuardMessage] = useState<string | null>(null);
  const [availableMemberships, setAvailableMemberships] = useState<TenantMembership[]>([]);
  const [membershipsLoading, setMembershipsLoading] = useState(false);

  const persistence = useMemo(
    () => onboardingProgressPersistence ?? createFirestoreOnboardingProgressPersistence(),
    [onboardingProgressPersistence]
  );
  const membershipsLoader = useMemo(
    () => listTenantMemberships ?? listActiveTenantMembershipsForUser,
    [listTenantMemberships]
  );

  const preferredRoute = resolvePreferredRoute({ userId });
  const accessibleRoutes = getAccessibleRoutes({ userId });

  const activeRoute = useMemo(
    () => appRoutes.find((route) => route.name === activeRouteName) ?? preferredRoute,
    [activeRouteName, preferredRoute]
  );

  useEffect(() => {
    if (!isWebRuntime()) {
      return;
    }

    const resolution = resolveRouteFromPath(getWebPathname(), { userId });
    setActiveRouteName(resolution.resolvedRoute.name);
    if (resolution.requestedPath !== resolution.resolvedRoute.path) {
      replaceWebHistoryPath(resolution.resolvedRoute.path);
    }

    const onPopState = () => {
      const popResolution = resolveRouteFromPath(getWebPathname(), { userId });
      setActiveRouteName(popResolution.resolvedRoute.name);
      if (popResolution.requestedPath !== popResolution.resolvedRoute.path) {
        replaceWebHistoryPath(popResolution.resolvedRoute.path);
      }
    };

    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, [userId]);

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
    if (!canAccessRoute(activeRoute, { userId })) {
      setActiveRouteName(preferredRoute.name);
    }
  }, [activeRoute, preferredRoute, userId]);

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
      setOnboardingGuardMessage("Select tenant context before onboarding.");
    }
  }, [activeRoute, tenantId]);

  function navigate(routeName: string) {
    const candidate = appRoutes.find((route) => route.name === routeName);
    if (!candidate) {
      return;
    }

    if (!canAccessRoute(candidate, { userId })) {
      setActiveRouteName(preferredRoute.name);
      return;
    }

    setActiveRouteName(candidate.name);
  }

  function completeDevSignIn() {
    signInAsDev();
    setActiveRouteName("AppShell");
  }

  function getOnboardingGuardMessage(): string {
    if (membershipsLoading) {
      return "Loading tenant memberships.";
    }

    if (availableMemberships.length === 0) {
      return "No active tenant memberships found for this user.";
    }

    return "Select tenant context before onboarding.";
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
      setOnboardingGuardMessage("Selected tenant is not available in active memberships.");
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
          <Text style={styles.screenTitle}>Welcome to Zarkili</Text>
          <Text style={styles.screenBody}>Choose how you want to continue.</Text>
          <TouchableOpacity accessibilityRole="button" onPress={() => navigate("Login")} style={styles.button}>
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" onPress={() => navigate("Register")} style={styles.buttonSecondary}>
            <Text style={styles.buttonText}>Create account</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => navigate("DiscoverBusinesses")}
            style={styles.buttonSecondary}
          >
            <Text style={styles.buttonText}>Discover businesses</Text>
          </TouchableOpacity>
        </>
      );
    }

    if (activeRoute.name === "Login") {
      return (
        <>
          <Text style={styles.screenTitle}>Login</Text>
          <Text style={styles.screenBody}>Auth placeholder flow for Week 1.</Text>
          <TouchableOpacity accessibilityRole="button" onPress={completeDevSignIn} style={styles.button}>
            <Text style={styles.buttonText}>Sign in as dev user</Text>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" onPress={() => navigate("Landing")} style={styles.buttonSecondary}>
            <Text style={styles.buttonText}>Back</Text>
          </TouchableOpacity>
        </>
      );
    }

    if (activeRoute.name === "Register") {
      return (
        <>
          <Text style={styles.screenTitle}>Register</Text>
          <Text style={styles.screenBody}>Registration placeholder flow for Week 1.</Text>
          <TouchableOpacity accessibilityRole="button" onPress={completeDevSignIn} style={styles.button}>
            <Text style={styles.buttonText}>Create account (dev)</Text>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" onPress={() => navigate("Landing")} style={styles.buttonSecondary}>
            <Text style={styles.buttonText}>Back</Text>
          </TouchableOpacity>
        </>
      );
    }

    if (activeRoute.name === "DiscoverBusinesses") {
      return (
        <>
          <Text style={styles.screenTitle}>Discover businesses</Text>
          {featureFlags.marketplaceEnabled ? (
            <Text style={styles.screenBody}>Marketplace placeholder route is enabled.</Text>
          ) : (
            <Text style={styles.screenBody}>Coming soon. Marketplace is currently disabled by feature flag.</Text>
          )}
          <TouchableOpacity accessibilityRole="button" onPress={() => navigate("Landing")} style={styles.buttonSecondary}>
            <Text style={styles.buttonText}>Back</Text>
          </TouchableOpacity>
        </>
      );
    }

    const onboardingRoute = parseOnboardingRoute();
    if (onboardingRoute) {
      const flowLabel = onboardingRoute.flow === "salon" ? "Salon" : "Client";
      return (
        <>
          <Text style={styles.screenTitle}>{flowLabel} onboarding</Text>
          <Text style={styles.screenBody}>
            Placeholder step: {onboardingStepLabels[onboardingRoute.step]}
          </Text>
          <TouchableOpacity accessibilityRole="button" onPress={() => void goToNextOnboardingStep()} style={styles.button}>
            <Text style={styles.buttonText}>Next step</Text>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" onPress={() => navigate("AppShell")} style={styles.buttonSecondary}>
            <Text style={styles.buttonText}>Exit onboarding</Text>
          </TouchableOpacity>
        </>
      );
    }

    return (
      <>
        <Text style={styles.screenTitle}>App shell</Text>
        <Text style={styles.screenBody}>Protected area placeholder for authenticated users.</Text>
        <Text style={styles.screenBody}>Tenant context: {tenantId ?? "none"}</Text>
        {membershipsLoading ? <Text style={styles.screenBody}>Loading memberships...</Text> : null}
        {!membershipsLoading && availableMemberships.length === 0 ? (
          <Text style={styles.screenBody}>No active memberships available.</Text>
        ) : null}
        {!membershipsLoading && availableMemberships.length > 1
          ? availableMemberships.map((membership) => (
              <TouchableOpacity
                key={membership.membershipId}
                accessibilityRole="button"
                onPress={() => selectTenantContext(membership.tenantId)}
                style={styles.buttonSecondary}
              >
                <Text style={styles.buttonText}>Select tenant {membership.tenantId}</Text>
              </TouchableOpacity>
            ))
          : null}
        {onboardingGuardMessage ? (
          <Text style={styles.guardText}>{onboardingGuardMessage}</Text>
        ) : null}
        <TouchableOpacity accessibilityRole="button" onPress={() => void navigateToOnboardingFlow("salon")} style={styles.button}>
          <Text style={styles.buttonText}>Start salon onboarding</Text>
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" onPress={() => void navigateToOnboardingFlow("client")} style={styles.buttonSecondary}>
          <Text style={styles.buttonText}>Start client onboarding</Text>
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" onPress={signOut} style={styles.buttonSecondary}>
          <Text style={styles.buttonText}>Sign out</Text>
        </TouchableOpacity>
      </>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.container}>
        <Text style={styles.title}>Zarkili</Text>
        <Text style={styles.subtitle}>Current route: {activeRoute.name}</Text>
        <Text style={styles.caption}>Accessible routes: {accessibleRoutes.map((route) => route.name).join(", ")}</Text>
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
