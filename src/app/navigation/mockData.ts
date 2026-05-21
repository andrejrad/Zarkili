/**
 * mockData.ts — Phase 2.2 navigation wiring (W33–W34).
 *
 * Centralized mock/static data used by AppNavigatorShell route branches that
 * have no real backend wiring yet. Real Firebase/Firestore integration happens
 * in Phase 2.3 (W35–W37); this file is consumed only while screens are wired
 * with prop-driven static data.
 *
 * Retired during W37 once every screen reads from real services. See
 * documentation/PHASE2_3_CONSUMER_FIREBASE_INTEGRATION_WEEKS_35_TO_37.md.
 */

import type {
  BookingAddOn,
  BookingPriceBreakdown,
  BookingService,
  BookingStaffOption,
} from "../booking/bookingHelpers";
import {
  ONBOARDING_STEPS,
  buildInitialStepStatuses,
  computeCompletionScore,
  deriveBlockers,
  type SalonOnboardingState,
} from "../../domains/onboarding/model";
import {
  DEFAULT_DISCOVERY_FILTERS,
  type DiscoveryCategory,
  type FeaturedSalon,
} from "../discovery/discoveryHelpers";
import type { DiscoveryFeedPost } from "../../domains/discovery";
import type {
  SalonProfile,
  SalonReviewSnippet,
  SalonServiceSummary,
  SalonStaffSummary,
} from "../../domains/discovery/salonProfileService";
import type { BookingServiceCategoryGroup } from "../booking/ServiceSelectionScreen";
import type { BookingPolicySection } from "../booking/BookingPoliciesScreen";
import type { SavedCard } from "../booking/BookingPaymentScreen";
import type { SavedPaymentMethod } from "../payments/paymentsHelpers";
import type {
  BookingHistoryRecord,
  ReceiptLineItem,
  ReceiptTaxLine,
} from "../payments/receiptsHelpers";
import type {
  ConsumerMessage,
  NotificationItem,
  NotificationPreferences,
  ThreadSummary,
} from "../messaging/messagingHelpers";
import type { SalonSearchResult } from "../messaging/ComposeScreen";
// ---- Auth (W33 Stream A-1) ----------------------------------------------

export const mockAuthData = {
  /** Placeholder email shown on EmailVerificationScreen when entering via deep link or post-register. */
  pendingVerificationEmail: "demo@zarkili.com",
  /** Pretty-formatted phone destination shown on OtpVerificationScreen. */
  pendingOtpDestination: "(555) 555-1234",
  /** Mock summary shown to a user whose email is already linked to a guest booking. */
  accountMerge: {
    bookingCount: 2,
    loyaltyPoints: 450,
    emailExists: false,
  },
} as const;

// ---- Booking flow (W33 Stream A-2) --------------------------------------

const MOCK_SERVICES: readonly BookingService[] = [
  { id: "svc-haircut", name: "Haircut", durationMinutes: 45, priceUsd: 65, category: "Hair" },
  { id: "svc-color", name: "Color", durationMinutes: 90, priceUsd: 145, category: "Hair" },
  { id: "svc-blowout", name: "Blowout", durationMinutes: 30, priceUsd: 45, category: "Hair" },
  { id: "svc-mani", name: "Manicure", durationMinutes: 30, priceUsd: 35, category: "Nails" },
];

const MOCK_SERVICE_GROUPS: readonly BookingServiceCategoryGroup[] = [
  { category: "hair", label: "Hair", services: [...MOCK_SERVICES.slice(0, 3)] },
  { category: "nails", label: "Nails", services: [...MOCK_SERVICES.slice(3)] },
];

const MOCK_ADDONS: Record<string, BookingAddOn[]> = {
  "svc-haircut": [{ id: "addon-style", name: "Style finish", priceUsd: 15 }],
};

const MOCK_STAFF: readonly BookingStaffOption[] = [
  {
    id: "staff-1",
    name: "Alex Rivera",
    rating: 4.9,
    specialties: ["Cuts", "Color"],
    nextAvailableLabel: "Today",
  },
  {
    id: "staff-2",
    name: "Jordan Lee",
    rating: 4.8,
    specialties: ["Color", "Blowouts"],
    nextAvailableLabel: "Tomorrow",
  },
];

const MOCK_TIME_SLOTS: readonly string[] = [
  "9:00 AM",
  "9:30 AM",
  "10:00 AM",
  "11:30 AM",
  "1:00 PM",
  "2:30 PM",
  "4:00 PM",
  "5:30 PM",
];

const MOCK_PRICING: BookingPriceBreakdown = {
  subtotal: 65,
  taxRate: 0.08,
  tax: 5.2,
  tip: 0,
  total: 70.2,
};

const MOCK_POLICY_SECTIONS: readonly BookingPolicySection[] = [
  {
    id: "cancellation",
    title: "Cancellation",
    body: "Free cancellation up to 24 hours before your appointment. After that, a 50% fee applies.",
  },
  {
    id: "no-show",
    title: "No-show",
    body: "If you miss your appointment without notice, the full amount may be charged.",
  },
  {
    id: "late-arrival",
    title: "Late arrival",
    body: "Please arrive 5 minutes early. Arrivals more than 15 minutes late may be rescheduled.",
  },
];

const MOCK_SAVED_CARDS: readonly SavedCard[] = [
  { id: "card-1", brand: "Visa", last4: "4242", isDefault: true },
  { id: "card-2", brand: "Mastercard", last4: "8210" },
];

export const mockBookingData = {
  salon: {
    id: "salon-mock-1",
    name: "Zarkili Demo Salon",
    address: "123 Demo St, San Francisco, CA",
  },
  serviceGroups: MOCK_SERVICE_GROUPS,
  addOnCatalog: MOCK_ADDONS,
  staff: MOCK_STAFF,
  timeSlots: MOCK_TIME_SLOTS,
  // Disabled slots must be a subset of timeSlots so the disabled-slot visual
  // state is exercised during W35 manual QA (TC-027/028/039). See
  // documentation/new-platform/WEEK35_QA_MOCK_FINDINGS.md PRE-FLIGHT-1.
  disabledSlots: ["10:00 AM", "1:00 PM"] as readonly string[],
  pricing: MOCK_PRICING,
  policySections: MOCK_POLICY_SECTIONS,
  savedCards: MOCK_SAVED_CARDS,
  timezone: "PT",
} as const;

export { MOCK_SERVICES };

// ---- Payments (W33 Stream A-3) ------------------------------------------

const MOCK_SAVED_METHODS: readonly SavedPaymentMethod[] = [
  {
    id: "pm-1",
    brand: "visa",
    last4: "4242",
    expMonth: 12,
    expYear: 2028,
    isDefault: true,
    holderName: "Demo User",
  },
  {
    id: "pm-2",
    brand: "mastercard",
    last4: "8210",
    expMonth: 6,
    expYear: 2027,
    holderName: "Demo User",
  },
];

const MOCK_RECEIPT_ITEMS: readonly ReceiptLineItem[] = [
  { id: "li-1", description: "Haircut", quantity: 1, unitPriceUsd: 65 },
];

const MOCK_RECEIPT_TAX: readonly ReceiptTaxLine[] = [
  { label: "CA Sales Tax 8.0%", amount: 5.2 },
];

const MOCK_BOOKING_HISTORY: readonly BookingHistoryRecord[] = [
  {
    id: "bk-1001",
    salonId: "salon-mock-1",
    salonName: "Zarkili Demo Salon",
    serviceName: "Haircut",
    startsAtIso: "2026-05-15T17:00:00Z",
    status: "confirmed",
    totalUsd: 70.2,
  },
  {
    id: "bk-0987",
    salonId: "salon-mock-1",
    salonName: "Zarkili Demo Salon",
    serviceName: "Color",
    startsAtIso: "2026-03-12T18:30:00Z",
    status: "completed",
    totalUsd: 156.6,
  },
];

export const mockPaymentsData = {
  savedMethods: MOCK_SAVED_METHODS,
  receipt: {
    salonName: "Zarkili Demo Salon",
    salonAddress: "123 Demo St, San Francisco, CA",
    occurredAtIso: "2026-04-20T17:30:00Z",
    items: MOCK_RECEIPT_ITEMS,
    taxLines: MOCK_RECEIPT_TAX,
    tip: 13,
    paymentMethodLabel: "Visa ending 4242",
  },
  bookingHistory: MOCK_BOOKING_HISTORY,
  refund: {
    amountUsd: 70.2,
    booking: {
      salonName: "Zarkili Demo Salon",
      serviceName: "Haircut",
      startsAtIso: "2026-04-10T17:00:00Z",
    },
    requestedAtIso: "2026-04-09T12:00:00Z",
    approvedAtIso: "2026-04-09T15:00:00Z",
    issuedAtIso: "2026-04-11T09:00:00Z",
  },
} as const;

// ---- Messaging + Notifications (W33 Stream A-5) -------------------------

const MOCK_THREADS: readonly ThreadSummary[] = [
  {
    id: "thread-1",
    salonId: "salon-mock-1",
    salonName: "Zarkili Demo Salon",
    lastMessage: "See you Friday!",
    lastMessageAt: "2026-04-26T18:30:00Z",
    unreadCount: 2,
    isArchived: false,
    isMuted: false,
    isBlocked: false,
  },
  {
    id: "thread-2",
    salonId: "salon-mock-2",
    salonName: "Sunset Studio",
    lastMessage: "Your appointment is confirmed.",
    lastMessageAt: "2026-04-22T14:00:00Z",
    unreadCount: 0,
    isArchived: false,
    isMuted: false,
    isBlocked: false,
  },
];

const MOCK_THREAD_MESSAGES: readonly ConsumerMessage[] = [
  {
    id: "msg-1",
    threadId: "thread-1",
    sender: "salon",
    text: "Hi! Just confirming your appointment for Friday at 2pm.",
    sentAt: "2026-04-26T17:00:00Z",
    status: "read",
  },
  {
    id: "msg-2",
    threadId: "thread-1",
    sender: "user",
    text: "Yes, see you then!",
    sentAt: "2026-04-26T17:15:00Z",
    status: "read",
  },
  {
    id: "msg-3",
    threadId: "thread-1",
    sender: "salon",
    text: "See you Friday!",
    sentAt: "2026-04-26T18:30:00Z",
    status: "delivered",
  },
];

const MOCK_SALON_SEARCH: readonly SalonSearchResult[] = [
  { id: "salon-mock-1", name: "Zarkili Demo Salon" },
  { id: "salon-mock-2", name: "Sunset Studio" },
  { id: "salon-mock-3", name: "Bayview Beauty Bar" },
];

const MOCK_NOTIFICATIONS: readonly NotificationItem[] = [
  {
    id: "n1",
    category: "booking",
    title: "Appointment reminder",
    preview: "Your haircut is tomorrow at 2pm.",
    receivedAt: "2026-04-28T09:00:00Z",
    isRead: false,
  },
  {
    id: "n2",
    category: "loyalty",
    title: "You earned 50 points!",
    preview: "Thanks for your booking with Zarkili Demo Salon.",
    receivedAt: "2026-04-26T19:00:00Z",
    isRead: true,
  },
  {
    id: "n3",
    category: "promo",
    title: "20% off color services",
    preview: "Limited time offer at participating salons.",
    receivedAt: "2026-04-20T12:00:00Z",
    isRead: false,
  },
];

export const mockMessagingData = {
  threads: MOCK_THREADS,
  threadMessages: MOCK_THREAD_MESSAGES,
  salonSearch: MOCK_SALON_SEARCH,
  quickReplies: [
    "Sounds good!",
    "Thanks!",
    "Can we reschedule?",
  ] as readonly string[],
  notifications: MOCK_NOTIFICATIONS,
} as const;

// ---- Salon onboarding (W34 Stream C) ------------------------------------

function buildMockSalonOnboardingState(): SalonOnboardingState {
  const statuses = buildInitialStepStatuses();
  // Mark the ACCOUNT step as completed for a more realistic visual.
  statuses["ACCOUNT"] = "completed";
  const completionScore = computeCompletionScore(statuses);
  const blockers = deriveBlockers(statuses);
  return {
    tenantId: "salon-mock",
    stepStatuses: statuses,
    currentStep: "BUSINESS_PROFILE",
    completionScore,
    blockers,
    canGoLive: blockers.length === 0,
    // Stub Timestamps — wizard does not read these in the W33 mock pass.
    startedAt: { seconds: 1700000000, nanoseconds: 0 } as never,
    updatedAt: { seconds: 1700000000, nanoseconds: 0 } as never,
  };
}

export const mockSalonOnboardingData = {
  tenantId: "salon-mock",
  initialState: buildMockSalonOnboardingState(),
  steps: ONBOARDING_STEPS,
} as const;

// ---- Discovery (W34 Stream B) -------------------------------------------

const MOCK_DISCOVERY_CATEGORIES: DiscoveryCategory[] = [
  { id: "hair", label: "Hair", emoji: "💇" },
  { id: "nails", label: "Nails", emoji: "💅" },
  { id: "skin", label: "Skin", emoji: "✨" },
  { id: "lashes", label: "Lashes", emoji: "👁" },
  { id: "barber", label: "Barber", emoji: "✂️" },
];

const MOCK_FEATURED_SALONS: FeaturedSalon[] = [
  {
    id: "salon-1",
    name: "Zarkili Demo Salon",
    city: "San Francisco",
    rating: 4.8,
    reviewCount: 132,
    priceLevel: 2,
    distanceMiles: 1.2,
  },
  {
    id: "salon-2",
    name: "Glow Studio",
    city: "Oakland",
    rating: 4.6,
    reviewCount: 84,
    priceLevel: 2,
    distanceMiles: 4.1,
  },
  {
    id: "salon-3",
    name: "Nail Lab",
    city: "San Francisco",
    rating: 4.9,
    reviewCount: 211,
    priceLevel: 3,
    distanceMiles: 0.7,
  },
];

const MOCK_FEED_POSTS: DiscoveryFeedPost[] = [
  {
    id: "post-1",
    salonId: "salon-1",
    salonName: "Zarkili Demo Salon",
    caption: "New balayage menu launching this week ✨",
    likeCount: 42,
    postedAt: "2h ago",
  },
  {
    id: "post-2",
    salonId: "salon-2",
    salonName: "Glow Studio",
    caption: "Friday facials — book before they're gone.",
    likeCount: 18,
    postedAt: "1d ago",
  },
];

const MOCK_SALON_PROFILE: SalonProfile = {
  id: "salon-1",
  name: "Zarkili Demo Salon",
  tagline: "Modern color and care",
  city: "San Francisco",
  addressLine: "123 Demo St, San Francisco, CA",
  rating: 4.8,
  reviewCount: 132,
  description:
    "A neighborhood salon focused on color, balayage, and premium hair care. Walk-ins welcome.",
};

const MOCK_SALON_SERVICES: SalonServiceSummary[] = [
  { id: "svc-1", name: "Cut & style", durationMinutes: 60, priceCents: 8500 },
  { id: "svc-2", name: "Balayage", durationMinutes: 180, priceCents: 28000 },
  { id: "svc-3", name: "Gloss treatment", durationMinutes: 45, priceCents: 6500 },
];

const MOCK_SALON_STAFF: SalonStaffSummary[] = [
  { id: "staff-1", name: "Alex Rivera", role: "Senior stylist", rating: 4.9 },
  { id: "staff-2", name: "Sam Chen", role: "Color specialist", rating: 4.7 },
];

const MOCK_SALON_REVIEWS: SalonReviewSnippet[] = [
  {
    id: "rev-1",
    authorName: "Jordan",
    rating: 5,
    text: "Loved my balayage — Alex really listened to what I wanted.",
    postedAt: "Apr 22",
  },
  {
    id: "rev-2",
    authorName: "Riley",
    rating: 4,
    text: "Great gloss treatment, clean salon, easy booking.",
    postedAt: "Apr 18",
  },
];

export const mockDiscoveryData = {
  categories: MOCK_DISCOVERY_CATEGORIES,
  featuredSalons: MOCK_FEATURED_SALONS,
  feedPosts: MOCK_FEED_POSTS,
  defaultFilters: DEFAULT_DISCOVERY_FILTERS,
  salonProfile: MOCK_SALON_PROFILE,
  salonServices: MOCK_SALON_SERVICES,
  salonStaff: MOCK_SALON_STAFF,
  salonReviews: MOCK_SALON_REVIEWS,
  serviceDetail: {
    ...MOCK_SALON_SERVICES[0],
    description: "A precision cut tailored to your hair texture and lifestyle.",
  },
  staffDetail: {
    ...MOCK_SALON_STAFF[0],
    bio: "10+ years specializing in modern color and balayage.",
    salonName: MOCK_SALON_PROFILE.name,
  },
} as const;
