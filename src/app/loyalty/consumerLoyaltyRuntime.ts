/**
 * consumerLoyaltyRuntime.ts — W37 singleton for the consumer loyalty service.
 *
 * Wires the loyalty + activity domain repositories to the consumer service.
 */

import { createLoyaltyRepository } from "../../domains/loyalty/repository";
import { createActivityRepository } from "../../domains/activities/repository";
import { db } from "../../shared/config/firebase";

import { createConsumerLoyaltyService } from "./consumerLoyaltyService";

const loyaltyRepo = createLoyaltyRepository(db);
const activityRepo = createActivityRepository(db);

export const consumerLoyaltyService = createConsumerLoyaltyService(loyaltyRepo, activityRepo);
