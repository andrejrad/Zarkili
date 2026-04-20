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
});
