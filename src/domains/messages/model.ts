import { Timestamp } from "firebase/firestore";

// ---------------------------------------------------------------------------
// Attachment
// ---------------------------------------------------------------------------

/** Maximum allowed attachment size in bytes (10 MB) */
export const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024;

export const ALLOWED_ATTACHMENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

export type AllowedAttachmentType = (typeof ALLOWED_ATTACHMENT_TYPES)[number];

export type MessageAttachment = {
  /** Original file name */
  name: string;
  /** File size in bytes */
  size: number;
  /** MIME type */
  type: string;
  /** Public download URL (Firebase Storage) */
  url: string;
};

// ---------------------------------------------------------------------------
// Message
// ---------------------------------------------------------------------------

export type MessageSenderType = "staff" | "customer" | "system";

/**
 * threadId is deterministic:
 *   `${tenantId}_${[senderUserId, receiverUserId].sort().join("_")}`
 *
 * Both participants always query the same threadId, regardless of who sent.
 */
export type Message = {
  messageId: string;
  threadId: string;
  tenantId: string;
  senderType: MessageSenderType;
  senderId: string;
  receiverId: string;
  text: string;
  attachments: MessageAttachment[];
  read: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type SendMessageInput = {
  tenantId: string;
  senderType: MessageSenderType;
  senderId: string;
  receiverId: string;
  text: string;
  attachments?: MessageAttachment[];
};

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export type MessagingErrorCode =
  | "MESSAGE_NOT_FOUND"
  | "CROSS_TENANT_FORBIDDEN"
  | "INVALID_ATTACHMENT";

export class MessagingError extends Error {
  constructor(
    public readonly code: MessagingErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "MessagingError";
  }
}

// ---------------------------------------------------------------------------
// Attachment validation
// ---------------------------------------------------------------------------

export function validateAttachment(attachment: MessageAttachment): void {
  if (attachment.size > MAX_ATTACHMENT_SIZE_BYTES) {
    throw new MessagingError(
      "INVALID_ATTACHMENT",
      `Attachment "${attachment.name}" exceeds the 10 MB size limit`,
    );
  }
  if (!ALLOWED_ATTACHMENT_TYPES.includes(attachment.type as AllowedAttachmentType)) {
    throw new MessagingError(
      "INVALID_ATTACHMENT",
      `Attachment type "${attachment.type}" is not allowed. Allowed: ${ALLOWED_ATTACHMENT_TYPES.join(", ")}`,
    );
  }
}

// ---------------------------------------------------------------------------
// Thread ID helper
// ---------------------------------------------------------------------------

/**
 * Builds a stable thread ID from two user IDs.  The IDs are sorted so the
 * result is the same regardless of which participant calls the function.
 */
export function buildThreadId(
  tenantId: string,
  userIdA: string,
  userIdB: string,
): string {
  const [first, second] = [userIdA, userIdB].sort();
  return `${tenantId}_${first}_${second}`;
}
