/**
 * consumerMessagingRuntime.ts — W37 singleton for the consumer messaging service.
 */

import { db } from "../../shared/config/firebase";

import { createConsumerMessagingService } from "./consumerMessagingService";

export const consumerMessagingService = createConsumerMessagingService(db);
