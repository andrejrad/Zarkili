/**
 * Tests for W16-DEBT-1 — onboarding session persistence port.
 *
 * The orchestrator's sync mutation API must remain unchanged, so persistence
 * is fire-and-forget. Hydration is exposed via the new async `restoreSession`.
 */

import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import {
  createClientOnboardingOrchestrator,
  type OnboardingPersistencePort,
  type OnboardingSession,
} from "../clientOnboardingOrchestrator";

// ---------------------------------------------------------------------------
// In-memory fake persistence
// ---------------------------------------------------------------------------

function makeFakePersistence(): {
  port: OnboardingPersistencePort;
  store: Map<string, OnboardingSession>;
  saveCalls: number;
  loadCalls: number;
  // resolve promises so tests can await fire-and-forget work
  flush: () => Promise<void>;
} {
  const store = new Map<string, OnboardingSession>();
  const inflight: Promise<unknown>[] = [];
  const stats = { saveCalls: 0, loadCalls: 0 };
  const port: OnboardingPersistencePort = {
    save: (session) => {
      stats.saveCalls += 1;
      const p = Promise.resolve().then(() => {
        store.set(session.sessionId, { ...session });
      });
      inflight.push(p);
      return p;
    },
    load: async (sessionId) => {
      stats.loadCalls += 1;
      const v = store.get(sessionId);
      return v ? { ...v } : null;
    },
  };
  return {
    port,
    store,
    get saveCalls() {
      return stats.saveCalls;
    },
    get loadCalls() {
      return stats.loadCalls;
    },
    flush: async () => {
      while (inflight.length > 0) {
        const batch = inflight.splice(0);
        await Promise.allSettled(batch);
      }
    },
  } as ReturnType<typeof makeFakePersistence>;
}

const guestCtx = {
  bookingId: "b-1",
  tenantId: "t-1",
  serviceId: "svc-1",
  slotAt: "2030-01-01T10:00:00Z",
  email: "guest@example.com",
  phone: "+1-555-0100",
};

const fullCreds = {
  userId: "u-1",
  email: "full@example.com",
  authProvider: "email" as const,
};

// ---------------------------------------------------------------------------
// 1. Backward compatibility — no persistence, sync API behaves as before
// ---------------------------------------------------------------------------

describe("clientOnboardingOrchestrator — persistence (W16-DEBT-1)", () => {
  describe("backward compatibility", () => {
    it("works without an options argument (existing public surface)", () => {
      const o = createClientOnboardingOrchestrator();
      const s = o.startGuestOnboarding(guestCtx);
      expect(s.mode).toBe("guest");
      expect(o.getSession(s.sessionId)).toBeDefined();
    });

    it("works with an empty options argument", () => {
      const o = createClientOnboardingOrchestrator({});
      const s = o.startFullOnboarding(fullCreds, "t-1");
      expect(s.mode).toBe("full");
    });

    it("restoreSession returns null when no persistence is configured", async () => {
      const o = createClientOnboardingOrchestrator();
      await expect(o.restoreSession("session-1")).resolves.toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // 2. Save calls — fire-and-forget after each mutation
  // -------------------------------------------------------------------------

  describe("persistence.save is invoked after each mutation", () => {
    it("saves on startGuestOnboarding", async () => {
      const f = makeFakePersistence();
      const o = createClientOnboardingOrchestrator({ persistence: f.port });
      const s = o.startGuestOnboarding(guestCtx);
      await f.flush();
      expect(f.saveCalls).toBe(1);
      expect(f.store.get(s.sessionId)?.mode).toBe("guest");
    });

    it("saves on startFullOnboarding", async () => {
      const f = makeFakePersistence();
      const o = createClientOnboardingOrchestrator({ persistence: f.port });
      const s = o.startFullOnboarding(fullCreds, "t-1");
      await f.flush();
      expect(f.saveCalls).toBe(1);
      expect(f.store.get(s.sessionId)?.mode).toBe("full");
    });

    it("saves on upgradeGuestToFull", async () => {
      const f = makeFakePersistence();
      const o = createClientOnboardingOrchestrator({ persistence: f.port });
      const s = o.startGuestOnboarding(guestCtx);
      o.upgradeGuestToFull(s.sessionId, fullCreds);
      await f.flush();
      expect(f.saveCalls).toBe(2);
      expect(f.store.get(s.sessionId)?.mode).toBe("full");
    });

    it("saves on completeModule, skipModule, and updatePreferences", async () => {
      const f = makeFakePersistence();
      const o = createClientOnboardingOrchestrator({ persistence: f.port });
      const s = o.startFullOnboarding(fullCreds, "t-1");
      o.completeModule(s.sessionId, "profile");
      o.skipModule(s.sessionId, "loyalty");
      o.updatePreferences(s.sessionId, { notificationsEnabled: true });
      await f.flush();
      expect(f.saveCalls).toBe(4); // start + complete + skip + update
      const persisted = f.store.get(s.sessionId);
      expect(persisted?.completedModules).toContain("profile");
      expect(persisted?.skippedModules).toContain("loyalty");
      expect(persisted?.preferences.notificationsEnabled).toBe(true);
    });

    it("saves on mergeWithExistingAccount", async () => {
      const f = makeFakePersistence();
      const o = createClientOnboardingOrchestrator({ persistence: f.port });
      const s = o.startGuestOnboarding(guestCtx);
      o.mergeWithExistingAccount(s.sessionId, "u-existing");
      await f.flush();
      expect(f.saveCalls).toBe(2);
      expect(f.store.get(s.sessionId)?.mode).toBe("merged");
    });

    it("does not throw or mutate state when save() rejects", async () => {
      const onError = jest.fn();
      const port: OnboardingPersistencePort = {
        save: () => Promise.reject(new Error("network down")),
        load: async () => null,
      };
      const o = createClientOnboardingOrchestrator({
        persistence: port,
        onPersistError: onError,
      });
      // Sync API must succeed even though persistence fails.
      const s = o.startGuestOnboarding(guestCtx);
      expect(s.mode).toBe("guest");
      // Allow the rejected microtask to flush.
      await new Promise((r) => setImmediate(r));
      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError.mock.calls[0]![0]).toBeInstanceOf(Error);
    });
  });

  // -------------------------------------------------------------------------
  // 3. restoreSession — hydrates from persistence
  // -------------------------------------------------------------------------

  describe("restoreSession", () => {
    it("returns null when the persisted document is missing", async () => {
      const f = makeFakePersistence();
      const o = createClientOnboardingOrchestrator({ persistence: f.port });
      await expect(o.restoreSession("session-missing")).resolves.toBeNull();
    });

    it("hydrates a previously persisted session into the in-memory map", async () => {
      // Pre-populate the store with a session created on a different device.
      const f = makeFakePersistence();
      const fakeSession: OnboardingSession = {
        sessionId: "session-42",
        tenantId: "t-1",
        mode: "guest",
        email: "guest@example.com",
        phone: "+1-555-0200",
        bookingContext: { ...guestCtx },
        completedModules: ["profile"],
        skippedModules: [],
        preferences: {
          notificationsEnabled: true,
          promotionsEnabled: false,
          loyaltyOptIn: false,
        },
        createdAt: 123,
      };
      f.store.set(fakeSession.sessionId, fakeSession);

      const o = createClientOnboardingOrchestrator({ persistence: f.port });
      const restored = await o.restoreSession("session-42");
      expect(restored).not.toBeNull();
      expect(restored?.sessionId).toBe("session-42");
      // Subsequent sync mutations must work on the restored session.
      const upgraded = o.upgradeGuestToFull("session-42", fullCreds);
      expect(upgraded.mode).toBe("full");
      expect(upgraded.bookingContext?.bookingId).toBe("b-1");
    });

    it("avoids id collisions after restore by bumping the internal counter", async () => {
      const f = makeFakePersistence();
      const fakeSession: OnboardingSession = {
        sessionId: "session-7",
        tenantId: "t-1",
        mode: "full",
        email: "x@example.com",
        userId: "u-x",
        completedModules: [],
        skippedModules: [],
        preferences: {
          notificationsEnabled: false,
          promotionsEnabled: false,
          loyaltyOptIn: false,
        },
        createdAt: 1,
      };
      f.store.set("session-7", fakeSession);

      const o = createClientOnboardingOrchestrator({ persistence: f.port });
      await o.restoreSession("session-7");
      const fresh = o.startGuestOnboarding(guestCtx);
      // First minted id must be > 7, not session-1, otherwise we'd clobber.
      expect(fresh.sessionId).toBe("session-8");
    });
  });
});
