/**
 * w46AdminRepoAdapters.test.ts — W46-DEBT-1, W46-DEBT-2, W46-DEBT-3
 *
 * Unit tests for the three admin Firestore repository adapter trios:
 *   - reviewAdminRepository   (W46-DEBT-1)
 *   - messagingAdminRepository (W46-DEBT-2)
 *   - waitlistAdminRepository  (W46-DEBT-3)
 *
 * Strategy: mock repos injected into the service factories to validate:
 *   1. "not configured" fallback path (repo absent)
 *   2. Happy-path delegation to repo methods
 *   3. Error normalisation on repo throw
 *
 * Firestore adapters themselves are tested structurally (factory returns
 * an object with the correct method surface) since they require live Firestore.
 */

import { createReviewAdminService } from "../src/app/admin/reviewAdminService";
import { createMessagingAdminService } from "../src/app/admin/messagingAdminService";
import { createWaitlistAdminService } from "../src/app/admin/waitlistAdminService";

import {
  createFirestoreReviewQueueRepository,
  createFirestoreReviewWriteRepository,
} from "../src/app/admin/reviewAdminRepository";
import {
  createFirestoreAdminThreadRepository,
  createFirestoreCannedReplyRepository,
} from "../src/app/admin/messagingAdminRepository";
import {
  createFirestoreWaitlistAdminRepository,
  createFirestoreWaitlistBookingRepository,
  createFirestoreWaitlistPolicyRepository,
} from "../src/app/admin/waitlistAdminRepository";

import type { ReviewQueueRepository, ReviewWriteRepository } from "../src/app/admin/reviewAdminService";
import type { AdminThreadRepository, CannedReplyRepository } from "../src/app/admin/messagingAdminService";
import type { WaitlistAdminRepository, WaitlistBookingRepository, WaitlistPolicyRepository } from "../src/app/admin/waitlistAdminService";

import type { ReviewEntry, ReputationStats, ReviewAutomationRule } from "../src/domains/reviews/reviewAdminModel";
import type { AdminThread, CannedReply, AutoReplyConfig } from "../src/domains/messaging/messagingAdminModel";
import type { WaitlistAdminEntry, WaitlistPolicy, ConvertToBookingResult } from "../src/domains/waitlist/waitlistAdminModel";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const REVIEW_ENTRY: ReviewEntry = {
  reviewId: "r1",
  tenantId: "t1",
  clientId: "c1",
  clientName: "Jane Doe",
  staffId: "s1",
  staffName: "Alice",
  serviceId: "svc1",
  serviceName: "Haircut",
  locationId: "loc1",
  rating: 5,
  comment: "Great!",
  status: "pending",
  createdAt: "2024-01-01T00:00:00.000Z",
  repliedAt: null,
  replyText: null,
  repliedBy: null,
};

const REPUTATION_STATS: ReputationStats = {
  tenantId: "t1",
  averageRating: 4.5,
  totalReviews: 100,
  breakdown: { 1: 0, 2: 2, 3: 8, 4: 30, 5: 60 },
  replyRate: 0.8,
  pendingCount: 3,
  flaggedCount: 1,
  trendLast30Days: [],
};

const AUTOMATION_RULE: ReviewAutomationRule = {
  ruleId: "rule1",
  tenantId: "t1",
  label: "Auto-thank 5-star",
  triggerRating: 5,
  triggerRatingOp: "gte",
  replyTemplate: "Thank you!",
  active: true,
  createdAt: "2024-01-01T00:00:00.000Z",
};

const THREAD: AdminThread = {
  threadId: "th1",
  tenantId: "t1",
  clientId: "c1",
  clientName: "Jane",
  assignedStaffId: null,
  assignedStaffName: null,
  subject: null,
  lastMessage: "Hello",
  lastMessageAt: "2024-01-01T00:00:00.000Z",
  unreadCount: 1,
  messageCount: 2,
  status: "open",
  isAutoReplied: false,
  tags: [],
};

const CANNED_REPLY: CannedReply = {
  cannedId: "cr1",
  tenantId: "t1",
  title: "Welcome",
  body: "Hello, how can we help?",
  tags: ["greeting"],
  createdBy: "u1",
  createdAt: "2024-01-01T00:00:00.000Z",
};

const AUTO_REPLY_CONFIG: AutoReplyConfig = {
  tenantId: "t1",
  enabled: true,
  outsideHoursMessage: "We are closed.",
  useCustomMessage: false,
  openHour: 9,
  closeHour: 18,
  enabledDays: ["mon", "tue", "wed", "thu", "fri"],
  updatedAt: "2024-01-01T00:00:00.000Z",
};

const WAITLIST_ENTRY: WaitlistAdminEntry = {
  waitlistId: "wl1",
  tenantId: "t1",
  clientId: "c1",
  clientName: "Jane",
  clientPhone: null,
  serviceId: "svc1",
  serviceName: "Trim",
  staffId: null,
  staffName: null,
  locationId: "loc1",
  preferredDateFrom: "2024-06-01",
  preferredDateTo: "2024-06-07",
  preferredTime: "morning",
  priority: 1,
  status: "waiting",
  joinedAt: "2024-01-01T00:00:00.000Z",
  expiresAt: null,
  notifiedAt: null,
  notifyPush: true,
  notifySms: false,
};

const WAITLIST_POLICY: WaitlistPolicy = {
  tenantId: "t1",
  maxWaitDays: 30,
  autoCancelAfterDays: 7,
  notifyOnOpenSlot: true,
  notifyLeadHours: 24,
  requireConfirmation: false,
  allowMultipleEntries: false,
  maxEntriesPerClient: 1,
  updatedAt: "2024-01-01T00:00:00.000Z",
};

// ---------------------------------------------------------------------------
// reviewAdminService — W46-DEBT-1
// ---------------------------------------------------------------------------

describe("reviewAdminService (W46-DEBT-1)", () => {
  describe("not-configured path", () => {
    const svc = createReviewAdminService();

    it("listReviews → ok:false when no queueRepo", async () => {
      const res = await svc.listReviews("t1", "all");
      expect(res.ok).toBe(false);
    });

    it("getReview → ok:false when no queueRepo", async () => {
      const res = await svc.getReview("r1", "t1");
      expect(res.ok).toBe(false);
    });

    it("loadReputationStats → ok:false when no queueRepo", async () => {
      const res = await svc.loadReputationStats("t1");
      expect(res.ok).toBe(false);
    });

    it("replyToReview → ok:false when no writeRepo", async () => {
      const res = await svc.replyToReview({ reviewId: "r1", tenantId: "t1", replyText: "Thanks!", repliedBy: "u1" });
      expect(res.ok).toBe(false);
    });

    it("flagReview → ok:false when no writeRepo", async () => {
      const res = await svc.flagReview({ reviewId: "r1", tenantId: "t1", flaggedBy: "u1", flagReason: "spam" });
      expect(res.ok).toBe(false);
    });
  });

  describe("happy path with mock repos", () => {
    const mockQueue: ReviewQueueRepository = {
      list: jest.fn().mockResolvedValue([REVIEW_ENTRY]),
      getById: jest.fn().mockResolvedValue(REVIEW_ENTRY),
      getReputationStats: jest.fn().mockResolvedValue(REPUTATION_STATS),
    };
    const mockWrite: ReviewWriteRepository = {
      saveReply: jest.fn().mockResolvedValue(REVIEW_ENTRY),
      flagReview: jest.fn().mockResolvedValue(REVIEW_ENTRY),
      disputeReview: jest.fn().mockResolvedValue(REVIEW_ENTRY),
      hideReview: jest.fn().mockResolvedValue(REVIEW_ENTRY),
      bulkAction: jest.fn().mockResolvedValue(undefined),
      saveAutomationRule: jest.fn().mockResolvedValue(AUTOMATION_RULE),
      listAutomationRules: jest.fn().mockResolvedValue([AUTOMATION_RULE]),
      toggleAutomationRule: jest.fn().mockResolvedValue(undefined),
      deleteAutomationRule: jest.fn().mockResolvedValue(undefined),
    };

    const svc = createReviewAdminService(mockQueue, mockWrite);

    it("listReviews delegates to queueRepo.list", async () => {
      const res = await svc.listReviews("t1", "pending");
      expect(res.ok).toBe(true);
      if (res.ok) expect(res.data).toEqual([REVIEW_ENTRY]);
      expect(mockQueue.list).toHaveBeenCalledWith("t1", "pending");
    });

    it("getReview delegates to queueRepo.getById", async () => {
      const res = await svc.getReview("r1", "t1");
      expect(res.ok).toBe(true);
      expect(mockQueue.getById).toHaveBeenCalledWith("r1", "t1");
    });

    it("loadReputationStats delegates to queueRepo.getReputationStats", async () => {
      const res = await svc.loadReputationStats("t1");
      expect(res.ok).toBe(true);
      if (res.ok) expect(res.data.averageRating).toBe(4.5);
    });

    it("replyToReview delegates to writeRepo.saveReply", async () => {
      const input = { reviewId: "r1", tenantId: "t1", replyText: "Thanks!", repliedBy: "u1" };
      const res = await svc.replyToReview(input);
      expect(res.ok).toBe(true);
      expect(mockWrite.saveReply).toHaveBeenCalledWith(input);
    });

    it("flagReview delegates to writeRepo.flagReview", async () => {
      const input = { reviewId: "r1", tenantId: "t1", flaggedBy: "u1", flagReason: "spam" };
      const res = await svc.flagReview(input);
      expect(res.ok).toBe(true);
      expect(mockWrite.flagReview).toHaveBeenCalledWith(input);
    });

    it("listAutomationRules delegates to writeRepo.listAutomationRules", async () => {
      const res = await svc.listAutomationRules("t1");
      expect(res.ok).toBe(true);
      expect(mockWrite.listAutomationRules).toHaveBeenCalledWith("t1");
    });
  });

  describe("error normalisation", () => {
    const failQueue: ReviewQueueRepository = {
      list: jest.fn().mockRejectedValue(new Error("Firestore unavailable")),
      getById: jest.fn().mockRejectedValue(new Error("Firestore unavailable")),
      getReputationStats: jest.fn().mockRejectedValue(new Error("Firestore unavailable")),
    };
    const svc = createReviewAdminService(failQueue);

    it("wraps repo errors as ok:false with message", async () => {
      const res = await svc.listReviews("t1", "all");
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.message).toMatch(/Firestore unavailable/i);
    });
  });
});

// ---------------------------------------------------------------------------
// messagingAdminService — W46-DEBT-2
// ---------------------------------------------------------------------------

describe("messagingAdminService (W46-DEBT-2)", () => {
  describe("not-configured path", () => {
    const svc = createMessagingAdminService();

    it("listThreads → ok:false when no threadRepo", async () => {
      const res = await svc.listThreads("t1");
      expect(res.ok).toBe(false);
    });

    it("assignThread → ok:false when no threadRepo", async () => {
      const res = await svc.assignThread({ tenantId: "t1", threadId: "th1", staffId: "s1", staffName: "Alice", assignedBy: "mgr" });
      expect(res.ok).toBe(false);
    });

    it("listCannedReplies → ok:false when no cannedRepo", async () => {
      const res = await svc.listCannedReplies("t1");
      expect(res.ok).toBe(false);
    });

    it("getAutoReplyConfig → ok:false when no cannedRepo", async () => {
      const res = await svc.loadAutoReplyConfig("t1");
      expect(res.ok).toBe(false);
    });
  });

  describe("happy path with mock repos", () => {
    const mockThread: AdminThreadRepository = {
      listThreads: jest.fn().mockResolvedValue([THREAD]),
      getThread: jest.fn().mockResolvedValue(THREAD),
      assignThread: jest.fn().mockResolvedValue(THREAD),
      resolveThread: jest.fn().mockResolvedValue(THREAD),
      archiveThread: jest.fn().mockResolvedValue(THREAD),
      blockFromInbox: jest.fn().mockResolvedValue(undefined),
      reportFromInbox: jest.fn().mockResolvedValue(undefined),
      searchArchive: jest.fn().mockResolvedValue([THREAD]),
    };
    const mockCanned: CannedReplyRepository = {
      listCannedReplies: jest.fn().mockResolvedValue([CANNED_REPLY]),
      saveCannedReply: jest.fn().mockResolvedValue(CANNED_REPLY),
      deleteCannedReply: jest.fn().mockResolvedValue(undefined),
      getAutoReplyConfig: jest.fn().mockResolvedValue(AUTO_REPLY_CONFIG),
      saveAutoReplyConfig: jest.fn().mockResolvedValue(undefined),
    };

    const svc = createMessagingAdminService(mockThread, mockCanned);

    it("listThreads delegates to threadRepo.listThreads", async () => {
      const res = await svc.listThreads("t1", "open");
      expect(res.ok).toBe(true);
      if (res.ok) expect(res.data).toEqual([THREAD]);
      expect(mockThread.listThreads).toHaveBeenCalledWith("t1", "open");
    });

    it("assignThread delegates to threadRepo.assignThread", async () => {
      const input = { tenantId: "t1", threadId: "th1", staffId: "s1", staffName: "Alice", assignedBy: "mgr" };
      const res = await svc.assignThread(input);
      expect(res.ok).toBe(true);
      expect(mockThread.assignThread).toHaveBeenCalledWith(input);
    });

    it("listCannedReplies delegates to cannedRepo.listCannedReplies", async () => {
      const res = await svc.listCannedReplies("t1");
      expect(res.ok).toBe(true);
      if (res.ok) expect(res.data).toEqual([CANNED_REPLY]);
    });

    it("loadAutoReplyConfig delegates to cannedRepo.getAutoReplyConfig", async () => {
      const res = await svc.loadAutoReplyConfig("t1");
      expect(res.ok).toBe(true);
      if (res.ok) expect(res.data?.enabled).toBe(true);
    });

    it("saveAutoReplyConfig delegates to cannedRepo.saveAutoReplyConfig", async () => {
      const res = await svc.saveAutoReplyConfig(AUTO_REPLY_CONFIG);
      expect(res.ok).toBe(true);
      expect(mockCanned.saveAutoReplyConfig).toHaveBeenCalledWith(AUTO_REPLY_CONFIG);
    });

    it("searchArchive delegates to threadRepo.searchArchive", async () => {
      const filter = { status: "archived" as const, searchText: "hello" };
      const res = await svc.searchArchive("t1", filter);
      expect(res.ok).toBe(true);
      expect(mockThread.searchArchive).toHaveBeenCalledWith("t1", filter);
    });
  });

  describe("error normalisation", () => {
    const failThread: AdminThreadRepository = {
      listThreads: jest.fn().mockRejectedValue(new Error("Network error")),
      getThread: jest.fn().mockRejectedValue(new Error("Network error")),
      assignThread: jest.fn().mockRejectedValue(new Error("Network error")),
      resolveThread: jest.fn().mockRejectedValue(new Error("Network error")),
      archiveThread: jest.fn().mockRejectedValue(new Error("Network error")),
      blockFromInbox: jest.fn().mockRejectedValue(new Error("Network error")),
      reportFromInbox: jest.fn().mockRejectedValue(new Error("Network error")),
      searchArchive: jest.fn().mockRejectedValue(new Error("Network error")),
    };
    const svc = createMessagingAdminService(failThread);

    it("wraps thread repo errors as ok:false", async () => {
      const res = await svc.listThreads("t1");
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.message).toMatch(/Network error/i);
    });
  });
});

// ---------------------------------------------------------------------------
// waitlistAdminService — W46-DEBT-3
// ---------------------------------------------------------------------------

describe("waitlistAdminService (W46-DEBT-3)", () => {
  describe("not-configured path", () => {
    const svc = createWaitlistAdminService();

    it("listEntries → ok:false when no waitlistRepo", async () => {
      const res = await svc.listEntries("t1", "all");
      expect(res.ok).toBe(false);
    });

    it("notifyEntry → ok:false when no waitlistRepo", async () => {
      const res = await svc.notifyEntry("wl1", "t1");
      expect(res.ok).toBe(false);
    });

    it("convertToBooking → ok:false when no bookingRepo", async () => {
      const res = await svc.convertToBooking({
        waitlistId: "wl1",
        tenantId: "t1",
        staffId: "s1",
        locationId: "loc1",
        serviceId: "svc1",
        date: "2024-06-03",
        startTime: "10:00",
        durationMinutes: 60,
        notes: "",
        convertedBy: "u1",
      });
      expect(res.ok).toBe(false);
    });

    it("loadPolicy → ok:false when no policyRepo", async () => {
      const res = await svc.loadPolicy("t1");
      expect(res.ok).toBe(false);
    });
  });

  describe("happy path with mock repos", () => {
    const mockWaitlist: WaitlistAdminRepository = {
      list: jest.fn().mockResolvedValue([WAITLIST_ENTRY]),
      getEntry: jest.fn().mockResolvedValue(WAITLIST_ENTRY),
      notifyEntry: jest.fn().mockResolvedValue({ ...WAITLIST_ENTRY, status: "notified" }),
      cancelEntry: jest.fn().mockResolvedValue(undefined),
    };
    const mockBooking: WaitlistBookingRepository = {
      convertToBooking: jest.fn().mockResolvedValue({ bookingId: "b1", waitlistId: "wl1" } satisfies ConvertToBookingResult),
    };
    const mockPolicy: WaitlistPolicyRepository = {
      getPolicy: jest.fn().mockResolvedValue(WAITLIST_POLICY),
      savePolicy: jest.fn().mockResolvedValue(undefined),
    };

    const svc = createWaitlistAdminService(mockWaitlist, mockBooking, mockPolicy);

    it("listEntries delegates to waitlistRepo.list", async () => {
      const res = await svc.listEntries("t1", "waiting");
      expect(res.ok).toBe(true);
      if (res.ok) expect(res.data).toEqual([WAITLIST_ENTRY]);
      expect(mockWaitlist.list).toHaveBeenCalledWith("t1", "waiting");
    });

    it("getEntry delegates to waitlistRepo.getEntry", async () => {
      const res = await svc.getEntry("wl1", "t1");
      expect(res.ok).toBe(true);
      expect(mockWaitlist.getEntry).toHaveBeenCalledWith("wl1", "t1");
    });

    it("notifyEntry delegates to waitlistRepo.notifyEntry", async () => {
      const res = await svc.notifyEntry("wl1", "t1");
      expect(res.ok).toBe(true);
      if (res.ok) expect(res.data.status).toBe("notified");
    });

    it("cancelEntry delegates to waitlistRepo.cancelEntry", async () => {
      const res = await svc.cancelEntry("wl1", "t1", "mgr");
      expect(res.ok).toBe(true);
      expect(mockWaitlist.cancelEntry).toHaveBeenCalledWith("wl1", "t1", "mgr");
    });

    it("convertToBooking delegates to bookingRepo.convertToBooking", async () => {
      const input = {
        waitlistId: "wl1",
        tenantId: "t1",
        staffId: "s1",
        locationId: "loc1",
        serviceId: "svc1",
        date: "2024-06-03",
        startTime: "10:00",
        durationMinutes: 60,
        notes: "",
        convertedBy: "u1",
      };
      const res = await svc.convertToBooking(input);
      expect(res.ok).toBe(true);
      if (res.ok) expect(res.data.bookingId).toBe("b1");
      expect(mockBooking.convertToBooking).toHaveBeenCalledWith(input);
    });

    it("loadPolicy delegates to policyRepo.getPolicy", async () => {
      const res = await svc.loadPolicy("t1");
      expect(res.ok).toBe(true);
      if (res.ok) expect(res.data?.maxWaitDays).toBe(30);
    });

    it("savePolicy delegates to policyRepo.savePolicy", async () => {
      const res = await svc.savePolicy(WAITLIST_POLICY);
      expect(res.ok).toBe(true);
      expect(mockPolicy.savePolicy).toHaveBeenCalledWith(WAITLIST_POLICY);
    });
  });

  describe("error normalisation", () => {
    const failWaitlist: WaitlistAdminRepository = {
      list: jest.fn().mockRejectedValue(new Error("Permission denied")),
      getEntry: jest.fn().mockRejectedValue(new Error("Permission denied")),
      notifyEntry: jest.fn().mockRejectedValue(new Error("Permission denied")),
      cancelEntry: jest.fn().mockRejectedValue(new Error("Permission denied")),
    };
    const svc = createWaitlistAdminService(failWaitlist);

    it("wraps waitlist repo errors as ok:false", async () => {
      const res = await svc.listEntries("t1", "all");
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.message).toMatch(/Permission denied/i);
    });
  });
});

// ---------------------------------------------------------------------------
// Firestore adapter factory structure tests (W46-DEBT-1/2/3)
// Validates that adapters export correct method surfaces without a live db.
// ---------------------------------------------------------------------------

describe("Firestore adapter factory surfaces", () => {
  const fakeDb = {} as never;

  it("createFirestoreReviewQueueRepository exposes required methods", () => {
    const repo = createFirestoreReviewQueueRepository(fakeDb);
    expect(typeof repo.list).toBe("function");
    expect(typeof repo.getById).toBe("function");
    expect(typeof repo.getReputationStats).toBe("function");
  });

  it("createFirestoreReviewWriteRepository exposes required methods", () => {
    const repo = createFirestoreReviewWriteRepository(fakeDb);
    expect(typeof repo.saveReply).toBe("function");
    expect(typeof repo.flagReview).toBe("function");
    expect(typeof repo.disputeReview).toBe("function");
    expect(typeof repo.hideReview).toBe("function");
    expect(typeof repo.bulkAction).toBe("function");
    expect(typeof repo.saveAutomationRule).toBe("function");
    expect(typeof repo.listAutomationRules).toBe("function");
    expect(typeof repo.toggleAutomationRule).toBe("function");
    expect(typeof repo.deleteAutomationRule).toBe("function");
  });

  it("createFirestoreAdminThreadRepository exposes required methods", () => {
    const repo = createFirestoreAdminThreadRepository(fakeDb);
    expect(typeof repo.listThreads).toBe("function");
    expect(typeof repo.getThread).toBe("function");
    expect(typeof repo.assignThread).toBe("function");
    expect(typeof repo.resolveThread).toBe("function");
    expect(typeof repo.archiveThread).toBe("function");
    expect(typeof repo.blockFromInbox).toBe("function");
    expect(typeof repo.reportFromInbox).toBe("function");
    expect(typeof repo.searchArchive).toBe("function");
  });

  it("createFirestoreCannedReplyRepository exposes required methods", () => {
    const repo = createFirestoreCannedReplyRepository(fakeDb);
    expect(typeof repo.listCannedReplies).toBe("function");
    expect(typeof repo.saveCannedReply).toBe("function");
    expect(typeof repo.deleteCannedReply).toBe("function");
    expect(typeof repo.getAutoReplyConfig).toBe("function");
    expect(typeof repo.saveAutoReplyConfig).toBe("function");
  });

  it("createFirestoreWaitlistAdminRepository exposes required methods", () => {
    const repo = createFirestoreWaitlistAdminRepository(fakeDb);
    expect(typeof repo.list).toBe("function");
    expect(typeof repo.getEntry).toBe("function");
    expect(typeof repo.notifyEntry).toBe("function");
    expect(typeof repo.cancelEntry).toBe("function");
  });

  it("createFirestoreWaitlistBookingRepository exposes required methods", () => {
    const repo = createFirestoreWaitlistBookingRepository(fakeDb);
    expect(typeof repo.convertToBooking).toBe("function");
  });

  it("createFirestoreWaitlistPolicyRepository exposes required methods", () => {
    const repo = createFirestoreWaitlistPolicyRepository(fakeDb);
    expect(typeof repo.getPolicy).toBe("function");
    expect(typeof repo.savePolicy).toBe("function");
  });
});
