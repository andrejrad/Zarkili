/**
 * MarketingConsentScreen.tsx — I.2 Marketing Consent Management.
 *
 * Sectioned list of toggleable consent preferences with required
 * CAN-SPAM, TCPA, and CCPA disclosures rendered inline.
 * States: default | saving | saved | error.
 */

import { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Banner, Button, ConsentToggleList, colors, spacing, textStyles } from "../../shared/ui";
import type { ConsentItem } from "../../shared/ui";

export type MarketingConsentState = "default" | "saving" | "saved" | "error";

export type MarketingConsentScreenProps = {
  /** Whether the user is in CA or a state with applicable opt-out laws. */
  isCaResident?: boolean;
  initialConsents: Record<string, boolean>;
  onSave: (consents: Record<string, boolean>) => Promise<void>;
  testID?: string;
};

function buildItems(
  values: Record<string, boolean>,
  isCaResident: boolean
): ConsentItem[] {
  return [
    {
      id: "marketing-email",
      label: "Marketing emails",
      helperText: "Promotions, offers, and salon highlights",
      disclosure:
        "CAN-SPAM Act: You may unsubscribe at any time using the link in any email we send.",
      value: values["marketing-email"] ?? true,
    },
    {
      id: "marketing-sms",
      label: "Marketing SMS",
      helperText: "Text promotions and appointment reminders",
      disclosure:
        "TCPA: Message & data rates may apply. Reply STOP to unsubscribe at any time.",
      value: values["marketing-sms"] ?? true,
    },
    {
      id: "push-promotions",
      label: "Push promotions",
      helperText: "Promotional push notifications",
      value: values["push-promotions"] ?? true,
    },
    {
      id: "personalized",
      label: "Personalized recommendations",
      helperText: "We use your booking history and preferences to tailor suggestions.",
      disclosure:
        "Personalization is based on your activity data as described in our Privacy Policy.",
      value: values["personalized"] ?? true,
    },
    ...(isCaResident
      ? [
          {
            id: "third-party",
            label: "Third-party data sharing",
            helperText: "Share data with our advertising and analytics partners",
            disclosure:
              "CCPA: California residents may opt out of the sale or sharing of personal information.",
            value: values["third-party"] ?? false,
          } satisfies ConsentItem,
        ]
      : []),
  ];
}

export function MarketingConsentScreen({
  isCaResident = false,
  initialConsents,
  onSave,
  testID,
}: MarketingConsentScreenProps) {
  const [consents, setConsents] = useState<Record<string, boolean>>(initialConsents);
  const [screenState, setScreenState] = useState<MarketingConsentState>("default");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  function handleToggle(id: string, value: boolean) {
    setConsents((prev) => ({ ...prev, [id]: value }));
    setScreenState("default");
  }

  async function handleSave() {
    setScreenState("saving");
    try {
      await onSave(consents);
      setScreenState("saved");
      toastTimer.current = setTimeout(() => setScreenState("default"), 2000);
    } catch {
      setScreenState("error");
    }
  }

  const items = buildItems(consents, isCaResident);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      testID={testID}
    >
      <Text style={styles.heading}>Communication preferences</Text>
      <Text style={styles.subheading}>
        Manage how Zarkili contacts you with promotions and recommendations.
      </Text>

      {screenState === "error" ? (
        <Banner
          variant="error"
          message="Failed to save preferences. Please try again."
          testID={testID ? `${testID}-error-banner` : undefined}
        />
      ) : null}

      {screenState === "saved" ? (
        <Banner
          variant="success"
          message="Preferences saved."
          testID={testID ? `${testID}-saved-banner` : undefined}
        />
      ) : null}

      <ConsentToggleList
        items={items}
        onToggle={handleToggle}
        saving={screenState === "saving"}
        testID={testID ? `${testID}-list` : undefined}
      />

      <Button
        label={screenState === "saving" ? "Saving..." : "Save preferences"}
        variant="primary"
        disabled={screenState === "saving"}
        loading={screenState === "saving"}
        onPress={handleSave}
        testID={testID ? `${testID}-save` : undefined}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.pageHorizontal,
    paddingBottom: spacing.s12,
    gap: spacing.s4,
  },
  heading: {
    ...textStyles.heading2,
    color: colors.foreground,
  },
  subheading: {
    ...textStyles.body,
    color: colors.textMuted,
  },
});
