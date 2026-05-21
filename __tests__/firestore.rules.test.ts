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

  // NEW-DEBT-B: loyalty state docs moved from tenants/{tid}/loyaltyStates/{uid}
  // to top-level user_brand_loyalty/{uid}_{bid}. Legacy path is read-locked to
  // platform admin only. New path mirrors the prior semantics on the spec shape.
  describe("user_brand_loyalty (v3 path)", () => {
    it("client may read their own loyalty state (composite docId starts with uid)", async () => {
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await ctx.firestore()
          .doc("user_brand_loyalty/lsClient1_tenantA")
          .set({ userId: "lsClient1", brandId: "tenantA", points: 50, pointsBalance: 50 });
      });
      const db = testEnv.authenticatedContext("lsClient1").firestore();
      await assertSucceeds(db.doc("user_brand_loyalty/lsClient1_tenantA").get());
    });

    it("client cannot read another user's loyalty state", async () => {
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await ctx.firestore()
          .doc("user_brand_loyalty/otherUserLS_tenantA")
          .set({ userId: "otherUserLS", brandId: "tenantA", points: 50, pointsBalance: 50 });
      });
      const db = testEnv.authenticatedContext("lsClient2").firestore();
      await assertFails(db.doc("user_brand_loyalty/otherUserLS_tenantA").get());
    });

    it("tenant admin may read any loyalty state for their brand", async () => {
      await seedTenantMembership("tenantA", "lsAdmin1", "tenant_admin");
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await ctx.firestore()
          .doc("user_brand_loyalty/someClientLS_tenantA")
          .set({ userId: "someClientLS", brandId: "tenantA", points: 30, pointsBalance: 30 });
      });
      const db = testEnv.authenticatedContext("lsAdmin1").firestore();
      await assertSucceeds(db.doc("user_brand_loyalty/someClientLS_tenantA").get());
    });

    it("client cannot write loyalty state directly", async () => {
      const db = testEnv.authenticatedContext("lsClient3").firestore();
      await assertFails(
        db.doc("user_brand_loyalty/lsClient3_tenantA")
          .set({ userId: "lsClient3", brandId: "tenantA", points: 999, pointsBalance: 999 })
      );
    });
  });

  describe("loyaltyStates (legacy path \u2014 read-locked post NEW-DEBT-B)", () => {
    it("client may not read legacy nested loyalty state", async () => {
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await ctx.firestore().doc("tenants/tenantA/loyaltyStates/lsClient1").set({ points: 50 });
      });
      const db = testEnv.authenticatedContext("lsClient1").firestore();
      await assertFails(db.doc("tenants/tenantA/loyaltyStates/lsClient1").get());
    });

    it("tenant admin may not write to legacy nested path", async () => {
      await seedTenantMembership("tenantA", "lsAdmin1", "tenant_admin");
      const db = testEnv.authenticatedContext("lsAdmin1").firestore();
      await assertFails(
        db.doc("tenants/tenantA/loyaltyStates/lsClient1").set({ points: 1 })
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

  // NEW-DEBT-B B2e: service_types moved from services/{serviceId} to
  // brands/{brandId}/locations/{locationId}/service_types/{serviceTypeId}.
  // Legacy services/ path is now read-only for platform admin only (writes locked).
  describe("service_types (v3 path — brands hierarchy)", () => {
    it("unauthenticated user may read a service_types doc", async () => {
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await ctx.firestore()
          .doc("brands/tenantA/locations/loc1/service_types/svc1")
          .set({ brandId: "tenantA", locationId: "loc1", name: "Gel manicure", isActive: true });
      });
      const db = testEnv.unauthenticatedContext().firestore();
      await assertSucceeds(db.doc("brands/tenantA/locations/loc1/service_types/svc1").get());
    });

    it("tenant admin may create a service_types doc with matching brandId + locationId", async () => {
      await seedTenantMembership("tenantA", "svcAdmin1", "tenant_admin");
      const db = testEnv.authenticatedContext("svcAdmin1").firestore();
      await assertSucceeds(
        db.doc("brands/tenantA/locations/loc1/service_types/svc2").set({
          brandId: "tenantA",
          locationId: "loc1",
          name: "Lash lift",
          isActive: true,
        })
      );
    });

    it("tenant admin may update a service_types doc", async () => {
      await seedTenantMembership("tenantA", "svcAdmin2", "tenant_admin");
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await ctx.firestore()
          .doc("brands/tenantA/locations/loc1/service_types/svc3")
          .set({ brandId: "tenantA", locationId: "loc1", name: "Brow tint" });
      });
      const db = testEnv.authenticatedContext("svcAdmin2").firestore();
      await assertSucceeds(
        db.doc("brands/tenantA/locations/loc1/service_types/svc3").update({ name: "Brow lamination" })
      );
    });

    it("client cannot create a service_types doc", async () => {
      await seedTenantMembership("tenantA", "svcClient1", "client");
      const db = testEnv.authenticatedContext("svcClient1").firestore();
      await assertFails(
        db.doc("brands/tenantA/locations/loc1/service_types/svc-bad").set({
          brandId: "tenantA",
          locationId: "loc1",
          name: "Hack",
        })
      );
    });

    it("tenant admin from a different tenant cannot write", async () => {
      await seedTenantMembership("tenantB", "svcAdminB", "tenant_admin");
      const db = testEnv.authenticatedContext("svcAdminB").firestore();
      await assertFails(
        db.doc("brands/tenantA/locations/loc1/service_types/svc-bad2").set({
          brandId: "tenantA",
          locationId: "loc1",
          name: "Cross-tenant hack",
        })
      );
    });

    it("unauthenticated user may read a variant", async () => {
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await ctx.firestore()
          .doc("brands/tenantA/locations/loc1/service_types/svc1/variants/v1")
          .set({ name: "Short", price: 2500 });
      });
      const db = testEnv.unauthenticatedContext().firestore();
      await assertSucceeds(
        db.doc("brands/tenantA/locations/loc1/service_types/svc1/variants/v1").get()
      );
    });

    it("tenant admin may write a variant", async () => {
      await seedTenantMembership("tenantA", "svcAdmin3", "tenant_admin");
      const db = testEnv.authenticatedContext("svcAdmin3").firestore();
      await assertSucceeds(
        db.doc("brands/tenantA/locations/loc1/service_types/svc1/variants/v2").set({
          name: "Long",
          price: 3500,
        })
      );
    });

    it("client cannot write a variant", async () => {
      await seedTenantMembership("tenantA", "svcClient2", "client");
      const db = testEnv.authenticatedContext("svcClient2").firestore();
      await assertFails(
        db.doc("brands/tenantA/locations/loc1/service_types/svc1/variants/v-bad").set({
          name: "Hack",
          price: 1,
        })
      );
    });
  });

  describe("services (legacy path — write-locked post NEW-DEBT-B B2e)", () => {
    it("unauthenticated user may still read a legacy services doc (migration window)", async () => {
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await ctx.firestore()
          .doc("services/svc-legacy-1")
          .set({ tenantId: "tenantA", name: "Old gel manicure" });
      });
      const db = testEnv.unauthenticatedContext().firestore();
      await assertSucceeds(db.doc("services/svc-legacy-1").get());
    });

    it("tenant admin cannot write to legacy services path", async () => {
      await seedTenantMembership("tenantA", "legacyAdmin1", "tenant_admin");
      const db = testEnv.authenticatedContext("legacyAdmin1").firestore();
      await assertFails(
        db.doc("services/svc-legacy-new").set({ tenantId: "tenantA", name: "New service" })
      );
    });

    it("client cannot write to legacy services path", async () => {
      await seedTenantMembership("tenantA", "legacyClient1", "client");
      const db = testEnv.authenticatedContext("legacyClient1").firestore();
      await assertFails(
        db.doc("services/svc-legacy-client").set({ tenantId: "tenantA", name: "Attempt" })
      );
    });

    it("tenant admin cannot write to legacy services variant subcollection", async () => {
      await seedTenantMembership("tenantA", "legacyAdmin2", "tenant_admin");
      const db = testEnv.authenticatedContext("legacyAdmin2").firestore();
      await assertFails(
        db.doc("services/svc-legacy-1/variants/v-old").set({ name: "Short", price: 2500 })
      );
    });
  });
});
