/**
 * Tests for `createFirestoreOnboardingPersistence` — the W16-DEBT-1 adapter.
 */

import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import { createFirestoreOnboardingPersistence } from "../clientOnboardingFirestorePersistence";
import type { OnboardingSession } from "../clientOnboardingOrchestrator";

// ---------------------------------------------------------------------------
// In-memory Firestore mock
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

  return { doc, getDoc, setDoc, store };
}

let mock: ReturnType<typeof makeFirestoreMock>;

jest.mock("firebase/firestore", () => ({
  doc: (...args: unknown[]) =>
    mock.doc(...(args as Parameters<typeof mock.doc>)),
  getDoc: (...args: unknown[]) =>
    mock.getDoc(...(args as Parameters<typeof mock.getDoc>)),
  setDoc: (...args: unknown[]) =>
    mock.setDoc(...(args as Parameters<typeof mock.setDoc>)),
}));

beforeEach(() => {
  mock = makeFirestoreMock();
});

afterEach(() => {
  // no-op
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSession(overrides: Partial<OnboardingSession> = {}): OnboardingSession {
  return {
    sessionId: "session-1",
    tenantId: "t-1",
    mode: "guest",
    email: "guest@example.com",
    phone: "+1-555-0100",
    bookingContext: {
      bookingId: "b-1",
      tenantId: "t-1",
      serviceId: "svc-1",
      slotAt: "2030-01-01T10:00:00Z",
      email: "guest@example.com",
    },
    completedModules: [],
    skippedModules: [],
    preferences: {
      notificationsEnabled: false,
      promotionsEnabled: false,
      loyaltyOptIn: false,
    },
    createdAt: 1000,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("createFirestoreOnboardingPersistence", () => {
  describe("save", () => {
    it("writes to userOnboardingDrafts/{sessionId}", async () => {
      const port = createFirestoreOnboardingPersistence({} as never);
      const session = makeSession();
      await port.save(session);
      const stored = mock.store["userOnboardingDrafts/session-1"];
      expect(stored).toBeDefined();
      expect(stored.sessionId).toBe("session-1");
      expect(stored.mode).toBe("guest");
    });

    it("strips undefined optional fields (Firestore rejects undefined)", async () => {
      const port = createFirestoreOnboardingPersistence({} as never);
      const session = makeSession({
        // a guest session with no userId / upgradedAt / mergedAt / mergeStrategy
        userId: undefined,
        upgradedAt: undefined,
        mergedAt: undefined,
        mergeStrategy: undefined,
      });
      await port.save(session);
      const stored = mock.store["userOnboardingDrafts/session-1"];
      expect(stored).not.toHaveProperty("userId");
      expect(stored).not.toHaveProperty("upgradedAt");
      expect(stored).not.toHaveProperty("mergedAt");
      expect(stored).not.toHaveProperty("mergeStrategy");
    });

    it("preserves merge metadata when present", async () => {
      const port = createFirestoreOnboardingPersistence({} as never);
      const session = makeSession({
        mode: "merged",
        userId: "u-existing",
        mergedAt: 2000,
        mergeStrategy: "preserve_existing",
      });
      await port.save(session);
      const stored = mock.store["userOnboardingDrafts/session-1"];
      expect(stored.mode).toBe("merged");
      expect(stored.userId).toBe("u-existing");
      expect(stored.mergedAt).toBe(2000);
      expect(stored.mergeStrategy).toBe("preserve_existing");
    });
  });

  describe("load", () => {
    it("returns null when the doc does not exist", async () => {
      const port = createFirestoreOnboardingPersistence({} as never);
      await expect(port.load("session-missing")).resolves.toBeNull();
    });

    it("round-trips a session through save -> load", async () => {
      const port = createFirestoreOnboardingPersistence({} as never);
      const session = makeSession({
        completedModules: ["profile", "payment"],
        skippedModules: ["loyalty"],
        preferences: {
          notificationsEnabled: true,
          promotionsEnabled: false,
          loyaltyOptIn: true,
        },
      });
      await port.save(session);
      const loaded = await port.load("session-1");
      expect(loaded).not.toBeNull();
      expect(loaded?.completedModules).toEqual(["profile", "payment"]);
      expect(loaded?.skippedModules).toEqual(["loyalty"]);
      expect(loaded?.preferences.notificationsEnabled).toBe(true);
      expect(loaded?.preferences.loyaltyOptIn).toBe(true);
    });

    it("filters out unknown module values defensively", async () => {
      mock.store["userOnboardingDrafts/session-1"] = {
        sessionId: "session-1",
        tenantId: "t-1",
        mode: "guest",
        email: "g@example.com",
        completedModules: ["profile", "garbage", 123, null],
        skippedModules: ["loyalty", "another-bogus"],
        preferences: { notificationsEnabled: false, promotionsEnabled: false, loyaltyOptIn: false },
        createdAt: 1,
      };
      const port = createFirestoreOnboardingPersistence({} as never);
      const loaded = await port.load("session-1");
      expect(loaded?.completedModules).toEqual(["profile"]);
      expect(loaded?.skippedModules).toEqual(["loyalty"]);
    });

    it("returns null when the persisted doc is missing required fields", async () => {
      mock.store["userOnboardingDrafts/session-1"] = {
        // missing sessionId / tenantId
        mode: "guest",
        email: "x@example.com",
        createdAt: 1,
      };
      const port = createFirestoreOnboardingPersistence({} as never);
      await expect(port.load("session-1")).resolves.toBeNull();
    });

    it("returns null when mode is invalid", async () => {
      mock.store["userOnboardingDrafts/session-1"] = {
        sessionId: "session-1",
        tenantId: "t-1",
        mode: "rogue",
        email: "x@example.com",
        createdAt: 1,
      };
      const port = createFirestoreOnboardingPersistence({} as never);
      await expect(port.load("session-1")).resolves.toBeNull();
    });

    it("coerces missing preferences into consent-safe defaults", async () => {
      mock.store["userOnboardingDrafts/session-1"] = {
        sessionId: "session-1",
        tenantId: "t-1",
        mode: "full",
        email: "x@example.com",
        userId: "u-1",
        completedModules: [],
        skippedModules: [],
        // preferences intentionally missing
        createdAt: 1,
      };
      const port = createFirestoreOnboardingPersistence({} as never);
      const loaded = await port.load("session-1");
      expect(loaded?.preferences).toEqual({
        notificationsEnabled: false,
        promotionsEnabled: false,
        loyaltyOptIn: false,
      });
    });
  });
});
