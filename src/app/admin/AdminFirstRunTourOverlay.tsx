/**
 * W40 — AdminFirstRunTourOverlay: light-touch coach-mark tour for owners
 * landing in the admin console for the first time. Closes W38-DEBT-10.
 *
 * Uses the existing CoachMark primitive from src/shared/ui/CoachMark.
 * Persists the "hasSeenAdminTour" flag via Firestore so the overlay only
 * shows once per user per tenant.
 *
 * Integration: AppNavigatorShell renders this overlay on the "OwnerHome"
 * route when hasSeenAdminTour=false. After dismiss it calls onComplete which
 * writes the flag to Firestore.
 */
import { useState } from "react";
import { doc, setDoc } from "firebase/firestore";

import { CoachMark } from "../../shared/ui/CoachMark";
import { db } from "../../shared/config/firebase";

// ---------------------------------------------------------------------------
// Tour steps
// ---------------------------------------------------------------------------

const ADMIN_TOUR_STEPS = [
  {
    title: "Welcome to your admin console",
    body: "Manage your salon, staff, bookings, and payments all from one place.",
  },
  {
    title: "Your owner dashboard",
    body: "See today's revenue, bookings, and occupancy at a glance. Tap any KPI for details.",
  },
  {
    title: "Settings & billing",
    body: "Configure your business profile, brand, tax settings, and subscription in Settings.",
  },
  {
    title: "Locations & staff",
    body: "Add locations, manage rooms and resources, and set staff schedules in Locations.",
  },
  {
    title: "You're all set",
    body: "Explore the console at your own pace. Tap the ? icon any time to re-open this tour.",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function persistTourSeen(userId: string, tenantId: string): Promise<void> {
  // Writes to users/{userId}/tenantPrefs/{tenantId} — no security issue:
  // users can only write their own prefs (enforced by Firestore rules).
  await setDoc(
    doc(db, "users", userId, "tenantPrefs", tenantId),
    { hasSeenAdminTour: true },
    { merge: true }
  );
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AdminFirstRunTourOverlayProps = {
  visible: boolean;
  userId: string;
  tenantId: string;
  onComplete: () => void;
  testID?: string;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AdminFirstRunTourOverlay({
  visible,
  userId,
  tenantId,
  onComplete,
  testID,
}: AdminFirstRunTourOverlayProps) {
  const [step, setStep] = useState(0);

  function handleComplete() {
    setStep(0);
    void persistTourSeen(userId, tenantId).catch(() => {
      // Non-critical — if persist fails the tour will show again next visit.
    });
    onComplete();
  }

  function handleNext() {
    if (step < ADMIN_TOUR_STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      handleComplete();
    }
  }

  function handleSkip() {
    handleComplete();
  }

  const currentStep = ADMIN_TOUR_STEPS[step];

  return (
    <CoachMark
      visible={visible}
      step={step}
      totalSteps={ADMIN_TOUR_STEPS.length}
      title={currentStep.title}
      body={currentStep.body}
      primaryLabel={step < ADMIN_TOUR_STEPS.length - 1 ? "Next" : "Get started"}
      onNext={handleNext}
      onSkip={handleSkip}
      testID={testID ?? "admin-first-run-tour"}
    />
  );
}
