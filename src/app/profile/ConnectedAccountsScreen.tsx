/**
 * ConnectedAccountsScreen.tsx — I.8 Connected Accounts & Calendar Sync.
 *
 * Sections:
 *  1. SSO providers: Google, Apple, Facebook — Connected/Not connected status pill + action
 *  2. Calendar sync: Google Calendar, Apple Calendar, Outlook — toggle + last-sync timestamp
 *
 * States: default | connecting | connected | sync-error | error
 */

import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Banner, Button, PreferenceToggleRow, colors, radius, spacing, textStyles } from "../../shared/ui";

export type SsoProvider = "google" | "apple" | "facebook";
export type CalendarService = "google-calendar" | "apple-calendar" | "outlook";

export type SsoProviderStatus = {
  provider: SsoProvider;
  connected: boolean;
  /** Email or username shown when connected. */
  connectedAs?: string;
};

export type CalendarSyncStatus = {
  service: CalendarService;
  enabled: boolean;
  lastSync?: string;
  syncError?: string;
};

export type ConnectedAccountsScreenProps = {
  ssoProviders: SsoProviderStatus[];
  calendarServices: CalendarSyncStatus[];
  isError?: boolean;
  onConnectSso: (provider: SsoProvider) => void;
  onDisconnectSso: (provider: SsoProvider) => void;
  onToggleCalendar: (service: CalendarService, enabled: boolean) => void;
  testID?: string;
};

const PROVIDER_LABELS: Record<SsoProvider, string> = {
  google: "Google",
  apple: "Apple",
  facebook: "Facebook",
};

const CALENDAR_LABELS: Record<CalendarService, string> = {
  "google-calendar": "Google Calendar",
  "apple-calendar": "Apple Calendar",
  outlook: "Outlook",
};

export function ConnectedAccountsScreen({
  ssoProviders,
  calendarServices,
  isError,
  onConnectSso,
  onDisconnectSso,
  onToggleCalendar,
  testID,
}: ConnectedAccountsScreenProps) {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      testID={testID}
    >
      {isError ? (
        <Banner
          variant="error"
          message="Failed to load account connections. Please try again."
          testID={testID ? `${testID}-error-banner` : undefined}
        />
      ) : null}

      {/* SSO providers section */}
      <Text style={styles.sectionHeading}>Sign-in methods</Text>
      <View style={styles.card}>
        {ssoProviders.map((item, idx) => (
          <View
            key={item.provider}
            style={[
              styles.accountRow,
              idx < ssoProviders.length - 1 ? styles.rowBorder : null,
            ]}
            testID={testID ? `${testID}-sso-${item.provider}` : undefined}
          >
            <View style={styles.accountInfo}>
              <Text style={styles.accountName}>{PROVIDER_LABELS[item.provider]}</Text>
              {item.connected && item.connectedAs ? (
                <Text style={styles.accountMeta}>{item.connectedAs}</Text>
              ) : null}
            </View>
            <View style={styles.accountRight}>
              <View
                style={[
                  styles.statusPill,
                  item.connected ? styles.statusConnected : styles.statusDisconnected,
                ]}
              >
                <Text
                  style={[
                    styles.statusLabel,
                    item.connected ? styles.statusLabelConnected : null,
                  ]}
                >
                  {item.connected ? "Connected" : "Not connected"}
                </Text>
              </View>
              <Button
                label={item.connected ? "Disconnect" : "Connect"}
                variant={item.connected ? "tertiary" : "secondary"}
                size="small"
                onPress={() =>
                  item.connected
                    ? onDisconnectSso(item.provider)
                    : onConnectSso(item.provider)
                }
                testID={
                  testID
                    ? `${testID}-sso-${item.provider}-${item.connected ? "disconnect" : "connect"}`
                    : undefined
                }
              />
            </View>
          </View>
        ))}
      </View>

      {/* Calendar sync section */}
      <Text style={styles.sectionHeading}>Calendar sync</Text>
      <View style={styles.card}>
        {calendarServices.map((item, idx) => (
          <View
            key={item.service}
            style={[
              styles.calendarRow,
              idx < calendarServices.length - 1 ? styles.rowBorder : null,
            ]}
            testID={testID ? `${testID}-cal-${item.service}` : undefined}
          >
            <PreferenceToggleRow
              label={CALENDAR_LABELS[item.service]}
              helperText={item.lastSync ? `Last synced ${item.lastSync}` : undefined}
              value={item.enabled}
              onValueChange={(val) => onToggleCalendar(item.service, val)}
              testID={testID ? `${testID}-cal-${item.service}-toggle` : undefined}
            />
            {item.syncError ? (
              <Banner
                variant="error"
                message={item.syncError}
                testID={testID ? `${testID}-cal-${item.service}-error` : undefined}
              />
            ) : null}
          </View>
        ))}
      </View>
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
  sectionHeading: {
    ...textStyles.heading4,
    color: colors.foreground,
    marginTop: spacing.s2,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.s4,
    gap: spacing.s3,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  accountInfo: {
    flex: 1,
    gap: spacing.s1,
  },
  accountName: {
    ...textStyles.body,
    color: colors.foreground,
  },
  accountMeta: {
    ...textStyles.labelSmall,
    color: colors.textMuted,
  },
  accountRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s2,
  },
  statusPill: {
    paddingHorizontal: spacing.s2,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusConnected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  statusDisconnected: {
    backgroundColor: colors.disabledBg,
  },
  statusLabel: {
    ...textStyles.labelSmall,
    color: colors.textMuted,
  },
  statusLabelConnected: {
    color: colors.accentForeground,
  },
  calendarRow: {
    padding: spacing.s4,
    gap: spacing.s2,
  },
});
