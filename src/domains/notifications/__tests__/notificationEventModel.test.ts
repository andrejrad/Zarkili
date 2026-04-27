import {
  ALL_NOTIFICATION_EVENT_TYPES,
  NotificationEventValidationError,
  validateNotificationEvent,
} from "../notificationEventModel";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeBaseBookingPayload(overrides: Record<string, unknown> = {}) {
  return {
    bookingId: "booking-1",
    tenantId: "tenant-1",
    locationId: "loc-1",
    customerUserId: "user-1",
    date: "2025-09-01",
    startMinutes: 540,
    serviceName: "Haircut",
    staffName: "Ana",
    ...overrides,
  };
}

function makeValidEvent(overrides: Record<string, unknown> = {}) {
  return {
    eventId: "evt-001",
    eventType: "booking_confirmed",
    tenantId: "tenant-1",
    locationId: "loc-1",
    recipients: [{ userId: "user-1", channel: "in_app" }],
    locale: "en",
    payload: {
      ...makeBaseBookingPayload(),
      eventType: "booking_confirmed",
    },
    createdAt: "2025-09-01T09:00:00.000Z",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// validateNotificationEvent — positive cases
// ---------------------------------------------------------------------------

describe("validateNotificationEvent – positive cases", () => {
  test("accepts a valid booking_confirmed event", () => {
    const raw = makeValidEvent();
    const result = validateNotificationEvent(raw);
    expect(result.eventId).toBe("evt-001");
    expect(result.eventType).toBe("booking_confirmed");
    expect(result.recipients).toHaveLength(1);
    expect(result.recipients[0].channel).toBe("in_app");
  });

  test("accepts booking_created", () => {
    const raw = makeValidEvent({
      eventType: "booking_created",
      payload: { ...makeBaseBookingPayload(), eventType: "booking_created" },
    });
    const result = validateNotificationEvent(raw);
    expect(result.eventType).toBe("booking_created");
  });

  test("accepts booking_rejected with null reason", () => {
    const raw = makeValidEvent({
      eventType: "booking_rejected",
      payload: {
        ...makeBaseBookingPayload(),
        eventType: "booking_rejected",
        reason: null,
      },
    });
    const result = validateNotificationEvent(raw);
    expect(result.eventType).toBe("booking_rejected");
    if (result.payload.eventType === "booking_rejected") {
      expect(result.payload.reason).toBeNull();
    }
  });

  test("accepts booking_rejected with a reason string", () => {
    const raw = makeValidEvent({
      eventType: "booking_rejected",
      payload: {
        ...makeBaseBookingPayload(),
        eventType: "booking_rejected",
        reason: "Technician unavailable",
      },
    });
    const result = validateNotificationEvent(raw);
    if (result.payload.eventType === "booking_rejected") {
      expect(result.payload.reason).toBe("Technician unavailable");
    }
  });

  test("accepts booking_cancelled with null reason", () => {
    const raw = makeValidEvent({
      eventType: "booking_cancelled",
      payload: {
        ...makeBaseBookingPayload(),
        eventType: "booking_cancelled",
        reason: null,
      },
    });
    const result = validateNotificationEvent(raw);
    expect(result.eventType).toBe("booking_cancelled");
  });

  test("accepts booking_rescheduled with previousDate + previousStartMinutes", () => {
    const raw = makeValidEvent({
      eventType: "booking_rescheduled",
      payload: {
        ...makeBaseBookingPayload(),
        eventType: "booking_rescheduled",
        previousDate: "2025-08-28",
        previousStartMinutes: 600,
      },
    });
    const result = validateNotificationEvent(raw);
    if (result.payload.eventType === "booking_rescheduled") {
      expect(result.payload.previousDate).toBe("2025-08-28");
      expect(result.payload.previousStartMinutes).toBe(600);
    }
  });

  test("accepts reminder_due with appointmentAt ISO string", () => {
    const raw = makeValidEvent({
      eventType: "reminder_due",
      payload: {
        ...makeBaseBookingPayload(),
        eventType: "reminder_due",
        appointmentAt: "2025-09-01T09:00:00.000Z",
      },
    });
    const result = validateNotificationEvent(raw);
    if (result.payload.eventType === "reminder_due") {
      expect(result.payload.appointmentAt).toBe("2025-09-01T09:00:00.000Z");
    }
  });

  test("accepts multiple recipients with mixed channels", () => {
    const raw = makeValidEvent({
      recipients: [
        { userId: "u1", channel: "in_app" },
        { userId: "u2", channel: "email" },
        { userId: "u3", channel: "push" },
      ],
    });
    const result = validateNotificationEvent(raw);
    expect(result.recipients).toHaveLength(3);
  });

  test("ALL_NOTIFICATION_EVENT_TYPES covers all 6 event types", () => {
    expect(ALL_NOTIFICATION_EVENT_TYPES).toHaveLength(6);
  });
});

// ---------------------------------------------------------------------------
// validateNotificationEvent — negative cases
// ---------------------------------------------------------------------------

describe("validateNotificationEvent – negative cases", () => {
  test("throws NotificationEventValidationError for null input", () => {
    expect(() => validateNotificationEvent(null)).toThrow(
      NotificationEventValidationError,
    );
  });

  test("throws for missing eventId", () => {
    const raw = makeValidEvent({ eventId: "" });
    expect(() => validateNotificationEvent(raw)).toThrow(
      NotificationEventValidationError,
    );
  });

  test("throws for unknown eventType", () => {
    const raw = makeValidEvent({ eventType: "booking_exploded" });
    expect(() => validateNotificationEvent(raw)).toThrow(
      NotificationEventValidationError,
    );
  });

  test("throws for empty tenantId", () => {
    const raw = makeValidEvent({ tenantId: "" });
    expect(() => validateNotificationEvent(raw)).toThrow(
      NotificationEventValidationError,
    );
  });

  test("throws for empty recipients array", () => {
    const raw = makeValidEvent({ recipients: [] });
    expect(() => validateNotificationEvent(raw)).toThrow(
      NotificationEventValidationError,
    );
  });

  test("throws for invalid channel on recipient", () => {
    const raw = makeValidEvent({
      recipients: [{ userId: "u1", channel: "fax" }],
    });
    expect(() => validateNotificationEvent(raw)).toThrow(
      NotificationEventValidationError,
    );
  });

  test("throws for missing recipient userId", () => {
    const raw = makeValidEvent({
      recipients: [{ userId: "", channel: "in_app" }],
    });
    expect(() => validateNotificationEvent(raw)).toThrow(
      NotificationEventValidationError,
    );
  });

  test("throws for invalid createdAt date string", () => {
    const raw = makeValidEvent({ createdAt: "not-a-date" });
    expect(() => validateNotificationEvent(raw)).toThrow(
      NotificationEventValidationError,
    );
  });

  test("throws for missing payload", () => {
    const raw = makeValidEvent({ payload: undefined });
    expect(() => validateNotificationEvent(raw)).toThrow(
      NotificationEventValidationError,
    );
  });

  test("throws for negative startMinutes in payload", () => {
    const raw = makeValidEvent({
      payload: {
        ...makeBaseBookingPayload({ startMinutes: -1 }),
        eventType: "booking_confirmed",
      },
    });
    expect(() => validateNotificationEvent(raw)).toThrow(
      NotificationEventValidationError,
    );
  });

  test("throws for floating-point startMinutes", () => {
    const raw = makeValidEvent({
      payload: {
        ...makeBaseBookingPayload({ startMinutes: 540.5 }),
        eventType: "booking_confirmed",
      },
    });
    expect(() => validateNotificationEvent(raw)).toThrow(
      NotificationEventValidationError,
    );
  });

  test("throws for booking_rescheduled missing previousDate", () => {
    const raw = makeValidEvent({
      eventType: "booking_rescheduled",
      payload: {
        ...makeBaseBookingPayload(),
        eventType: "booking_rescheduled",
        previousStartMinutes: 600,
        // previousDate intentionally omitted
      },
    });
    expect(() => validateNotificationEvent(raw)).toThrow(
      NotificationEventValidationError,
    );
  });

  test("throws for reminder_due with invalid appointmentAt", () => {
    const raw = makeValidEvent({
      eventType: "reminder_due",
      payload: {
        ...makeBaseBookingPayload(),
        eventType: "reminder_due",
        appointmentAt: "yesterday",
      },
    });
    expect(() => validateNotificationEvent(raw)).toThrow(
      NotificationEventValidationError,
    );
  });

  test("throws for booking_rejected when reason is a number", () => {
    const raw = makeValidEvent({
      eventType: "booking_rejected",
      payload: {
        ...makeBaseBookingPayload(),
        eventType: "booking_rejected",
        reason: 42,
      },
    });
    expect(() => validateNotificationEvent(raw)).toThrow(
      NotificationEventValidationError,
    );
  });

  test("error name is NotificationEventValidationError", () => {
    try {
      validateNotificationEvent(null);
    } catch (err) {
      expect((err as Error).name).toBe("NotificationEventValidationError");
    }
  });
});
