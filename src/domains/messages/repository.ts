import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit as firestoreLimit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
  type Firestore,
} from "firebase/firestore";

import {
  buildThreadId,
  validateAttachment,
  type Message,
  type SendMessageInput,
} from "./model";

const MESSAGES_COL = "messages";
const ACCESS_COL = "userTenantAccess";

function buildAccessId(userId: string, tenantId: string): string {
  return `${userId}_${tenantId}`;
}

function assertNonEmpty(value: string, field: string): void {
  if (!value || value.trim().length === 0) {
    throw new Error(`${field} is required`);
  }
}

export function createMessagesRepository(db: Firestore) {
  /**
   * Sends a message and atomically increments the receiver's
   * userTenantAccess.unreadMessageCount via a Firestore batch write.
   */
  async function sendMessage(input: SendMessageInput): Promise<Message> {
    assertNonEmpty(input.tenantId, "tenantId");
    assertNonEmpty(input.senderId, "senderId");
    assertNonEmpty(input.receiverId, "receiverId");

    if (!input.text.trim() && (!input.attachments || input.attachments.length === 0)) {
      throw new Error("Message must contain text or at least one attachment");
    }

    const attachments = input.attachments ?? [];
    for (const att of attachments) {
      validateAttachment(att);
    }

    const threadId = buildThreadId(input.tenantId, input.senderId, input.receiverId);
    const messageRef = doc(collection(db, MESSAGES_COL));
    const messageId = messageRef.id;
    const accessRef = doc(db, ACCESS_COL, buildAccessId(input.receiverId, input.tenantId));

    const now = serverTimestamp();
    const messageData = {
      messageId,
      threadId,
      tenantId: input.tenantId,
      senderType: input.senderType,
      senderId: input.senderId,
      receiverId: input.receiverId,
      text: input.text,
      attachments,
      read: false,
      createdAt: now,
      updatedAt: now,
    };

    const batch = writeBatch(db);
    batch.set(messageRef, messageData);
    batch.update(accessRef, {
      unreadMessageCount: increment(1),
      lastMessageAt: now,
      updatedAt: now,
    });
    await batch.commit();

    const snap = await getDoc(messageRef);
    return snap.data() as Message;
  }

  /**
   * Lists messages in the thread between two users, newest first.
   *
   * Firestore index required:
   *   Collection: messages
   *   Fields: threadId ASC, createdAt DESC
   */
  async function listThreadMessages(
    tenantId: string,
    userIdA: string,
    userIdB: string,
    pageLimit = 50,
  ): Promise<Message[]> {
    assertNonEmpty(tenantId, "tenantId");
    assertNonEmpty(userIdA, "userIdA");
    assertNonEmpty(userIdB, "userIdB");

    const threadId = buildThreadId(tenantId, userIdA, userIdB);
    const q = query(
      collection(db, MESSAGES_COL),
      where("threadId", "==", threadId),
      orderBy("createdAt", "desc"),
      firestoreLimit(pageLimit),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Message);
  }

  /**
   * Marks all unread messages in a thread as read for `readerId` and
   * atomically decrements their userTenantAccess.unreadMessageCount.
   *
   * Returns the number of messages that were marked read.
   */
  async function markThreadRead(
    tenantId: string,
    threadId: string,
    readerId: string,
  ): Promise<number> {
    assertNonEmpty(tenantId, "tenantId");
    assertNonEmpty(threadId, "threadId");
    assertNonEmpty(readerId, "readerId");

    const q = query(
      collection(db, MESSAGES_COL),
      where("threadId", "==", threadId),
      where("receiverId", "==", readerId),
      where("read", "==", false),
    );
    const snap = await getDocs(q);
    if (snap.docs.length === 0) return 0;

    const accessRef = doc(db, ACCESS_COL, buildAccessId(readerId, tenantId));
    const batch = writeBatch(db);

    for (const d of snap.docs) {
      batch.update(d.ref, { read: true, updatedAt: serverTimestamp() });
    }
    batch.update(accessRef, {
      unreadMessageCount: increment(-snap.docs.length),
      updatedAt: serverTimestamp(),
    });

    await batch.commit();
    return snap.docs.length;
  }

  /**
   * Returns a map of `threadId → unread message count` for a given user.
   *
   * Firestore index required:
   *   Collection: messages
   *   Fields: tenantId ASC, receiverId ASC, read ASC
   */
  async function listUnreadCounts(
    tenantId: string,
    userId: string,
  ): Promise<Record<string, number>> {
    assertNonEmpty(tenantId, "tenantId");
    assertNonEmpty(userId, "userId");

    const q = query(
      collection(db, MESSAGES_COL),
      where("tenantId", "==", tenantId),
      where("receiverId", "==", userId),
      where("read", "==", false),
    );
    const snap = await getDocs(q);
    const counts: Record<string, number> = {};
    for (const d of snap.docs) {
      const msg = d.data() as Message;
      counts[msg.threadId] = (counts[msg.threadId] ?? 0) + 1;
    }
    return counts;
  }

  /**
   * Applies a delta (positive or negative) to a user's unread count for a
   * tenant.  Can be called by admin bulk messaging operations.
   */
  async function updateTenantUnreadCount(
    userId: string,
    tenantId: string,
    delta: number,
  ): Promise<void> {
    assertNonEmpty(userId, "userId");
    assertNonEmpty(tenantId, "tenantId");
    if (delta === 0) return;

    const ref = doc(db, ACCESS_COL, buildAccessId(userId, tenantId));
    await updateDoc(ref, {
      unreadMessageCount: increment(delta),
      updatedAt: serverTimestamp(),
    });
  }

  return {
    sendMessage,
    listThreadMessages,
    markThreadRead,
    listUnreadCounts,
    updateTenantUnreadCount,
  };
}

export type MessagesRepository = ReturnType<typeof createMessagesRepository>;
