/** @jest-environment node */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment
} from "@firebase/rules-unit-testing";

const PROJECT_ID = "zarkili-firestore-rules";

let testEnv: RulesTestEnvironment;

jest.setTimeout(30000);

async function seedTenantMembership(tenantId: string, userId: string, role: string) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await context
      .firestore()
      .doc(`tenantUsers/${tenantId}_${userId}`)
      .set({ tenantId, userId, role });
  });
}

describe("Firestore multi-tenant rules", () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules: readFileSync(resolve(process.cwd(), "firestore.rules"), "utf8")
      }
    });
  });

  afterEach(async () => {
    if (testEnv) {
      await testEnv.clearFirestore();
    }
  });

  afterAll(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  it("blocks unauthenticated tenant reads", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().doc("tenants/tenantA").set({ name: "Tenant A" });
    });

    const db = testEnv.unauthenticatedContext().firestore();

    await assertFails(db.doc("tenants/tenantA").get());
  });

  it("allows tenant member reads only within their tenant", async () => {
    await seedTenantMembership("tenantA", "ownerA", "tenant_owner");

    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().doc("tenants/tenantA").set({ name: "Tenant A" });
      await context.firestore().doc("tenants/tenantB").set({ name: "Tenant B" });
    });

    const db = testEnv.authenticatedContext("ownerA").firestore();

    await assertSucceeds(db.doc("tenants/tenantA").get());
    await assertFails(db.doc("tenants/tenantB").get());
  });

  it("prevents client role from writing locations", async () => {
    await seedTenantMembership("tenantA", "clientA", "client");

    const db = testEnv.authenticatedContext("clientA").firestore();

    await assertFails(
      db.doc("locations/locA").set({
        tenantId: "tenantA",
        name: "Main",
        status: "active"
      })
    );
  });

  it("allows tenant admin to create locations in their tenant", async () => {
    await seedTenantMembership("tenantA", "adminA", "tenant_admin");

    const db = testEnv.authenticatedContext("adminA").firestore();

    await assertSucceeds(
      db.doc("locations/locA").set({
        tenantId: "tenantA",
        name: "Main",
        status: "active"
      })
    );
  });

  it("allows client booking create only for own customerUserId", async () => {
    await seedTenantMembership("tenantA", "clientA", "client");

    const db = testEnv.authenticatedContext("clientA").firestore();

    await assertSucceeds(
      db.doc("bookings/bookingOwn").set({
        tenantId: "tenantA",
        customerUserId: "clientA",
        status: "pending"
      })
    );

    await assertFails(
      db.doc("bookings/bookingOther").set({
        tenantId: "tenantA",
        customerUserId: "someoneElse",
        status: "pending"
      })
    );
  });

  it("blocks cross-tenant writes even for tenant admins", async () => {
    await seedTenantMembership("tenantA", "adminA", "tenant_admin");

    const db = testEnv.authenticatedContext("adminA").firestore();

    await assertFails(
      db.doc("services/serviceB").set({
        tenantId: "tenantB",
        name: "Deluxe",
        active: true
      })
    );
  });

  it("blocks tenant_admin from creating tenant_owner membership", async () => {
    await seedTenantMembership("tenantA", "adminA", "tenant_admin");

    const db = testEnv.authenticatedContext("adminA").firestore();

    await assertFails(
      db.doc("tenantUsers/tenantA_ownerB").set({
        tenantId: "tenantA",
        userId: "ownerB",
        role: "tenant_owner",
        status: "active"
      })
    );
  });

  it("blocks tenant user membership create when document id does not match tenant and user", async () => {
    await seedTenantMembership("tenantA", "ownerA", "tenant_owner");

    const db = testEnv.authenticatedContext("ownerA").firestore();

    await assertFails(
      db.doc("tenantUsers/wrong_id").set({
        tenantId: "tenantA",
        userId: "staffA",
        role: "technician",
        status: "active"
      })
    );
  });

  it("blocks tenant_admin from promoting a membership to tenant_owner", async () => {
    await seedTenantMembership("tenantA", "adminA", "tenant_admin");

    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().doc("tenantUsers/tenantA_staffA").set({
        tenantId: "tenantA",
        userId: "staffA",
        role: "technician",
        status: "active"
      });
    });

    const db = testEnv.authenticatedContext("adminA").firestore();

    await assertFails(
      db.doc("tenantUsers/tenantA_staffA").set(
        {
          role: "tenant_owner",
          status: "active",
          tenantId: "tenantA",
          userId: "staffA"
        },
        { merge: true }
      )
    );
  });

  it("allows tenant_owner to promote membership to tenant_owner", async () => {
    await seedTenantMembership("tenantA", "ownerA", "tenant_owner");

    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().doc("tenantUsers/tenantA_adminA").set({
        tenantId: "tenantA",
        userId: "adminA",
        role: "tenant_admin",
        status: "active"
      });
    });

    const db = testEnv.authenticatedContext("ownerA").firestore();

    await assertSucceeds(
      db.doc("tenantUsers/tenantA_adminA").set(
        {
          role: "tenant_owner",
          status: "active",
          tenantId: "tenantA",
          userId: "adminA"
        },
        { merge: true }
      )
    );
  });

  it("allows user to create and read own onboarding draft", async () => {
    await seedTenantMembership("tenantA", "clientA", "client");

    const db = testEnv.authenticatedContext("clientA").firestore();

    await assertSucceeds(
      db.doc("onboardingDrafts/tenantA_clientA_client").set({
        draftId: "tenantA_clientA_client",
        tenantId: "tenantA",
        userId: "clientA",
        flowType: "client",
        schemaVersion: 1,
        status: "draft",
        currentStep: "profile"
      })
    );

    await assertSucceeds(db.doc("onboardingDrafts/tenantA_clientA_client").get());
  });

  it("blocks user from writing onboarding draft for another user", async () => {
    await seedTenantMembership("tenantA", "clientA", "client");

    const db = testEnv.authenticatedContext("clientA").firestore();

    await assertFails(
      db.doc("onboardingDrafts/tenantA_other_client").set({
        draftId: "tenantA_other_client",
        tenantId: "tenantA",
        userId: "someoneElse",
        flowType: "client",
        schemaVersion: 1,
        status: "draft",
        currentStep: "profile"
      })
    );
  });

  it("allows platform admin to read and write platform config", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().doc("platform/config").set({
        aiBudgetConfig: {
          globalMonthlyCapUsd: 1090,
        },
      });
    });

    const db = testEnv
      .authenticatedContext("platformAdmin", { role: "platform_admin" })
      .firestore();

    await assertSucceeds(db.doc("platform/config").get());
    await assertSucceeds(
      db.doc("platform/config").set(
        {
          aiBudgetConfig: {
            globalMonthlyCapUsd: 1200,
          },
        },
        { merge: true }
      )
    );
  });

  it("blocks non-admin access to platform config", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().doc("platform/config").set({
        aiBudgetConfig: {
          globalMonthlyCapUsd: 1090,
        },
      });
    });

    const db = testEnv.authenticatedContext("tenantUser").firestore();

    await assertFails(db.doc("platform/config").get());
    await assertFails(
      db.doc("platform/config").set(
        {
          aiBudgetConfig: {
            globalMonthlyCapUsd: 1300,
          },
        },
        { merge: true }
      )
    );
  });

  it("blocks unauthenticated access to platform config", async () => {
    const db = testEnv.unauthenticatedContext().firestore();

    await assertFails(db.doc("platform/config").get());
    await assertFails(
      db.doc("platform/config").set({
        aiBudgetConfig: {
          globalMonthlyCapUsd: 1400,
        },
      })
    );
  });

  // ---------------------------------------------------------------------------
  // W15.1 — onboarding wizard drafts
  // ---------------------------------------------------------------------------

  it("allows tenant_owner to create an onboarding draft", async () => {
    await seedTenantMembership("tenantA", "ownerA", "tenant_owner");
    const db = testEnv.authenticatedContext("ownerA").firestore();

    await assertSucceeds(
      db.doc("tenants/tenantA/onboardingDrafts/BUSINESS_PROFILE").set({
        tenantId: "tenantA",
        step: "BUSINESS_PROFILE",
        schemaVersion: 1,
        payload: { legalName: "Acme" },
      })
    );
  });

  it("blocks technician from reading onboarding drafts", async () => {
    await seedTenantMembership("tenantA", "techA", "technician");
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().doc("tenants/tenantA/onboardingDrafts/SERVICES").set({
        tenantId: "tenantA",
        step: "SERVICES",
        schemaVersion: 1,
        payload: {},
      });
    });

    const db = testEnv.authenticatedContext("techA").firestore();
    await assertFails(db.doc("tenants/tenantA/onboardingDrafts/SERVICES").get());
  });

  it("blocks onboarding draft create with mismatched tenantId", async () => {
    await seedTenantMembership("tenantA", "ownerA", "tenant_owner");
    const db = testEnv.authenticatedContext("ownerA").firestore();

    await assertFails(
      db.doc("tenants/tenantA/onboardingDrafts/SERVICES").set({
        tenantId: "tenantB",
        step: "SERVICES",
        schemaVersion: 1,
        payload: {},
      })
    );
  });

  // ---------------------------------------------------------------------------
  // W15.2 — onboarding timeline (audit log)
  // ---------------------------------------------------------------------------

  it("allows tenant_owner to append a timeline event", async () => {
    await seedTenantMembership("tenantA", "ownerA", "tenant_owner");
    const db = testEnv.authenticatedContext("ownerA").firestore();

    await assertSucceeds(
      db.doc("tenants/tenantA/onboardingTimeline/evt-1").set({
        eventId: "evt-1",
        tenantId: "tenantA",
        action: "extend_trial",
        actorUserId: "ownerA",
        actorRole: "tenant_owner",
        reason: "VIP",
        details: { daysAdded: 7 },
      })
    );
  });

  it("blocks tenant_admin (non-owner) from writing timeline", async () => {
    await seedTenantMembership("tenantA", "adminA", "tenant_admin");
    const db = testEnv.authenticatedContext("adminA").firestore();

    await assertFails(
      db.doc("tenants/tenantA/onboardingTimeline/evt-2").set({
        eventId: "evt-2",
        tenantId: "tenantA",
        action: "reset_step",
        actorUserId: "adminA",
        actorRole: "tenant_owner",
        reason: "x",
        details: {},
      })
    );
  });

  it("rejects timeline events with empty reason", async () => {
    await seedTenantMembership("tenantA", "ownerA", "tenant_owner");
    const db = testEnv.authenticatedContext("ownerA").firestore();

    await assertFails(
      db.doc("tenants/tenantA/onboardingTimeline/evt-3").set({
        eventId: "evt-3",
        tenantId: "tenantA",
        action: "reset_step",
        actorUserId: "ownerA",
        actorRole: "tenant_owner",
        reason: "",
        details: {},
      })
    );
  });

  it("forbids updates and deletes on timeline events", async () => {
    await seedTenantMembership("tenantA", "ownerA", "tenant_owner");
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().doc("tenants/tenantA/onboardingTimeline/evt-4").set({
        eventId: "evt-4",
        tenantId: "tenantA",
        action: "reset_step",
        actorUserId: "ownerA",
        actorRole: "tenant_owner",
        reason: "seed",
        details: {},
      });
    });

    const db = testEnv.authenticatedContext("ownerA").firestore();
    await assertFails(
      db.doc("tenants/tenantA/onboardingTimeline/evt-4").set({ reason: "edited" }, { merge: true })
    );
    await assertFails(db.doc("tenants/tenantA/onboardingTimeline/evt-4").delete());
  });

  // -------------------------------------------------------------------------
  // KI-003 — Loyalty + Campaigns Firestore rules
  // -------------------------------------------------------------------------

  describe("loyaltyConfig", () => {
    it("tenant member (client) may read loyaltyConfig", async () => {
      await seedTenantMembership("tenantA", "lcClient1", "client");
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await ctx.firestore().doc("tenants/tenantA/loyaltyConfig/default").set({ pointsPerUsd: 10 });
      });
      const db = testEnv.authenticatedContext("lcClient1").firestore();
      await assertSucceeds(db.doc("tenants/tenantA/loyaltyConfig/default").get());
    });

    it("tenant admin may write loyaltyConfig", async () => {
      await seedTenantMembership("tenantA", "lcAdmin1", "tenant_admin");
      const db = testEnv.authenticatedContext("lcAdmin1").firestore();
      await assertSucceeds(
        db.doc("tenants/tenantA/loyaltyConfig/default").set({ pointsPerUsd: 20 })
      );
    });

    it("client cannot write loyaltyConfig", async () => {
      await seedTenantMembership("tenantA", "lcClient2", "client");
      const db = testEnv.authenticatedContext("lcClient2").firestore();
      await assertFails(
        db.doc("tenants/tenantA/loyaltyConfig/default").set({ pointsPerUsd: 99 })
      );
    });

    it("unauthenticated user cannot read loyaltyConfig", async () => {
      const db = testEnv.unauthenticatedContext().firestore();
      await assertFails(db.doc("tenants/tenantA/loyaltyConfig/default").get());
    });
  });

  describe("loyaltyStates", () => {
    it("client may read their own loyalty state (doc id == uid)", async () => {
      await seedTenantMembership("tenantA", "lsClient1", "client");
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await ctx.firestore().doc("tenants/tenantA/loyaltyStates/lsClient1").set({ points: 50 });
      });
      const db = testEnv.authenticatedContext("lsClient1").firestore();
      await assertSucceeds(db.doc("tenants/tenantA/loyaltyStates/lsClient1").get());
    });

    it("client cannot read another user's loyalty state", async () => {
      await seedTenantMembership("tenantA", "lsClient2", "client");
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await ctx.firestore().doc("tenants/tenantA/loyaltyStates/otherUserLS").set({ points: 50 });
      });
      const db = testEnv.authenticatedContext("lsClient2").firestore();
      await assertFails(db.doc("tenants/tenantA/loyaltyStates/otherUserLS").get());
    });

    it("tenant admin may read any loyalty state", async () => {
      await seedTenantMembership("tenantA", "lsAdmin1", "tenant_admin");
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await ctx.firestore().doc("tenants/tenantA/loyaltyStates/someClientLS").set({ points: 30 });
      });
      const db = testEnv.authenticatedContext("lsAdmin1").firestore();
      await assertSucceeds(db.doc("tenants/tenantA/loyaltyStates/someClientLS").get());
    });

    it("client cannot write loyalty state directly", async () => {
      await seedTenantMembership("tenantA", "lsClient3", "client");
      const db = testEnv.authenticatedContext("lsClient3").firestore();
      await assertFails(
        db.doc("tenants/tenantA/loyaltyStates/lsClient3").set({ points: 999 })
      );
    });
  });

  describe("loyaltyTransactions", () => {
    it("tenant admin may write a loyalty transaction", async () => {
      await seedTenantMembership("tenantA", "ltAdmin1", "tenant_admin");
      const db = testEnv.authenticatedContext("ltAdmin1").firestore();
      await assertSucceeds(
        db.doc("tenants/tenantA/loyaltyTransactions/tx-001").set({ userId: "clientX", delta: 10 })
      );
    });

    it("client cannot write a loyalty transaction", async () => {
      await seedTenantMembership("tenantA", "ltClient1", "client");
      const db = testEnv.authenticatedContext("ltClient1").firestore();
      await assertFails(
        db.doc("tenants/tenantA/loyaltyTransactions/tx-002").set({ userId: "ltClient1", delta: 10 })
      );
    });

    it("client may read their own loyalty transactions (resource.data.userId == uid)", async () => {
      await seedTenantMembership("tenantA", "ltClient2", "client");
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await ctx.firestore().doc("tenants/tenantA/loyaltyTransactions/tx-003").set({
          userId: "ltClient2",
          delta: 5,
        });
      });
      const db = testEnv.authenticatedContext("ltClient2").firestore();
      await assertSucceeds(db.doc("tenants/tenantA/loyaltyTransactions/tx-003").get());
    });

    it("client cannot read another user's loyalty transaction", async () => {
      await seedTenantMembership("tenantA", "ltClient3", "client");
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await ctx.firestore().doc("tenants/tenantA/loyaltyTransactions/tx-004").set({
          userId: "anotherClientLT",
          delta: 5,
        });
      });
      const db = testEnv.authenticatedContext("ltClient3").firestore();
      await assertFails(db.doc("tenants/tenantA/loyaltyTransactions/tx-004").get());
    });
  });

  describe("campaigns", () => {
    it("tenant admin may read campaigns", async () => {
      await seedTenantMembership("tenantA", "campAdmin1", "tenant_admin");
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await ctx.firestore().doc("tenants/tenantA/campaigns/camp-001").set({ name: "Summer Sale" });
      });
      const db = testEnv.authenticatedContext("campAdmin1").firestore();
      await assertSucceeds(db.doc("tenants/tenantA/campaigns/camp-001").get());
    });

    it("location_manager may read campaigns", async () => {
      await seedTenantMembership("tenantA", "campLM1", "location_manager");
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await ctx.firestore().doc("tenants/tenantA/campaigns/camp-001").set({ name: "Summer Sale" });
      });
      const db = testEnv.authenticatedContext("campLM1").firestore();
      await assertSucceeds(db.doc("tenants/tenantA/campaigns/camp-001").get());
    });

    it("client cannot read campaigns", async () => {
      await seedTenantMembership("tenantA", "campClient1", "client");
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await ctx.firestore().doc("tenants/tenantA/campaigns/camp-001").set({ name: "Summer Sale" });
      });
      const db = testEnv.authenticatedContext("campClient1").firestore();
      await assertFails(db.doc("tenants/tenantA/campaigns/camp-001").get());
    });

    it("tenant owner may write campaigns", async () => {
      await seedTenantMembership("tenantA", "campOwner1", "tenant_owner");
      const db = testEnv.authenticatedContext("campOwner1").firestore();
      await assertSucceeds(
        db.doc("tenants/tenantA/campaigns/camp-002").set({ name: "Winter Deal" })
      );
    });

    it("location_manager cannot write campaigns", async () => {
      await seedTenantMembership("tenantA", "campLM2", "location_manager");
      const db = testEnv.authenticatedContext("campLM2").firestore();
      await assertFails(
        db.doc("tenants/tenantA/campaigns/camp-003").set({ name: "Unauthorised" })
      );
    });

    it("client cannot write campaigns", async () => {
      await seedTenantMembership("tenantA", "campClient2", "client");
      const db = testEnv.authenticatedContext("campClient2").firestore();
      await assertFails(
        db.doc("tenants/tenantA/campaigns/camp-004").set({ name: "Spam" })
      );
    });
  });
});
