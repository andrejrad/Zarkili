/**
 * messagingHelpers.ts — W26 Batch F pure helper module.
 *
 * Covers: thread/message types, inbox filtering, notification types and
 * grouping, notification preference types with TCPA/CAN-SPAM-compliant
 * defaults, waitlist types, quiet-hours logic, and formatting utilities.
 *
 * Zero React imports — safe to reuse in Cloud Functions.
 */

// ---------------------------------------------------------------------------
// Thread / Message
// ---------------------------------------------------------------------------

export type MessageStatus = "sent" | "delivered" | "read" | "failed";
export type MessageSender = "user" | "salon";

export type ConsumerMessageAttachment = {
  id: string;
  type: "image" | "file";
  uri: string;
  filename?: string;
  fileSize?: string;
};

export type ConsumerMessage = {
  id: string;
  threadId: string;
  sender: MessageSender;
  text: string;
  attachments?: ConsumerMessageAttachment[];
  /** ISO datetime */
  sentAt: string;
  status?: MessageStatus;
};

export type InboxTab = "all" | "unread" | "salons";

export const INBOX_TABS: readonly InboxTab[] = ["all", "unread", "salons"] as const;

export const INBOX_TAB_LABELS: Record<InboxTab, string> = {
  all: "All",
  unread: "Unread",
  salons: "Salons",
};

export type ThreadSummary = {
  id: string;
  salonId: string;
  salonName: string;
  salonAvatarUri?: string;
  lastMessage: string;
  /** ISO datetime */
  lastMessageAt: string;
  unreadCount: number;
  isArchived: boolean;
  isMuted: boolean;
  isBlocked: boolean;
};

export function filterThreadsByTab(threads: ThreadSummary[], tab: InboxTab): ThreadSummary[] {
  if (tab === "unread") return threads.filter((t) => t.unreadCount > 0);
  if (tab === "salons") return threads.filter((t) => !t.isArchived);
  return threads;
}

export function countUnreadThreads(threads: ThreadSummary[]): number {
  return threads.reduce((sum, t) => sum + (t.unreadCount > 0 ? 1 : 0), 0);
}

// ---------------------------------------------------------------------------
// Time / date formatting (12h AM/PM, US-primary)
// ---------------------------------------------------------------------------

/** Formats an ISO datetime to "h:mm AM/PM" */
export function formatMessageTime(isoString: string): string {
  const d = new Date(isoString);
  const h = d.getHours();
  const min = d.getMinutes().toString().padStart(2, "0");
  const period = h < 12 ? "AM" : "PM";
  const h12 = h % 12 || 12;
  return `${h12}:${min} ${period}`;
}

/** Formats an ISO datetime relative to now: time (same day), "Yesterday", "Nd", or "Mon D" */
export function formatThreadDate(isoString: string, now: Date = new Date()): string {
  const d = new Date(isoString);
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return formatMessageTime(isoString);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Formats an ISO date string to US "MM/DD/YYYY" */
export function formatUsDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${month}/${day}/${year}`;
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export type NotificationCategory = "booking" | "loyalty" | "promo" | "system" | "message";

export type NotificationTab = "all" | "bookings" | "loyalty" | "promos" | "system";

export const NOTIFICATION_TABS: readonly NotificationTab[] = [
  "all",
  "bookings",
  "loyalty",
  "promos",
  "system",
] as const;

export const NOTIFICATION_TAB_LABELS: Record<NotificationTab, string> = {
  all: "All",
  bookings: "Bookings",
  loyalty: "Loyalty",
  promos: "Promos",
  system: "System",
};

export type NotificationItem = {
  id: string;
  category: NotificationCategory;
  title: string;
  preview: string;
  /** ISO datetime */
  receivedAt: string;
  isRead: boolean;
  deepLinkRoute?: string;
};

export type NotificationDateGroup = "Today" | "Yesterday" | "This week" | "Earlier";

const DATE_GROUP_ORDER: NotificationDateGroup[] = ["Today", "Yesterday", "This week", "Earlier"];

export function categorizeNotificationDate(
  isoString: string,
  now: Date = new Date(),
): NotificationDateGroup {
  const d = new Date(isoString);
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return "This week";
  return "Earlier";
}

const CATEGORY_TO_TAB: Record<NotificationCategory, NotificationTab> = {
  booking: "bookings",
  loyalty: "loyalty",
  promo: "promos",
  system: "system",
  message: "all",
};

export function filterNotificationsByTab(
  notifications: NotificationItem[],
  tab: NotificationTab,
): NotificationItem[] {
  if (tab === "all") return notifications;
  return notifications.filter((n) => CATEGORY_TO_TAB[n.category] === tab);
}

export function groupNotificationsByDate(
  notifications: NotificationItem[],
  now: Date = new Date(),
): Array<{ group: NotificationDateGroup; items: NotificationItem[] }> {
  const map = new Map<NotificationDateGroup, NotificationItem[]>();
  for (const n of notifications) {
    const g = categorizeNotificationDate(n.receivedAt, now);
    if (!map.has(g)) map.set(g, []);
    map.get(g)!.push(n);
  }
  return DATE_GROUP_ORDER.filter((g) => map.has(g)).map((g) => ({
    group: g,
    items: map.get(g)!,
  }));
}

// ---------------------------------------------------------------------------
// Notification preferences
// ---------------------------------------------------------------------------

export type NotificationChannel = "push" | "email" | "sms";

export type NotificationPreferenceKey =
  | "bookingReminders"
  | "bookingChanges"
  | "promotions"
  | "newSalonsNearby"
  | "loyaltyUpdates"
  | "reviewRequests";

export const NOTIFICATION_PREFERENCE_LABELS: Record<NotificationPreferenceKey, string> = {
  bookingReminders: "Booking reminders",
  bookingChanges: "Booking changes",
  promotions: "Promotions",
  newSalonsNearby: "New salons near you",
  loyaltyUpdates: "Loyalty updates",
  reviewRequests: "Review requests",
};

export type NotificationPreferences = Record<
  NotificationPreferenceKey,
  Record<NotificationChannel, boolean>
>;

/**
 * TCPA-compliant defaults:
 *   - SMS marketing (promotions) → OFF (explicit prior consent required before enabling)
 * CAN-SPAM-compliant defaults:
 *   - Email marketing (promotions) → OFF (one-click unsubscribe required if enabled)
 */
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  bookingReminders: { push: true,  email: false, sms: false },
  bookingChanges:   { push: true,  email: true,  sms: false },
  promotions:       { push: false, email: false, sms: false }, // TCPA + CAN-SPAM: both OFF default
  newSalonsNearby:  { push: false, email: false, sms: false },
  loyaltyUpdates:   { push: true,  email: false, sms: false },
  reviewRequests:   { push: true,  email: false, sms: false },
};

// ---------------------------------------------------------------------------
// TCPA quiet hours
// ---------------------------------------------------------------------------

/** Default quiet window: 9 PM – 8 AM */
export const QUIET_HOURS_START_DEFAULT = "21:00";
export const QUIET_HOURS_END_DEFAULT = "08:00";

export type QuietDay = "Sun" | "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat";

export const QUIET_DAYS_ALL: readonly QuietDay[] = [
  "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat",
] as const;

/**
 * Returns true if localTime "HH:MM" falls within the quiet window.
 * Handles windows that span midnight (e.g. 21:00 → 08:00).
 */
export function isInQuietHours(
  localTime: string,
  start: string = QUIET_HOURS_START_DEFAULT,
  end: string = QUIET_HOURS_END_DEFAULT,
): boolean {
  const toMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  const startMin = toMin(start);
  const endMin = toMin(end);
  const timeMin = toMin(localTime);
  if (startMin > endMin) {
    // spans midnight
    return timeMin >= startMin || timeMin < endMin;
  }
  return timeMin >= startMin && timeMin < endMin;
}

// ---------------------------------------------------------------------------
// CAN-SPAM constants
// ---------------------------------------------------------------------------

export const CAN_SPAM_UNSUBSCRIBE_COPY =
  "You can unsubscribe from marketing emails at any time.";

export const CAN_SPAM_SENDER_COPY =
  "Zarkili, Inc. · 123 Main Street, Seattle, WA 98101";

// ---------------------------------------------------------------------------
// Waitlist
// ---------------------------------------------------------------------------

export type WaitlistTimePreference = "morning" | "afternoon" | "evening" | "anytime";

export const WAITLIST_TIME_PREFERENCES: readonly WaitlistTimePreference[] = [
  "morning",
  "afternoon",
  "evening",
  "anytime",
] as const;

export const WAITLIST_TIME_PREFERENCE_LABELS: Record<WaitlistTimePreference, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
  anytime: "Anytime",
};

export type WaitlistStaffPreference = "any" | "specific";

export type WaitlistJoinRequest = {
  serviceId: string;
  /** ISO date "YYYY-MM-DD" */
  dateRangeStart: string;
  /** ISO date "YYYY-MM-DD" */
  dateRangeEnd: string;
  timePreference: WaitlistTimePreference;
  staffPreference: WaitlistStaffPreference;
  staffId?: string;
  notifyByPush: boolean;
  /** Must have explicit prior TCPA SMS consent before setting true */
  notifyBySms: boolean;
};

export type WaitlistSlotOffer = {
  offerId: string;
  /** ISO datetime */
  slotAt: string;
  /** ISO datetime */
  expiresAt: string;
};

export type WaitlistPositionData = {
  positionNumber: number;
  serviceName: string;
  salonName: string;
  salonAddress: string;
  /** Human-readable estimate e.g. "2–5 days" */
  estimatedWait: string;
  slotOffer?: WaitlistSlotOffer;
};

/** Formats a position number as "#3" */
export function formatPositionLabel(n: number): string {
  return `#${n}`;
}

/** Formats time remaining until offer expiry, e.g. "14m remaining" or "2h 5m remaining". Returns "Expired" if past. */
export function formatWaitlistCountdown(expiresAt: string, now: Date = new Date()): string {
  const ms = new Date(expiresAt).getTime() - now.getTime();
  if (ms <= 0) return "Expired";
  const totalMinutes = Math.floor(ms / 60_000);
  if (totalMinutes < 60) return `${totalMinutes}m remaining`;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return `${hours}h ${mins}m remaining`;
}
