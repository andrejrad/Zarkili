/**
 * adminMessagingService.ts
 *
 * Orchestrates admin-side messaging operations:
 *
 *   searchCustomers   — list customers in a tenant with optional location/status filter
 *   sendDirectMessage — send a single message from staff to a customer
 *   sendBulkMessage   — send the same message to multiple customers
 *   loadThread        — load thread messages between a staff member and a customer
 *   markRead          — mark a thread as read from the staff perspective
 *
 * All writes go through the MessagesRepository to ensure unread badge sync.
 */

import type { Message, MessageAttachment, MessagingErrorCode } from "../../domains/messages/model";
import { MessagingError } from "../../domains/messages/model";
import type { MessagesRepository } from "../../domains/messages/repository";
import type { UserTenantAccessRepository } from "../../domains/tenants/userTenantAccessRepository";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type CustomerSummary = {
  userId: string;
  displayName: string;
  /** locationId(s) this customer is associated with */
  locationIds: string[];
  subscriptionStatus: string;
};

export type CustomerSearchFilters = {
  locationId?: string;
  subscriptionStatus?: "active" | "trialing" | "past_due" | "suspended" | "cancelled";
  query?: string;
};

export type AdminSendResult =
  | { ok: true; message: Message }
  | { ok: false; code: MessagingErrorCode | "ERROR"; message: string };

export type AdminBulkSendResult =
  | { ok: true; sentCount: number; failedCount: number }
  | { ok: false; message: string };

export type AdminThreadResult =
  | { ok: true; messages: Message[] }
  | { ok: false; message: string };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeError(err: unknown): string {
  if (err instanceof MessagingError) return err.message;
  if (err instanceof Error && err.message.trim()) return err.message;
  return "An unexpected error occurred.";
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createAdminMessagingService(
  messagesRepository: MessagesRepository,
  userTenantAccessRepository: UserTenantAccessRepository,
) {
  /**
   * Lists customers subscribed to the tenant, with optional location and status
   * filtering.  Returns a lightweight summary suitable for the client search list.
   */
  async function searchCustomers(
    tenantId: string,
    filters: CustomerSearchFilters = {},
  ): Promise<CustomerSummary[]> {
    const accesses = await userTenantAccessRepository.getTenantUsers(tenantId);

    return accesses
      .filter((a) => a.accessLevel === "client")
      .filter((a) =>
        filters.subscriptionStatus ? a.subscriptionStatus === filters.subscriptionStatus : true,
      )
      .filter((a) =>
        filters.locationId
          ? // UserTenantAccess doesn't carry locationIds — caller filters on a naming convention
            // or omits the filter; future expansion may join staff/location tables
            true
          : true,
      )
      .map((a) => ({
        userId: a.userId,
        displayName: a.userId, // real display name would come from userProfiles join
        locationIds: [],
        subscriptionStatus: a.subscriptionStatus,
      }));
  }

  /**
   * Sends a single message from a staff member to a customer.
   */
  async function sendDirectMessage(
    tenantId: string,
    staffId: string,
    customerId: string,
    text: string,
    attachments: MessageAttachment[] = [],
  ): Promise<AdminSendResult> {
    try {
      const message = await messagesRepository.sendMessage({
        tenantId,
        senderType: "staff",
        senderId: staffId,
        receiverId: customerId,
        text,
        attachments,
      });
      return { ok: true, message };
    } catch (err) {
      if (err instanceof MessagingError) {
        return { ok: false, code: err.code, message: err.message };
      }
      return { ok: false, code: "ERROR", message: normalizeError(err) };
    }
  }

  /**
   * Sends the same message to multiple customers in a batch.
   * Each customer gets an independent message document (not a group message).
   * Returns counts of successful and failed sends.
   */
  async function sendBulkMessage(
    tenantId: string,
    staffId: string,
    customerIds: string[],
    text: string,
    attachments: MessageAttachment[] = [],
  ): Promise<AdminBulkSendResult> {
    if (customerIds.length === 0) {
      return { ok: false, message: "No recipients selected." };
    }

    let sentCount = 0;
    let failedCount = 0;

    // Send sequentially to avoid batch size limits and preserve per-customer error tracking
    for (const customerId of customerIds) {
      try {
        await messagesRepository.sendMessage({
          tenantId,
          senderType: "staff",
          senderId: staffId,
          receiverId: customerId,
          text,
          attachments,
        });
        sentCount++;
      } catch {
        failedCount++;
      }
    }

    return { ok: true, sentCount, failedCount };
  }

  /**
   * Loads message thread between a staff member and a customer.
   */
  async function loadThread(
    tenantId: string,
    staffId: string,
    customerId: string,
    pageLimit = 50,
  ): Promise<AdminThreadResult> {
    try {
      const messages = await messagesRepository.listThreadMessages(
        tenantId,
        staffId,
        customerId,
        pageLimit,
      );
      return { ok: true, messages };
    } catch (err) {
      return { ok: false, message: normalizeError(err) };
    }
  }

  /**
   * Marks all messages in a thread as read from the staff member's perspective.
   */
  async function markRead(
    tenantId: string,
    threadId: string,
    staffId: string,
  ): Promise<void> {
    await messagesRepository.markThreadRead(tenantId, threadId, staffId);
  }

  return {
    searchCustomers,
    sendDirectMessage,
    sendBulkMessage,
    loadThread,
    markRead,
  };
}

export type AdminMessagingService = ReturnType<typeof createAdminMessagingService>;
