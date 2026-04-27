import { createMessagesRepository } from "../repository";
import {
  buildThreadId,
  MessagingError,
  MAX_ATTACHMENT_SIZE_BYTES,
  type Message,
  type MessageAttachment,
} from "../model";

// ---------------------------------------------------------------------------
// In-memory Firestore mock with writeBatch, increment, orderBy, limit
// ---------------------------------------------------------------------------

function makeFirestoreMock() {
  const store: Record<string, Record<string, unknown>> = {};

  function resolveValue(existing: unknown, newVal: unknown): unknown {
    if (
      newVal !== null &&
      typeof newVal === "object" &&
      "_type" in (newVal as Record<string, unknown>)
    ) {
      const typed = newVal as { _type: string; delta?: number };
      if (typed._type === "increment") {
        return (typeof existing === "number" ? existing : 0) + (typed.delta ?? 0);
      }
      if (typed._type === "serverTimestamp") {
        return { seconds: 1000, nanoseconds: 0 };
      }
    }
    return newVal;
  }

  let autoIdCounter = 0;

  function doc(dbOrColRef: unknown, col?: string, id?: string) {
    if (typeof dbOrColRef === "object" && dbOrColRef !== null && "_col" in (dbOrColRef as Record<string, unknown>)) {
      const colName = (dbOrColRef as { _col: string })._col;
      const autoId = `auto_${++autoIdCounter}`;
      const key = `${colName}/${autoId}`;
      return { _key: key, _col: colName, _id: autoId, id: autoId, ref: null as unknown };
    }
    const key = `${col}/${id}`;
    return { _key: key, _col: col as string, _id: id as string, id: id as string, ref: null as unknown };
  }

  function getRef(ref: { _key: string }) {
    return ref;
  }

  async function getDoc(ref: { _key: string; _id: string }) {
    const data = store[ref._key];
    return {
      exists: () => data !== undefined,
      data: () => (data !== undefined ? { ...data } : null),
      id: ref._id,
    };
  }

  async function setDoc(ref: { _key: string }, data: Record<string, unknown>) {
    const resolved: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data)) {
      resolved[k] = resolveValue(undefined, v);
    }
    store[ref._key] = resolved;
  }

  async function updateDoc(ref: { _key: string }, patch: Record<string, unknown>) {
    if (!store[ref._key]) throw new Error(`Document ${ref._key} does not exist`);
    const existing = store[ref._key];
    for (const [k, v] of Object.entries(patch)) {
      existing[k] = resolveValue(existing[k], v);
    }
  }

  function writeBatch(_db: unknown) {
    const ops: Array<{
      type: "set" | "update";
      ref: { _key: string };
      data: Record<string, unknown>;
    }> = [];

    return {
      set(ref: { _key: string }, data: Record<string, unknown>) {
        ops.push({ type: "set", ref, data });
      },
      update(ref: { _key: string }, data: Record<string, unknown>) {
        ops.push({ type: "update", ref, data });
      },
      async commit() {
        for (const op of ops) {
          if (op.type === "set") {
            const resolved: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(op.data)) {
              resolved[k] = resolveValue(undefined, v);
            }
            store[op.ref._key] = resolved;
          } else {
            if (!store[op.ref._key]) {
              // Create skeleton if missing in existing doc updates (for userTenantAccess)
              store[op.ref._key] = { unreadMessageCount: 0 };
            }
            const existing = store[op.ref._key];
            for (const [k, v] of Object.entries(op.data)) {
              existing[k] = resolveValue(existing[k], v);
            }
          }
        }
      },
    };
  }

  function increment(delta: number) {
    return { _type: "increment", delta };
  }

  function serverTimestamp() {
    return { _type: "serverTimestamp" };
  }

  function collection(_db: unknown, col: string) {
    return { _col: col };
  }

  function where(field: string, op: string, value: unknown) {
    return { field, op, value };
  }

  function orderBy(field: string, dir: string = "asc") {
    return { _orderBy: { field, dir } };
  }

  function limit(n: number) {
    return { _limit: n };
  }

  function query(
    colRef: { _col: string },
    ...clauses: unknown[]
  ) {
    const filters: Array<{ field: string; op: string; value: unknown }> = [];
    let orderByClause: { field: string; dir: string } | null = null;
    let limitCount: number | null = null;

    for (const c of clauses) {
      if (c && typeof c === "object") {
        const clause = c as Record<string, unknown>;
        if ("field" in clause && "op" in clause) {
          filters.push(clause as { field: string; op: string; value: unknown });
        } else if ("_orderBy" in clause) {
          orderByClause = clause._orderBy as { field: string; dir: string };
        } else if ("_limit" in clause) {
          limitCount = clause._limit as number;
        }
      }
    }

    return { _col: colRef._col, filters, orderByClause, limitCount };
  }

  async function getDocs(q: {
    _col: string;
    filters: Array<{ field: string; op: string; value: unknown }>;
    orderByClause: { field: string; dir: string } | null;
    limitCount: number | null;
  }) {
    let docs = Object.entries(store)
      .filter(([key]) => key.startsWith(`${q._col}/`))
      .filter(([, data]) =>
        q.filters.every(({ field, op, value }) => {
          const fieldVal = (data as Record<string, unknown>)[field];
          if (op === "==") return fieldVal === value;
          if (op === "array-contains") return Array.isArray(fieldVal) && fieldVal.includes(value);
          return true;
        }),
      )
      .map(([key, data]) => ({
        _key: key,
        id: key.split("/")[1] ?? "",
        ref: { _key: key },
        data: () => ({ ...data }),
      }));

    if (q.orderByClause) {
      const { field, dir } = q.orderByClause;
      docs = docs.sort((a, b) => {
        const av = (a.data() as Record<string, unknown>)[field];
        const bv = (b.data() as Record<string, unknown>)[field];
        const aNum = typeof av === "object" && av !== null ? (av as { seconds: number }).seconds : 0;
        const bNum = typeof bv === "object" && bv !== null ? (bv as { seconds: number }).seconds : 0;
        return dir === "desc" ? bNum - aNum : aNum - bNum;
      });
    }

    if (q.limitCount !== null) {
      docs = docs.slice(0, q.limitCount);
    }

    return { empty: docs.length === 0, docs };
  }

  const db = {} as unknown;

  return {
    db,
    store,
    doc,
    getRef,
    getDoc,
    setDoc,
    updateDoc,
    writeBatch,
    increment,
    serverTimestamp,
    collection,
    where,
    orderBy,
    limit,
    query,
    getDocs,
  };
}

// ---------------------------------------------------------------------------
// Mock firebase/firestore via jest
// ---------------------------------------------------------------------------

let mock: ReturnType<typeof makeFirestoreMock>;

jest.mock("firebase/firestore", () => ({
  doc: (...args: unknown[]) => mock.doc(...(args as Parameters<typeof mock.doc>)),
  getDoc: (...args: unknown[]) => mock.getDoc(...(args as Parameters<typeof mock.getDoc>)),
  setDoc: (...args: unknown[]) => mock.setDoc(...(args as Parameters<typeof mock.setDoc>)),
  updateDoc: (...args: unknown[]) => mock.updateDoc(...(args as Parameters<typeof mock.updateDoc>)),
  writeBatch: (...args: unknown[]) => mock.writeBatch(...(args as Parameters<typeof mock.writeBatch>)),
  increment: (delta: number) => mock.increment(delta),
  serverTimestamp: () => mock.serverTimestamp(),
  collection: (...args: unknown[]) => mock.collection(...(args as Parameters<typeof mock.collection>)),
  where: (...args: unknown[]) => mock.where(...(args as Parameters<typeof mock.where>)),
  orderBy: (...args: unknown[]) => mock.orderBy(...(args as Parameters<typeof mock.orderBy>)),
  limit: (n: number) => mock.limit(n),
  query: (...args: unknown[]) => mock.query(...(args as Parameters<typeof mock.query>)),
  getDocs: (...args: unknown[]) => mock.getDocs(...(args as Parameters<typeof mock.getDocs>)),
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeAccessDoc(userId: string, tenantId: string, unread = 0) {
  return { unreadMessageCount: unread };
}

const TENANT = "t1";
const STAFF_ID = "staff1";
const CUSTOMER_ID = "cust1";
const THREAD_ID = buildThreadId(TENANT, STAFF_ID, CUSTOMER_ID);

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  mock = makeFirestoreMock();
  // Pre-seed the receiver's userTenantAccess doc
  mock.store[`userTenantAccess/${CUSTOMER_ID}_${TENANT}`] = makeAccessDoc(CUSTOMER_ID, TENANT, 0);
  mock.store[`userTenantAccess/${STAFF_ID}_${TENANT}`] = makeAccessDoc(STAFF_ID, TENANT, 0);
});

// ---------------------------------------------------------------------------
// sendMessage
// ---------------------------------------------------------------------------

describe("createMessagesRepository — sendMessage", () => {
  it("creates a message document in the store", async () => {
    const repo = createMessagesRepository(mock.db as never);
    const msg = await repo.sendMessage({
      tenantId: TENANT,
      senderType: "staff",
      senderId: STAFF_ID,
      receiverId: CUSTOMER_ID,
      text: "Hello!",
    });

    expect(msg.text).toBe("Hello!");
    expect(msg.tenantId).toBe(TENANT);
    expect(msg.senderId).toBe(STAFF_ID);
    expect(msg.receiverId).toBe(CUSTOMER_ID);
    expect(msg.read).toBe(false);
    expect(msg.threadId).toBe(THREAD_ID);
  });

  it("increments receiver unreadMessageCount by 1", async () => {
    const repo = createMessagesRepository(mock.db as never);
    await repo.sendMessage({
      tenantId: TENANT,
      senderType: "staff",
      senderId: STAFF_ID,
      receiverId: CUSTOMER_ID,
      text: "Hello",
    });

    const accessDoc = mock.store[`userTenantAccess/${CUSTOMER_ID}_${TENANT}`];
    expect(accessDoc?.unreadMessageCount).toBe(1);
  });

  it("increments unread count again on second message", async () => {
    const repo = createMessagesRepository(mock.db as never);
    await repo.sendMessage({ tenantId: TENANT, senderType: "staff", senderId: STAFF_ID, receiverId: CUSTOMER_ID, text: "Msg 1" });
    await repo.sendMessage({ tenantId: TENANT, senderType: "staff", senderId: STAFF_ID, receiverId: CUSTOMER_ID, text: "Msg 2" });

    const accessDoc = mock.store[`userTenantAccess/${CUSTOMER_ID}_${TENANT}`];
    expect(accessDoc?.unreadMessageCount).toBe(2);
  });

  it("rejects message with both empty text and no attachments", async () => {
    const repo = createMessagesRepository(mock.db as never);
    await expect(
      repo.sendMessage({
        tenantId: TENANT,
        senderType: "staff",
        senderId: STAFF_ID,
        receiverId: CUSTOMER_ID,
        text: "   ",
      }),
    ).rejects.toThrow("text or at least one attachment");
  });

  it("rejects attachment exceeding 10 MB", async () => {
    const repo = createMessagesRepository(mock.db as never);
    const bigAttachment: MessageAttachment = {
      name: "huge.pdf",
      size: MAX_ATTACHMENT_SIZE_BYTES + 1,
      type: "application/pdf",
      url: "https://example.com/huge.pdf",
    };

    await expect(
      repo.sendMessage({
        tenantId: TENANT,
        senderType: "staff",
        senderId: STAFF_ID,
        receiverId: CUSTOMER_ID,
        text: "see attachment",
        attachments: [bigAttachment],
      }),
    ).rejects.toThrow("10 MB size limit");
    expect(Object.keys(mock.store).filter((k) => k.startsWith("messages/"))).toHaveLength(0);
  });

  it("rejects disallowed attachment MIME type", async () => {
    const repo = createMessagesRepository(mock.db as never);
    const badAttachment: MessageAttachment = {
      name: "script.exe",
      size: 1024,
      type: "application/x-msdownload",
      url: "https://example.com/script.exe",
    };

    await expect(
      repo.sendMessage({
        tenantId: TENANT,
        senderType: "staff",
        senderId: STAFF_ID,
        receiverId: CUSTOMER_ID,
        text: "see file",
        attachments: [badAttachment],
      }),
    ).rejects.toBeInstanceOf(MessagingError);
  });

  it("stores attachment metadata on successful send", async () => {
    const repo = createMessagesRepository(mock.db as never);
    const attachment: MessageAttachment = {
      name: "photo.jpg",
      size: 512 * 1024,
      type: "image/jpeg",
      url: "https://example.com/photo.jpg",
    };

    const msg = await repo.sendMessage({
      tenantId: TENANT,
      senderType: "staff",
      senderId: STAFF_ID,
      receiverId: CUSTOMER_ID,
      text: "see photo",
      attachments: [attachment],
    });

    expect(msg.attachments).toHaveLength(1);
    expect(msg.attachments[0]?.name).toBe("photo.jpg");
  });

  it("throws when tenantId is empty", async () => {
    const repo = createMessagesRepository(mock.db as never);
    await expect(
      repo.sendMessage({ tenantId: "", senderType: "staff", senderId: "s", receiverId: "r", text: "hi" }),
    ).rejects.toThrow("tenantId is required");
  });
});

// ---------------------------------------------------------------------------
// listThreadMessages
// ---------------------------------------------------------------------------

describe("createMessagesRepository — listThreadMessages", () => {
  it("returns empty array when no messages exist", async () => {
    const repo = createMessagesRepository(mock.db as never);
    const msgs = await repo.listThreadMessages(TENANT, STAFF_ID, CUSTOMER_ID);
    expect(msgs).toHaveLength(0);
  });

  it("returns messages for the correct thread", async () => {
    const repo = createMessagesRepository(mock.db as never);
    await repo.sendMessage({ tenantId: TENANT, senderType: "staff", senderId: STAFF_ID, receiverId: CUSTOMER_ID, text: "Hello" });
    await repo.sendMessage({ tenantId: TENANT, senderType: "customer", senderId: CUSTOMER_ID, receiverId: STAFF_ID, text: "Hi!" });

    const msgs = await repo.listThreadMessages(TENANT, STAFF_ID, CUSTOMER_ID);
    expect(msgs).toHaveLength(2);
  });

  it("does not return messages from a different thread", async () => {
    const repo = createMessagesRepository(mock.db as never);
    await repo.sendMessage({ tenantId: TENANT, senderType: "staff", senderId: STAFF_ID, receiverId: CUSTOMER_ID, text: "To cust" });
    await repo.sendMessage({ tenantId: TENANT, senderType: "staff", senderId: STAFF_ID, receiverId: "other_user", text: "To other" });

    const msgs = await repo.listThreadMessages(TENANT, STAFF_ID, CUSTOMER_ID);
    // Only messages in the STAFF_ID <-> CUSTOMER_ID thread
    for (const m of msgs) {
      expect(m.threadId).toBe(THREAD_ID);
    }
  });

  it("threadId is symmetric: listThreadMessages(A,B) == listThreadMessages(B,A)", async () => {
    const repo = createMessagesRepository(mock.db as never);
    await repo.sendMessage({ tenantId: TENANT, senderType: "staff", senderId: STAFF_ID, receiverId: CUSTOMER_ID, text: "Hello" });

    const fromA = await repo.listThreadMessages(TENANT, STAFF_ID, CUSTOMER_ID);
    const fromB = await repo.listThreadMessages(TENANT, CUSTOMER_ID, STAFF_ID);
    expect(fromA.length).toBe(fromB.length);
    expect(fromA[0]?.messageId).toBe(fromB[0]?.messageId);
  });
});

// ---------------------------------------------------------------------------
// markThreadRead
// ---------------------------------------------------------------------------

describe("createMessagesRepository — markThreadRead", () => {
  it("marks unread messages as read and returns the count", async () => {
    const repo = createMessagesRepository(mock.db as never);
    await repo.sendMessage({ tenantId: TENANT, senderType: "staff", senderId: STAFF_ID, receiverId: CUSTOMER_ID, text: "Msg 1" });
    await repo.sendMessage({ tenantId: TENANT, senderType: "staff", senderId: STAFF_ID, receiverId: CUSTOMER_ID, text: "Msg 2" });

    const count = await repo.markThreadRead(TENANT, THREAD_ID, CUSTOMER_ID);
    expect(count).toBe(2);
  });

  it("decrements receiver unreadMessageCount accordingly", async () => {
    const repo = createMessagesRepository(mock.db as never);
    await repo.sendMessage({ tenantId: TENANT, senderType: "staff", senderId: STAFF_ID, receiverId: CUSTOMER_ID, text: "Msg 1" });
    await repo.sendMessage({ tenantId: TENANT, senderType: "staff", senderId: STAFF_ID, receiverId: CUSTOMER_ID, text: "Msg 2" });

    await repo.markThreadRead(TENANT, THREAD_ID, CUSTOMER_ID);

    const accessDoc = mock.store[`userTenantAccess/${CUSTOMER_ID}_${TENANT}`];
    // Started at 0, incremented by 2, decremented by 2
    expect(accessDoc?.unreadMessageCount).toBe(0);
  });

  it("returns 0 and does not modify store when nothing is unread", async () => {
    const repo = createMessagesRepository(mock.db as never);
    const count = await repo.markThreadRead(TENANT, THREAD_ID, CUSTOMER_ID);
    expect(count).toBe(0);
  });

  it("only marks messages where receiverId matches readerId as read", async () => {
    const repo = createMessagesRepository(mock.db as never);
    // Staff sends to customer
    await repo.sendMessage({ tenantId: TENANT, senderType: "staff", senderId: STAFF_ID, receiverId: CUSTOMER_ID, text: "For customer" });
    // Customer sends to staff
    mock.store[`userTenantAccess/${STAFF_ID}_${TENANT}`] = { unreadMessageCount: 0 };
    await repo.sendMessage({ tenantId: TENANT, senderType: "customer", senderId: CUSTOMER_ID, receiverId: STAFF_ID, text: "For staff" });

    // Mark customer's unread only
    const count = await repo.markThreadRead(TENANT, THREAD_ID, CUSTOMER_ID);
    expect(count).toBe(1);

    // Staff's message to customer is still unread (staff sees 1 unread)
    const staffAccess = mock.store[`userTenantAccess/${STAFF_ID}_${TENANT}`];
    expect(staffAccess?.unreadMessageCount).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// listUnreadCounts
// ---------------------------------------------------------------------------

describe("createMessagesRepository — listUnreadCounts", () => {
  it("returns empty map when user has no unread messages", async () => {
    const repo = createMessagesRepository(mock.db as never);
    const counts = await repo.listUnreadCounts(TENANT, CUSTOMER_ID);
    expect(counts).toEqual({});
  });

  it("returns correct counts per thread", async () => {
    const repo = createMessagesRepository(mock.db as never);
    // Seed with pre-created access docs for second staff
    mock.store[`userTenantAccess/${CUSTOMER_ID}_${TENANT}`] = { unreadMessageCount: 0 };

    await repo.sendMessage({ tenantId: TENANT, senderType: "staff", senderId: STAFF_ID, receiverId: CUSTOMER_ID, text: "From staff1 - 1" });
    await repo.sendMessage({ tenantId: TENANT, senderType: "staff", senderId: STAFF_ID, receiverId: CUSTOMER_ID, text: "From staff1 - 2" });

    const counts = await repo.listUnreadCounts(TENANT, CUSTOMER_ID);
    expect(counts[THREAD_ID]).toBe(2);
  });

  it("does not count already-read messages", async () => {
    const repo = createMessagesRepository(mock.db as never);
    await repo.sendMessage({ tenantId: TENANT, senderType: "staff", senderId: STAFF_ID, receiverId: CUSTOMER_ID, text: "Readable" });
    await repo.markThreadRead(TENANT, THREAD_ID, CUSTOMER_ID);

    const counts = await repo.listUnreadCounts(TENANT, CUSTOMER_ID);
    expect(counts[THREAD_ID]).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// updateTenantUnreadCount
// ---------------------------------------------------------------------------

describe("createMessagesRepository — updateTenantUnreadCount", () => {
  it("increments unread count by positive delta", async () => {
    const repo = createMessagesRepository(mock.db as never);
    await repo.updateTenantUnreadCount(CUSTOMER_ID, TENANT, 5);
    expect(mock.store[`userTenantAccess/${CUSTOMER_ID}_${TENANT}`]?.unreadMessageCount).toBe(5);
  });

  it("decrements unread count by negative delta", async () => {
    mock.store[`userTenantAccess/${CUSTOMER_ID}_${TENANT}`] = { unreadMessageCount: 10 };
    const repo = createMessagesRepository(mock.db as never);
    await repo.updateTenantUnreadCount(CUSTOMER_ID, TENANT, -3);
    expect(mock.store[`userTenantAccess/${CUSTOMER_ID}_${TENANT}`]?.unreadMessageCount).toBe(7);
  });

  it("is a no-op when delta is 0", async () => {
    const repo = createMessagesRepository(mock.db as never);
    // Should not throw even though the doc might not exist
    await expect(repo.updateTenantUnreadCount(CUSTOMER_ID, TENANT, 0)).resolves.not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// buildThreadId symmetry
// ---------------------------------------------------------------------------

describe("buildThreadId", () => {
  it("produces the same ID regardless of argument order", () => {
    expect(buildThreadId("t1", "alice", "bob")).toBe(buildThreadId("t1", "bob", "alice"));
  });

  it("includes the tenantId to prevent cross-tenant collision", () => {
    expect(buildThreadId("tA", "u1", "u2")).not.toBe(buildThreadId("tB", "u1", "u2"));
  });
});
