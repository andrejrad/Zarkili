/**
 * waitlistNotificationService.test.ts
 *
 * Unit tests for the slot-open → notify automation.
 */

import {
  createWaitlistNotificationService,
  type SlotOpenedEvent,
  type NotificationSender,
  type NotificationPayload,
} from "../waitlistNotificationService";
import type { WaitlistRepository } from "../../../domains/waitlist/repository";
import type { WaitlistMatchCandidate } from "../../../domains/waitlist/model";

// ---------------------------------------------------------------------------
// In-memory Firestore mock (minimal — just throttle logs)
// ---------------------------------------------------------------------------

function makeFirestoreMock() {
  const store: Record<string, Record<string, unknown>> = {};

  function doc(_db: unknown, col: string, id: string) {
    return { _key: `${col}/${id}` };
  }

  async function getDoc(ref: { _key: string }) {
    const data = store[ref._key];
    return {
      exists: () => data !== undefined,
      data: () => (data !== undefined ? { ...data } : undefined),
    };
  }

  async function setDoc(ref: { _key: string }, data: Record<string, unknown>) {
    store[ref._key] = { ...data };
  }

  function getStore() {
    return store;
  }

  return { doc, getDoc, setDoc, getStore };
}

let mock: ReturnType<typeof makeFirestoreMock>;

jest.mock("firebase/firestore", () => ({
  doc: (...args: any[]) => mock.doc(...(args as Parameters<typeof mock.doc>)),
  getDoc: (...args: any[]) => mock.getDoc(...(args as Parameters<typeof mock.getDoc>)),
  setDoc: (...args: any[]) => mock.setDoc(...(args as Parameters<typeof mock.setDoc>)),
}));

beforeEach(() => {
  mock = makeFirestoreMock();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCandidate(overrides: Partial<WaitlistMatchCandidate> = {}): WaitlistMatchCandidate {
  return {
    entryId: "entry1",
    userId: "u1",
    tenantId: "t1",
    locationId: "l1",
    serviceId: "svc1",
    staffId: null,
    dateFrom: "2025-01-01",
    dateTo: "2025-01-31",
    lastNotifiedAt: null,
    ...overrides,
  };
}

function makeEvent(overrides: Partial<SlotOpenedEvent> = {}): SlotOpenedEvent {
  return {
    tenantId: "t1",
    locationId: "l1",
    serviceId: "svc1",
    staffId: "staff1",
    date: "2025-01-15",
    slotId: "slot1",
    ...overrides,
  };
}

function makeRepo(candidates: WaitlistMatchCandidate[]): WaitlistRepository {
  const markedMatched: string[] = [];
  const updatedNotifiedAt: string[] = [];

  return {
    joinWaitlist: jest.fn(),
    leaveWaitlist: jest.fn(),
    listWaitlistByLocation: jest.fn(),
    findMatchingWaitlistEntries: jest.fn().mockResolvedValue(candidates),
    markMatched: jest.fn().mockImplementation((entryId) => {
      markedMatched.push(entryId);
      return Promise.resolve();
    }),
    updateLastNotifiedAt: jest.fn().mockImplementation((entryId) => {
      updatedNotifiedAt.push(entryId);
      return Promise.resolve();
    }),
    _markedMatched: markedMatched,
    _updatedNotifiedAt: updatedNotifiedAt,
  } as unknown as WaitlistRepository & {
    _markedMatched: string[];
    _updatedNotifiedAt: string[];
  };
}

function makeSender(): NotificationSender & { sent: NotificationPayload[] } {
  const sent: NotificationPayload[] = [];
  return {
    sent,
    sendNotification: jest.fn().mockImplementation((payload: NotificationPayload) => {
      sent.push(payload);
      return Promise.resolve();
    }),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("handleSlotOpened — no candidates", () => {
  it("returns zeroes when no matching entries", async () => {
    const repo = makeRepo([]);
    const sender = makeSender();
    const svc = createWaitlistNotificationService(null as any, repo, sender);
    const result = await svc.handleSlotOpened(makeEvent());
    expect(result).toEqual({ notified: 0, skipped: 0, errors: 0 });
    expect(sender.sent).toHaveLength(0);
  });
});

describe("handleSlotOpened — basic notification", () => {
  it("notifies a single candidate", async () => {
    const repo = makeRepo([makeCandidate()]);
    const sender = makeSender();
    const svc = createWaitlistNotificationService(null as any, repo, sender);
    const result = await svc.handleSlotOpened(makeEvent());
    expect(result.notified).toBe(1);
    expect(result.skipped).toBe(0);
    expect(result.errors).toBe(0);
    expect(sender.sent).toHaveLength(1);
    expect(sender.sent[0].userId).toBe("u1");
  });

  it("notification payload contains correct fields", async () => {
    const repo = makeRepo([makeCandidate()]);
    const sender = makeSender();
    const svc = createWaitlistNotificationService(null as any, repo, sender);
    await svc.handleSlotOpened(makeEvent());
    const payload = sender.sent[0];
    expect(payload.data.type).toBe("waitlist_slot_available");
    expect(payload.data.slotId).toBe("slot1");
    expect(payload.data.serviceId).toBe("svc1");
    expect(payload.data.locationId).toBe("l1");
    expect(payload.data.date).toBe("2025-01-15");
    expect(payload.data.waitlistEntryId).toBe("entry1");
  });

  it("updates lastNotifiedAt for each notified candidate", async () => {
    const repo = makeRepo([makeCandidate()]) as any;
    const sender = makeSender();
    const svc = createWaitlistNotificationService(null as any, repo, sender);
    await svc.handleSlotOpened(makeEvent());
    expect(repo.updateLastNotifiedAt).toHaveBeenCalledWith(
      "entry1",
      "t1",
      expect.any(String),
    );
  });

  it("writes throttle log after sending", async () => {
    const repo = makeRepo([makeCandidate()]);
    const sender = makeSender();
    const svc = createWaitlistNotificationService(null as any, repo, sender);
    await svc.handleSlotOpened(makeEvent());
    const store = mock.getStore();
    const logKey = "waitlistNotificationLogs/entry1_slot1";
    expect(store[logKey]).toBeDefined();
    expect(store[logKey].entryId).toBe("entry1");
    expect(store[logKey].slotId).toBe("slot1");
  });

  it("notifies multiple candidates", async () => {
    const candidates = [
      makeCandidate({ entryId: "e1", userId: "u1" }),
      makeCandidate({ entryId: "e2", userId: "u2" }),
      makeCandidate({ entryId: "e3", userId: "u3" }),
    ];
    const repo = makeRepo(candidates);
    const sender = makeSender();
    const svc = createWaitlistNotificationService(null as any, repo, sender);
    const result = await svc.handleSlotOpened(makeEvent());
    expect(result.notified).toBe(3);
    expect(sender.sent).toHaveLength(3);
  });
});

describe("handleSlotOpened — throttle", () => {
  it("skips candidate that was already notified within cooldown", async () => {
    // Pre-seed a log that was just sent
    mock.getStore()["waitlistNotificationLogs/entry1_slot1"] = { sentAt: Date.now(), entryId: "entry1", slotId: "slot1" };
    const repo = makeRepo([makeCandidate()]);
    const sender = makeSender();
    const svc = createWaitlistNotificationService(null as any, repo, sender, {
      throttleCooldownMs: 60 * 60 * 1000, // 1 hour
    });
    const result = await svc.handleSlotOpened(makeEvent());
    expect(result.notified).toBe(0);
    expect(result.skipped).toBe(1);
    expect(sender.sent).toHaveLength(0);
  });

  it("notifies candidate again after cooldown has passed", async () => {
    // Pre-seed a log from 2 hours ago
    mock.getStore()["waitlistNotificationLogs/entry1_slot1"] = {
      sentAt: Date.now() - 2 * 60 * 60 * 1000,
      entryId: "entry1",
      slotId: "slot1",
    };
    const repo = makeRepo([makeCandidate()]);
    const sender = makeSender();
    const svc = createWaitlistNotificationService(null as any, repo, sender, {
      throttleCooldownMs: 60 * 60 * 1000, // 1 hour
    });
    const result = await svc.handleSlotOpened(makeEvent());
    expect(result.notified).toBe(1);
    expect(result.skipped).toBe(0);
  });

  it("throttles some, notifies others independently", async () => {
    // e1 was already notified
    mock.getStore()["waitlistNotificationLogs/e1_slot1"] = { sentAt: Date.now(), entryId: "e1", slotId: "slot1" };
    const candidates = [
      makeCandidate({ entryId: "e1", userId: "u1" }),
      makeCandidate({ entryId: "e2", userId: "u2" }),
    ];
    const repo = makeRepo(candidates);
    const sender = makeSender();
    const svc = createWaitlistNotificationService(null as any, repo, sender, {
      throttleCooldownMs: 60 * 60 * 1000,
    });
    const result = await svc.handleSlotOpened(makeEvent());
    expect(result.notified).toBe(1);
    expect(result.skipped).toBe(1);
    expect(sender.sent[0].userId).toBe("u2");
  });
});
