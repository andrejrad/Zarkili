/**
 * consumerMessagingService.ts — W37 consumer-side messaging wiring.
 *
 * Firestore layout:
 *   threads/{threadId}                          — ThreadSummary doc
 *   threads/{threadId}/messages/{msgId}         — ConsumerMessage docs
 *
 * threadId = deterministic: `consumer_${tenantId}_${[clientId, salonAdminId].sort().join("_")}`
 * For single-tenant consumer DM: `consumer_${tenantId}_${clientId}`
 */

import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Firestore,
} from "firebase/firestore";

import type { ConsumerMessage, ThreadSummary } from "./messagingHelpers";

// ---------------------------------------------------------------------------
// Service type
// ---------------------------------------------------------------------------

export type SalonSearchResult = {
  id: string;
  name: string;
};

export type ConsumerMessagingService = {
  /**
   * Real-time listener for all threads where the given user is the client.
   * Calls `onUpdate` whenever threads change. Returns an unsubscribe function.
   */
  subscribeToThreads(
    userId: string,
    onUpdate: (threads: ThreadSummary[]) => void,
  ): () => void;

  /**
   * Real-time listener for messages within a thread.
   * Calls `onUpdate` whenever messages change. Returns an unsubscribe function.
   */
  subscribeToMessages(
    threadId: string,
    onUpdate: (messages: ConsumerMessage[]) => void,
  ): () => void;

  /** Send a message in a thread. */
  sendMessage(threadId: string, userId: string, text: string): Promise<void>;
};

// ---------------------------------------------------------------------------
// Firestore paths
// ---------------------------------------------------------------------------

const THREADS_COL = "threads";

function threadsRef(db: Firestore) {
  return collection(db, THREADS_COL);
}

function messagesRef(db: Firestore, threadId: string) {
  return collection(db, THREADS_COL, threadId, "messages");
}

// ---------------------------------------------------------------------------
// Firestore doc → domain type adapters
// ---------------------------------------------------------------------------

function docToThreadSummary(id: string, data: Record<string, unknown>): ThreadSummary {
  return {
    id,
    salonId: (data.salonId as string | undefined) ?? "",
    salonName: (data.salonName as string | undefined) ?? "Unknown",
    lastMessage: (data.lastMessage as string | undefined) ?? "",
    lastMessageAt:
      data.lastMessageAt &&
      typeof (data.lastMessageAt as { toDate?: () => Date }).toDate === "function"
        ? (data.lastMessageAt as { toDate: () => Date }).toDate().toISOString()
        : new Date().toISOString(),
    unreadCount:
      typeof data.clientUnreadCount === "number" ? data.clientUnreadCount : 0,
    isArchived: (data.isArchived as boolean | undefined) ?? false,
    isMuted: (data.isMuted as boolean | undefined) ?? false,
    isBlocked: (data.isBlocked as boolean | undefined) ?? false,
  };
}

function docToConsumerMessage(id: string, data: Record<string, unknown>): ConsumerMessage {
  return {
    id,
    threadId: (data.threadId as string | undefined) ?? "",
    sender: (data.senderType as "user" | "salon" | undefined) ?? "salon",
    text: (data.text as string | undefined) ?? "",
    sentAt:
      data.sentAt &&
      typeof (data.sentAt as { toDate?: () => Date }).toDate === "function"
        ? (data.sentAt as { toDate: () => Date }).toDate().toISOString()
        : new Date().toISOString(),
    status: (data.status as ConsumerMessage["status"] | undefined) ?? "delivered",
  };
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createConsumerMessagingService(db: Firestore): ConsumerMessagingService {
  function subscribeToThreads(
    userId: string,
    onUpdate: (threads: ThreadSummary[]) => void,
  ): () => void {
    const q = query(threadsRef(db), where("clientId", "==", userId));
    return onSnapshot(q, (snap) => {
      const threads = snap.docs.map((d) =>
        docToThreadSummary(d.id, d.data() as Record<string, unknown>),
      );
      threads.sort(
        (a, b) =>
          new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
      );
      onUpdate(threads);
    });
  }

  function subscribeToMessages(
    threadId: string,
    onUpdate: (messages: ConsumerMessage[]) => void,
  ): () => void {
    const q = query(messagesRef(db, threadId), orderBy("sentAt", "asc"));
    return onSnapshot(q, (snap) => {
      const messages = snap.docs.map((d) =>
        docToConsumerMessage(d.id, d.data() as Record<string, unknown>),
      );
      onUpdate(messages);
    });
  }

  async function sendMessage(threadId: string, userId: string, text: string): Promise<void> {
    const trimmed = text.trim();
    if (!trimmed) return;
    await addDoc(messagesRef(db, threadId), {
      threadId,
      senderType: "user",
      senderId: userId,
      text: trimmed,
      sentAt: serverTimestamp(),
      status: "sent",
    });
    // Update thread summary last message
    await updateDoc(doc(db, THREADS_COL, threadId), {
      lastMessage: trimmed,
      lastMessageAt: serverTimestamp(),
    });
  }

  return { subscribeToThreads, subscribeToMessages, sendMessage };
}
