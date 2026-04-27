# Notification Events (Week 6.1)

## Purpose

The notification event contract defines the canonical payload shapes written
by Cloud Function triggers and consumed by the notification delivery layer.
Events are written to the `notificationEvents` Firestore collection and
optionally forwarded to external channels (email, push).

Model definitions live in
`src/domains/notifications/notificationEventModel.ts`.

---

## Event types

| `eventType` | Triggered when |
|---|---|
| `booking_created` | A new booking request is submitted |
| `booking_confirmed` | Staff or admin confirms a pending booking |
| `booking_rejected` | A pending booking request is declined |
| `booking_cancelled` | A confirmed booking is cancelled |
| `booking_rescheduled` | A booking is moved to a new date/time |
| `reminder_due` | The daily reminder job fires for a booking within the 24h window |

---

## Root envelope — `NotificationEvent`

Every event is wrapped in this envelope before being written to Firestore.

```ts
type NotificationEvent = {
  eventId:    string;                  // UUID-v4 — unique per transition
  eventType:  NotificationEventType;
  tenantId:   string;
  locationId: string;
  recipients: NotificationRecipient[];
  locale:     string;                  // BCP-47 tag, e.g. "en", "hr"
  payload:    NotificationEventPayload;
  createdAt:  string;                  // ISO-8601
};
```

### `NotificationRecipient`

```ts
type NotificationRecipient = {
  userId:  string;
  channel: "in_app" | "email" | "push";
};
```

Multiple recipients may appear in a single event (e.g. one `in_app` + one
`email` entry for the same user when both channels are active).

---

## Shared booking payload fields

All six event payloads extend `BookingPayloadBase`:

| Field | Type | Notes |
|---|---|---|
| `bookingId` | `string` | |
| `tenantId` | `string` | |
| `locationId` | `string` | |
| `customerUserId` | `string` | |
| `date` | `string` | YYYY-MM-DD |
| `startMinutes` | `number` | Minutes from midnight, e.g. 540 = 09:00 |
| `serviceName` | `string` | Display name, denormalised at write time |
| `staffName` | `string` | Display name, denormalised at write time |

---

## Per-event payload fields

### `booking_created`

No extra fields beyond `BookingPayloadBase`.

### `booking_confirmed`

No extra fields beyond `BookingPayloadBase`.

### `booking_rejected`

| Extra field | Type | Notes |
|---|---|---|
| `reason` | `string \| null` | Staff-provided rejection reason |

### `booking_cancelled`

| Extra field | Type | Notes |
|---|---|---|
| `reason` | `string \| null` | Cancellation reason |

### `booking_rescheduled`

| Extra field | Type | Notes |
|---|---|---|
| `previousDate` | `string` | YYYY-MM-DD — original date |
| `previousStartMinutes` | `number` | Original start time in minutes from midnight |

### `reminder_due`

| Extra field | Type | Notes |
|---|---|---|
| `appointmentAt` | `string` | ISO-8601 datetime of the appointment |

---

## Firestore layout

| Collection | Document ID | Written by |
|---|---|---|
| `notificationEvents` | `{eventId}` | `bookingTriggers.ts`, `scheduledReminders.ts` |
| `processedBookingEvents` | `{bookingId}_{status}_v{version}` | `bookingTriggers.ts` (idempotency marker) |
| `reminderSendLogs` | `{bookingId}_reminder_24h` | `scheduledReminders.ts` (idempotency marker) |

---

## Idempotency

### Booking trigger

`eventId` is composed as `{bookingId}_{status}_v{version}`. Before any
side-effect the trigger checks `processedBookingEvents/{eventId}`; if it
exists the function returns immediately. The marker is written **before** the
notification event so a transient failure between writes causes the retry to
skip rather than double-send.

### Reminder service

The scan job checks `reminderSendLogs/{bookingId}_reminder_24h` before
dispatching. The notification event and the log document are written in a
single Firestore batch.

---

## Template rendering

Templates are resolved at delivery time by `templateRenderer.ts` using the
following priority chain:

1. Tenant override (`tenantNotificationTemplates/{tenantId}_{eventType}`)
2. Built-in defaults (`BUILT_IN_TEMPLATES` in `notificationTemplateModel.ts`)

Locale resolution order: user language → tenant `defaultLanguage` → `"en"`.

Placeholder syntax: `{{variableName}}` — unknown keys are replaced with an
empty string (no raw placeholder leakage).

See [NOTIFICATION_TEMPLATES.md](NOTIFICATION_TEMPLATES.md) for the full
template model and rendering reference (to be created with Week 7 delivery
work if a dedicated doc is warranted).

---

## Validator

`validateNotificationEvent(raw: unknown): NotificationEvent`

Throws `NotificationEventValidationError` with a descriptive message when:
- Any required string field is missing or empty
- `eventType` is not one of the six known values
- A `channel` on a recipient is not `in_app | email | push`
- `startMinutes` is not a non-negative integer
- `createdAt` / `appointmentAt` are not valid ISO-8601 strings
- Payload is missing event-type-specific required fields

---

## Tests

- `src/domains/notifications/__tests__/notificationEventModel.test.ts`
  — 20+ cases covering positive validation for all 6 event types and negative
  cases for each required field constraint
