/**
 * W46 — waitlistAdminService
 *
 * Factory for admin waitlist surfaces: list with priority, convert to booking,
 * and policy configuration.
 *
 * Pattern (mirrors clientCrmService / loyaltyAdminService):
 *   • Optional repo port injections.
 *   • Absent repo → { ok: false, message: "… not configured." }
 */

import type {
  ConvertToBookingInput,
  ConvertToBookingResult,
  WaitlistAdminEntry,
  WaitlistAdminFilter,
  WaitlistAdminResult,
  WaitlistPolicy,
} from "../../domains/waitlist/waitlistAdminModel";

// ---------------------------------------------------------------------------
// Repository ports
// ---------------------------------------------------------------------------

export type WaitlistAdminRepository = {
  list(tenantId: string, filter: WaitlistAdminFilter): Promise<WaitlistAdminEntry[]>;
  getEntry(waitlistId: string, tenantId: string): Promise<WaitlistAdminEntry | null>;
  notifyEntry(waitlistId: string, tenantId: string): Promise<WaitlistAdminEntry>;
  cancelEntry(waitlistId: string, tenantId: string, cancelledBy: string): Promise<void>;
};

export type WaitlistBookingRepository = {
  convertToBooking(input: ConvertToBookingInput): Promise<ConvertToBookingResult>;
};

export type WaitlistPolicyRepository = {
  getPolicy(tenantId: string): Promise<WaitlistPolicy | null>;
  savePolicy(policy: WaitlistPolicy): Promise<void>;
};

// ---------------------------------------------------------------------------
// Error normalisation
// ---------------------------------------------------------------------------

function fmtError(err: unknown): string {
  if (err instanceof Error && err.message.trim()) return err.message;
  return "An unexpected error occurred.";
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createWaitlistAdminService(
  waitlistRepo?: WaitlistAdminRepository,
  bookingRepo?: WaitlistBookingRepository,
  policyRepo?: WaitlistPolicyRepository,
) {
  // -------------------------------------------------------------------------
  // Waitlist list
  // -------------------------------------------------------------------------

  async function listEntries(
    tenantId: string,
    filter: WaitlistAdminFilter,
  ): Promise<WaitlistAdminResult<WaitlistAdminEntry[]>> {
    if (!waitlistRepo) return { ok: false, message: "Waitlist repository not configured." };
    try {
      return { ok: true, data: await waitlistRepo.list(tenantId, filter) };
    } catch (err) {
      return { ok: false, message: fmtError(err) };
    }
  }

  async function getEntry(
    waitlistId: string,
    tenantId: string,
  ): Promise<WaitlistAdminResult<WaitlistAdminEntry | null>> {
    if (!waitlistRepo) return { ok: false, message: "Waitlist repository not configured." };
    try {
      return { ok: true, data: await waitlistRepo.getEntry(waitlistId, tenantId) };
    } catch (err) {
      return { ok: false, message: fmtError(err) };
    }
  }

  async function notifyEntry(
    waitlistId: string,
    tenantId: string,
  ): Promise<WaitlistAdminResult<WaitlistAdminEntry>> {
    if (!waitlistRepo) return { ok: false, message: "Waitlist repository not configured." };
    try {
      return { ok: true, data: await waitlistRepo.notifyEntry(waitlistId, tenantId) };
    } catch (err) {
      return { ok: false, message: fmtError(err) };
    }
  }

  async function cancelEntry(
    waitlistId: string,
    tenantId: string,
    cancelledBy: string,
  ): Promise<WaitlistAdminResult<void>> {
    if (!waitlistRepo) return { ok: false, message: "Waitlist repository not configured." };
    try {
      await waitlistRepo.cancelEntry(waitlistId, tenantId, cancelledBy);
      return { ok: true, data: undefined };
    } catch (err) {
      return { ok: false, message: fmtError(err) };
    }
  }

  // -------------------------------------------------------------------------
  // Convert to booking
  // -------------------------------------------------------------------------

  async function convertToBooking(
    input: ConvertToBookingInput,
  ): Promise<WaitlistAdminResult<ConvertToBookingResult>> {
    if (!bookingRepo) return { ok: false, message: "Booking repository not configured." };
    try {
      return { ok: true, data: await bookingRepo.convertToBooking(input) };
    } catch (err) {
      return { ok: false, message: fmtError(err) };
    }
  }

  // -------------------------------------------------------------------------
  // Policy
  // -------------------------------------------------------------------------

  async function loadPolicy(
    tenantId: string,
  ): Promise<WaitlistAdminResult<WaitlistPolicy | null>> {
    if (!policyRepo) return { ok: false, message: "Policy repository not configured." };
    try {
      return { ok: true, data: await policyRepo.getPolicy(tenantId) };
    } catch (err) {
      return { ok: false, message: fmtError(err) };
    }
  }

  async function savePolicy(
    policy: WaitlistPolicy,
  ): Promise<WaitlistAdminResult<void>> {
    if (!policyRepo) return { ok: false, message: "Policy repository not configured." };
    try {
      await policyRepo.savePolicy(policy);
      return { ok: true, data: undefined };
    } catch (err) {
      return { ok: false, message: fmtError(err) };
    }
  }

  return {
    listEntries,
    getEntry,
    notifyEntry,
    cancelEntry,
    convertToBooking,
    loadPolicy,
    savePolicy,
  };
}

export type WaitlistAdminService = ReturnType<typeof createWaitlistAdminService>;
