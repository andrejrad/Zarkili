/**
 * notificationsScreens.test.tsx — W26 Batch F screen tests.
 * Covers: NotificationCenterScreen (F.4), NotificationPreferencesScreen (F.5).
 */

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";

import { NotificationCenterScreen } from "../NotificationCenterScreen";
import { NotificationPreferencesScreen } from "../NotificationPreferencesScreen";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  QUIET_DAYS_ALL,
  QUIET_HOURS_END_DEFAULT,
  QUIET_HOURS_START_DEFAULT,
  type NotificationItem,
} from "../../messaging/messagingHelpers";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const makeNotification = (overrides: Partial<NotificationItem> = {}): NotificationItem => ({
  id: "n1",
  category: "booking",
  title: "Booking confirmed",
  preview: "Tomorrow at 10 AM",
  receivedAt: new Date().toISOString(),
  isRead: false,
  ...overrides,
});

// ---------------------------------------------------------------------------
// NotificationCenterScreen
// ---------------------------------------------------------------------------

describe("NotificationCenterScreen", () => {
  function defaultProps(overrides = {}) {
    return {
      notifications: [makeNotification()],
      activeTab: "all" as const,
      onTabChange: jest.fn(),
      onMarkAllRead: jest.fn(),
      onPressNotification: jest.fn(),
      onDismissNotification: jest.fn(),
      hasPermission: true,
      onEnablePermissions: jest.fn(),
      testID: "notif",
      ...overrides,
    };
  }

  it("renders notification title", () => {
    const { getByText } = render(<NotificationCenterScreen {...defaultProps()} />);
    expect(getByText("Booking confirmed")).toBeTruthy();
  });

  it("renders loading state with testID", () => {
    const { getByTestId } = render(
      <NotificationCenterScreen
        {...defaultProps({ notifications: [], isLoading: true })}
      />,
    );
    expect(getByTestId("notif-loading")).toBeTruthy();
  });

  it("renders empty state with testID", () => {
    const { getByTestId } = render(
      <NotificationCenterScreen {...defaultProps({ notifications: [] })} />,
    );
    expect(getByTestId("notif-empty")).toBeTruthy();
  });

  it("renders permission banner when !hasPermission", () => {
    const { getByTestId } = render(
      <NotificationCenterScreen
        {...defaultProps({ hasPermission: false })}
      />,
    );
    expect(getByTestId("notif-permission-banner")).toBeTruthy();
  });

  it("does not render permission banner when hasPermission", () => {
    const { queryByTestId } = render(
      <NotificationCenterScreen {...defaultProps({ hasPermission: true })} />,
    );
    expect(queryByTestId("notif-permission-banner")).toBeNull();
  });

  it("calls onMarkAllRead when 'Mark all read' pressed", () => {
    const onMarkAllRead = jest.fn();
    const { getByTestId } = render(
      <NotificationCenterScreen {...defaultProps({ onMarkAllRead })} />,
    );
    fireEvent.press(getByTestId("notif-mark-all-read"));
    expect(onMarkAllRead).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// NotificationPreferencesScreen
// ---------------------------------------------------------------------------

describe("NotificationPreferencesScreen", () => {
  function defaultPrefsProps(overrides = {}) {
    return {
      preferences: { ...DEFAULT_NOTIFICATION_PREFERENCES },
      onToggle: jest.fn(),
      quietHoursStart: QUIET_HOURS_START_DEFAULT,
      quietHoursEnd: QUIET_HOURS_END_DEFAULT,
      onQuietHoursStartChange: jest.fn(),
      onQuietHoursEndChange: jest.fn(),
      quietDays: [...QUIET_DAYS_ALL],
      onToggleQuietDay: jest.fn(),
      hasSystemPermission: true,
      onResetDefaults: jest.fn(),
      testID: "prefs",
      ...overrides,
    };
  }

  it("renders booking reminders label", () => {
    const { getAllByText } = render(
      <NotificationPreferencesScreen {...defaultPrefsProps()} />,
    );
    // label appears once per channel section (push/email/sms)
    expect(getAllByText("Booking reminders").length).toBeGreaterThan(0);
  });

  it("renders permission-denied banner when !hasSystemPermission", () => {
    const { getByTestId } = render(
      <NotificationPreferencesScreen
        {...defaultPrefsProps({ hasSystemPermission: false })}
      />,
    );
    expect(getByTestId("prefs-permission-denied-banner")).toBeTruthy();
  });

  it("promotions SMS toggle has TCPA helper text", () => {
    const { getByText } = render(
      <NotificationPreferencesScreen {...defaultPrefsProps()} />,
    );
    expect(getByText(/prior consent/i)).toBeTruthy();
  });

  it("renders reset to defaults button", () => {
    const { getByTestId } = render(
      <NotificationPreferencesScreen {...defaultPrefsProps()} />,
    );
    expect(getByTestId("prefs-reset-defaults")).toBeTruthy();
  });

  it("calls onResetDefaults when reset button pressed", () => {
    const onResetDefaults = jest.fn();
    const { getByTestId } = render(
      <NotificationPreferencesScreen
        {...defaultPrefsProps({ onResetDefaults })}
      />,
    );
    fireEvent.press(getByTestId("prefs-reset-defaults"));
    expect(onResetDefaults).toHaveBeenCalledTimes(1);
  });

  it("renders promotions SMS toggle with testID", () => {
    const { getByTestId } = render(
      <NotificationPreferencesScreen {...defaultPrefsProps()} />,
    );
    expect(getByTestId("prefs-pref-promotions-sms")).toBeTruthy();
  });
});
