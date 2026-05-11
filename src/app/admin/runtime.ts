import { createLocationRepository } from "../../domains/locations";
import { createTenantRepository } from "../../domains/tenants";
import { createStaffRepository } from "../../domains/staff";
import { createServiceRepository } from "../../domains/services";
import { db } from "../../shared/config/firebase";

import { createTenantLocationAdminService } from "./tenantLocationAdminService";
import { createStaffAdminService } from "./staffAdminService";
import { createServiceAdminService } from "./serviceAdminService";
import { createOwnerKpiService } from "./ownerKpiService";

import {
  createFirestoreReviewQueueRepository,
  createFirestoreReviewWriteRepository,
} from "./reviewAdminRepository";
import { createReviewAdminService } from "./reviewAdminService";

import {
  createFirestoreAdminThreadRepository,
  createFirestoreCannedReplyRepository,
} from "./messagingAdminRepository";
import { createMessagingAdminService } from "./messagingAdminService";

import {
  createFirestoreWaitlistAdminRepository,
  createFirestoreWaitlistBookingRepository,
  createFirestoreWaitlistPolicyRepository,
} from "./waitlistAdminRepository";
import { createWaitlistAdminService } from "./waitlistAdminService";

const tenantRepository = createTenantRepository(db);
const locationRepository = createLocationRepository(db);
const staffRepository = createStaffRepository(db);
const serviceRepository = createServiceRepository(db);

export const tenantLocationAdminService = createTenantLocationAdminService({
  tenantRepository,
  locationRepository,
});

export const staffAdminService = createStaffAdminService({ staffRepository });
export const serviceAdminService = createServiceAdminService({ serviceRepository });
export const ownerKpiService = createOwnerKpiService(db);

// Review admin — W46-DEBT-1
export const reviewAdminService = createReviewAdminService(
  createFirestoreReviewQueueRepository(db),
  createFirestoreReviewWriteRepository(db)
);

// Messaging admin — W46-DEBT-2
export const messagingAdminService = createMessagingAdminService(
  createFirestoreAdminThreadRepository(db),
  createFirestoreCannedReplyRepository(db)
);

// Waitlist admin — W46-DEBT-3
export const waitlistAdminService = createWaitlistAdminService(
  createFirestoreWaitlistAdminRepository(db),
  createFirestoreWaitlistBookingRepository(db),
  createFirestoreWaitlistPolicyRepository(db)
);
