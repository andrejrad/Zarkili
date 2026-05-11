/**
 * messagingHelpers.test.ts — W26 Batch F helper tests.
 * Covers thread filtering, formatting, notification grouping, TCPA/CAN-SPAM
 * defaults, quiet-hours logic, and waitlist formatting.
 */

import {
  CAN_SPAM_UNSUBSCRIBE_COPY,
  DEFAULT_NOTIFICATION_PREFERENCES,
  QUIET_HOURS_END_DEFAULT,
  QUIET_HOURS_START_DEFAULT,
  categorizeNotificationDate,
  countUnreadThreads,
  filterNotificationsByTab,
  filterThreadsByTab,
  formatMessageTime,
  formatPositionLabel,
  formatThreadDate,
  formatWaitlistCountdown,
  groupNotificationsByDate,
  isInQuietHours,
  type NotificationItem,
  type ThreadSummary,
} from "../messagingHelpers";

// ---------------------------------------------------------------------------
// Thread filtering
// ---------------------------------------------------------------------------

const makeThread = (overrides: Partial<ThreadSummary> = {}): ThreadSummary => ({
  id: "t1",
  salonId: "s1",
  salonName: "Test Salon",
  lastMessage: "Hello",
  lastMessageAt: new Date().toISOString(),
  unreadCount: 0,
  isArchived: false,
  isMuted: false,
  isBlocked: false,
  ...overrides,
});

describe("filterThreadsByTab", () => {
  it("returns all threads for 'all' tab", () => {
    const threads = [makeThread({ id: "a" }), makeThread({ id: "b" })];
    expect(filterThreadsByTab(threads, "all")).toHaveLength(2);
  });

  it("filters to only threads with unreadCount > 0 for 'unread' tab", () => {
    const threads = [
      makeThread({ id: "a", unreadCount: 0 }),
      makeThread({ id: "b", unreadCount: 3 }),
    ];
    const result = filterThreadsByTab(threads, "unread");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("b");
  });

  it("filters out archived threads for 'salons' tab", () => {
    const threads = [
      makeThread({ id: "a", isArchived: false }),
      makeThread({ id: "b", isArchived: true }),
    ];
    const result = filterThreadsByTab(threads, "salons");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("a");
  });
});

describe("countUnreadThreads", () => {
  it("counts threads with unreadCount > 0", () => {
    const threads = [
      makeThread({ unreadCount: 0 }),
      makeThread({ unreadCount: 2 }),
      makeThread({ unreadCount: 1 }),
    ];
    expect(countUnreadThreads(threads)).toBe(2);
  });

  it("returns 0 for all-read threads", () => {
    const threads = [makeThread({ unreadCount: 0 }), makeThread({ unreadCount: 0 })];
    expect(countUnreadThreads(threads)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

describe("formatMessageTime", () => {
  it("formats AM hour correctly", () => {
    // build a date at 9:05 AM local time
    const d = new Date();
    d.setHours(9, 5, 0, 0);
    const result = formatMessageTime(d.toISOString());
    expect(result).toMatch(/AM/);
    expect(result).toMatch(/9:05/);
  });

  it("formats PM hour correctly", () => {
    const d = new Date();
    d.setHours(15, 30, 0, 0);
    const result = formatMessageTime(d.toISOString());
    expect(result).toMatch(/PM/);
    expect(result).toMatch(/3:30/);
  });

  it("formats midnight (hour 0) as 12:xx AM", () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    const result = formatMessageTime(d.toISOString());
    expect(result).toMatch(/12:00 AM/);
  });

  it("formats noon (hour 12) as 12:xx PM", () => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    const result = formatMessageTime(d.toISOString());
    expect(result).toMatch(/12:00 PM/);
  });
});

describe("formatThreadDate", () => {
  it("returns time string for same-day message", () => {
    const now = new Date("2024-06-15T20:00:00.000Z");
    const isoSameDay = "2024-06-15T09:00:00.000Z";
    const result = formatThreadDate(isoSameDay, now);
    expect(result).toMatch(/AM|PM/);
  });

  it("returns 'Yesterday' for previous day", () => {
    const now = new Date("2024-06-15T10:00:00.000Z");
    const isoYesterday = "2024-06-14T10:00:00.000Z";
    expect(formatThreadDate(isoYesterday, now)).toBe("Yesterday");
  });

  it("returns 'Nd' format for 2-6 days ago", () => {
    const now = new Date("2024-06-15T10:00:00.000Z");
    const iso3DaysAgo = "2024-06-12T10:00:00.000Z";
    const result = formatThreadDate(iso3DaysAgo, now);
    expect(result).toBe("3d");
  });
});

// ---------------------------------------------------------------------------
// Notification filtering + grouping
// ---------------------------------------------------------------------------

const makeNotification = (overrides: Partial<NotificationItem> = {}): NotificationItem => ({
  id: "n1",
  category: "booking",
  title: "Booking confirmed",
  preview: "Your appointment is at 10 AM",
  receivedAt: new Date().toISOString(),
  isRead: false,
  ...overrides,
});

describe("filterNotificationsByTab", () => {
  it("returns all notifications for 'all' tab", () => {
    const notifications = [
      makeNotification({ category: "booking" }),
      makeNotification({ category: "promo" }),
    ];
    expect(filterNotificationsByTab(notifications, "all")).toHaveLength(2);
  });

  it("filters to booking category for 'bookings' tab", () => {
    const notifications = [
      makeNotification({ id: "a", category: "booking" }),
      makeNotification({ id: "b", category: "promo" }),
      makeNotification({ id: "c", category: "loyalty" }),
    ];
    const result = filterNotificationsByTab(notifications, "bookings");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("a");
  });

  it("filters to loyalty category for 'loyalty' tab", () => {
    const notifications = [
      makeNotification({ id: "a", category: "loyalty" }),
      makeNotification({ id: "b", category: "system" }),
    ];
    const result = filterNotificationsByTab(notifications, "loyalty");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("a");
  });
});

describe("groupNotificationsByDate", () => {
  it("groups today's notification under 'Today'", () => {
    const now = new Date("2024-06-15T12:00:00.000Z");
    const notifications = [
      makeNotification({ receivedAt: "2024-06-15T09:00:00.000Z" }),
    ];
    const groups = groupNotificationsByDate(notifications, now);
    expect(groups[0].group).toBe("Today");
    expect(groups[0].items).toHaveLength(1);
  });

  it("groups yesterday's notification under 'Yesterday'", () => {
    const now = new Date("2024-06-15T12:00:00.000Z");
    const notifications = [
      makeNotification({ receivedAt: "2024-06-14T09:00:00.000Z" }),
    ];
    const groups = groupNotificationsByDate(notifications, now);
    expect(groups[0].group).toBe("Yesterday");
  });

  it("groups old notification under 'Earlier'", () => {
    const now = new Date("2024-06-15T12:00:00.000Z");
    const notifications = [
      makeNotification({ receivedAt: "2024-05-01T09:00:00.000Z" }),
    ];
    const groups = groupNotificationsByDate(notifications, now);
    expect(groups[0].group).toBe("Earlier");
  });
});

// ---------------------------------------------------------------------------
// DEFAULT_NOTIFICATION_PREFERENCES — TCPA + CAN-SPAM compliance
// ---------------------------------------------------------------------------

describe("DEFAULT_NOTIFICATION_PREFERENCES", () => {
  it("promotions SMS channel is OFF by default (TCPA)", () => {
    expect(DEFAULT_NOTIFICATION_PREFERENCES.promotions.sms).toBe(false);
  });

  it("promotions email channel is OFF by default (CAN-SPAM)", () => {
    expect(DEFAULT_NOTIFICATION_PREFERENCES.promotions.email).toBe(false);
  });

  it("promotions push channel is OFF by default", () => {
    expect(DEFAULT_NOTIFICATION_PREFERENCES.promotions.push).toBe(false);
  });

  it("bookingReminders push channel is ON by default", () => {
    expect(DEFAULT_NOTIFICATION_PREFERENCES.bookingReminders.push).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// TCPA quiet hours
// ---------------------------------------------------------------------------

describe("QUIET_HOURS defaults", () => {
  it("start default is 21:00", () => {
    expect(QUIET_HOURS_START_DEFAULT).toBe("21:00");
  });

  it("end default is 08:00", () => {
    expect(QUIET_HOURS_END_DEFAULT).toBe("08:00");
  });
});

describe("isInQuietHours", () => {
  it("10:00 is NOT in quiet hours with default range (21:00–08:00)", () => {
    expect(isInQuietHours("10:00")).toBe(false);
  });

  it("22:00 IS in quiet hours with default range (midnight-spanning)", () => {
    expect(isInQuietHours("22:00")).toBe(true);
  });

  it("07:00 IS in quiet hours (inside 08:00 end boundary)", () => {
    expect(isInQuietHours("07:00")).toBe(true);
  });

  it("08:00 is NOT in quiet hours (exclusive end boundary)", () => {
    expect(isInQuietHours("08:00")).toBe(false);
  });

  it("works for non-midnight-spanning range (09:00–17:00)", () => {
    expect(isInQuietHours("12:00", "09:00", "17:00")).toBe(true);
    expect(isInQuietHours("18:00", "09:00", "17:00")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// CAN-SPAM
// ---------------------------------------------------------------------------

describe("CAN_SPAM_UNSUBSCRIBE_COPY", () => {
  it("is a non-empty string", () => {
    expect(typeof CAN_SPAM_UNSUBSCRIBE_COPY).toBe("string");
    expect(CAN_SPAM_UNSUBSCRIBE_COPY.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Waitlist formatting
// ---------------------------------------------------------------------------

describe("formatPositionLabel", () => {
  it("formats '#3' for position 3", () => {
    expect(formatPositionLabel(3)).toBe("#3");
  });

  it("formats '#1' for position 1", () => {
    expect(formatPositionLabel(1)).toBe("#1");
  });
});

describe("formatWaitlistCountdown", () => {
  it("returns 'Expired' for past expiry", () => {
    const past = new Date(Date.now() - 60_000).toISOString();
    expect(formatWaitlistCountdown(past)).toBe("Expired");
  });

  it("returns minutes remaining format for < 1 hour", () => {
    const soon = new Date(Date.now() + 14 * 60_000).toISOString();
    expect(formatWaitlistCountdown(soon)).toMatch(/14m remaining/);
  });

  it("returns hours + minutes remaining format for >= 1 hour", () => {
    const laterStr = new Date(Date.now() + 2 * 60 * 60_000 + 5 * 60_000).toISOString();
    const result = formatWaitlistCountdown(laterStr);
    expect(result).toMatch(/2h \dm remaining/);
  });
});
