# Messaging

Domain: `src/domains/messages/`  
App layer: `src/app/messaging/`  
Delivered: Week 7, Tasks 7.1 & 7.2

---

## Collections

| Collection | Document ID | Purpose |
|---|---|---|
| `messages` | auto-ID | Individual messages and thread metadata |
| `userTenantAccess` | `{userId}_{tenantId}` | Aggregated unread count per user per tenant |

---

## Repository API — `createMessagesRepository(db)`

| Method | Description |
|---|---|
| `sendMessage(input)` | Writes message + atomically increments `userTenantAccess.unreadMessageCount` via `writeBatch` |
| `listThreadMessages(tenantId, userIdA, userIdB, limit?)` | Returns thread messages newest-first (default limit 50) |
| `markThreadRead(tenantId, threadId, readerId)` | Marks unread messages read + atomically decrements `unreadMessageCount`; returns count marked |
| `listUnreadCounts(userId)` | Returns `{ tenantId, unreadMessageCount }[]` across all of the user's active tenant memberships |
| `updateTenantUnreadCount(userId, tenantId, delta)` | Direct increment/decrement of `unreadMessageCount` for dashboard sync |

---

## Thread IDs

`buildThreadId(tenantId, senderIdA, senderIdB)` produces a deterministic, symmetric thread ID so both participants query the same thread document regardless of who initiated:

```
threadId = `${tenantId}_${sorted([senderIdA, senderIdB]).join("_")}`
```

---

## Unread Count Sync

Every `sendMessage` call increments `userTenantAccess[receiverId_tenantId].unreadMessageCount`.  
Every `markThreadRead` call decrements by the number of messages actually marked.  
`updateTenantUnreadCount` is the low-level method used by `unreadAggregationService` (Task 5.5.2) and any other code that needs to adjust the count directly.

Firestore index required for `listThreadMessages`:
```
Collection: messages
Fields:     threadId ASC, createdAt DESC
```

---

## Attachment Model

```ts
type MessageAttachment = {
  name: string;      // filename
  size: number;      // bytes (max 10 MB enforced by validateAttachment())
  type: string;      // MIME type (allowlist: image/*, application/pdf, text/plain)
  url: string;       // download URL
};
```

Validation is applied at write time in `sendMessage`. Invalid attachments throw before any Firestore write.

---

## Admin Messaging Console — `AdminMessagingScreens.tsx`

| Component | Behaviour |
|---|---|
| `AdminMessagingConsole` | Root: customer search/filter list + thread panel |
| `CustomerSearchBar` | Filters by name/email; debounced |
| `ThreadPanel` | Loads messages for selected customer, marks thread read on open |
| `BulkSendPanel` | Select multiple customers, compose message, preview + confirm before send |
| `AttachmentPicker` | Validates size (≤10 MB) and type before attaching |

Bulk send requires an explicit confirmation step — no accidental mass-sends.

---

## Sender Types

```ts
type SenderType = "admin" | "client" | "system";
```

`system` is reserved for automated notification messages. Admin-sent bulk messages use `"admin"`.

---

## Tenant Isolation

All queries include `tenantId`. `sendMessage` validates `sender` and `receiver` are within the same tenant. Cross-tenant messaging is rejected at the repository layer.
