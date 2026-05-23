/**
 * consumerNotificationRuntime.ts — W37 singleton for the consumer notification service.
 */

import { db } from "../../shared/config/firebase";

import { createConsumerNotificationService } from "./consumerNotificationService";

export const consumerNotificationService = createConsumerNotificationService(db);
