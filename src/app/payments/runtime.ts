/**
 * payments/runtime.ts — W36-C, wired by W37.5
 *
 * Instantiates the payments repository with both Firestore (reads) and
 * Firebase Functions (write callables: attach, detach, charge,
 * applyLoyaltyDiscount).
 */

import { createPaymentsRepository } from "../../domains/payments";
import { db, functions } from "../../shared/config/firebase";

export const appPaymentsRepository = createPaymentsRepository(db, functions);
