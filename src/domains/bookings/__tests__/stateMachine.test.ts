import {
  assertValidStatusTransition,
  BOOKING_STATUS_TRANSITIONS,
  ACTOR_TRANSITION_PERMISSIONS,
  BookingError,
} from "../model";
import type { BookingStatus, BookingActorRole } from "../model";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function expectTransitionOk(from: BookingStatus, to: BookingStatus, actor?: BookingActorRole) {
  expect(() => assertValidStatusTransition(from, to, actor)).not.toThrow();
}

function expectInvalidTransition(from: BookingStatus, to: BookingStatus) {
  expect(() => assertValidStatusTransition(from, to)).toThrow(
    expect.objectContaining({ code: "INVALID_STATUS_TRANSITION" }),
  );
}

function expectUnauthorized(from: BookingStatus, to: BookingStatus, actor: BookingActorRole) {
  expect(() => assertValidStatusTransition(from, to, actor)).toThrow(
    expect.objectContaining({ code: "UNAUTHORIZED_TRANSITION" }),
  );
}

// ---------------------------------------------------------------------------
// Transition matrix — structural completeness
// ---------------------------------------------------------------------------

describe("BOOKING_STATUS_TRANSITIONS", () => {
  it("covers all BookingStatus values as keys", () => {
    const allStatuses: BookingStatus[] = [
      "pending",
      "confirmed",
      "completed",
      "cancelled",
      "rejected",
      "no_show",
      "reschedule_pending",
      "reschedule_rejected",
      "rescheduled",
    ];
    for (const status of allStatuses) {
      expect(BOOKING_STATUS_TRANSITIONS).toHaveProperty(status);
    }
  });

  it("terminal statuses have no outgoing transitions", () => {
    const terminals: BookingStatus[] = ["cancelled", "completed", "rejected", "no_show"];
    for (const status of terminals) {
      expect(BOOKING_STATUS_TRANSITIONS[status]).toHaveLength(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Valid structural transitions (no actor)
// ---------------------------------------------------------------------------

describe("assertValidStatusTransition — valid transitions", () => {
  it("pending → confirmed", () => expectTransitionOk("pending", "confirmed"));
  it("pending → cancelled", () => expectTransitionOk("pending", "cancelled"));
  it("pending → rejected",  () => expectTransitionOk("pending", "rejected"));

  it("confirmed → completed",          () => expectTransitionOk("confirmed", "completed"));
  it("confirmed → cancelled",          () => expectTransitionOk("confirmed", "cancelled"));
  it("confirmed → no_show",            () => expectTransitionOk("confirmed", "no_show"));
  it("confirmed → reschedule_pending", () => expectTransitionOk("confirmed", "reschedule_pending"));

  it("reschedule_pending → rescheduled",         () => expectTransitionOk("reschedule_pending", "rescheduled"));
  it("reschedule_pending → reschedule_rejected", () => expectTransitionOk("reschedule_pending", "reschedule_rejected"));
  it("reschedule_pending → cancelled",           () => expectTransitionOk("reschedule_pending", "cancelled"));

  it("reschedule_rejected → confirmed", () => expectTransitionOk("reschedule_rejected", "confirmed"));
  it("reschedule_rejected → cancelled", () => expectTransitionOk("reschedule_rejected", "cancelled"));

  it("rescheduled → completed", () => expectTransitionOk("rescheduled", "completed"));
  it("rescheduled → cancelled", () => expectTransitionOk("rescheduled", "cancelled"));
  it("rescheduled → no_show",   () => expectTransitionOk("rescheduled", "no_show"));
});

// ---------------------------------------------------------------------------
// Invalid structural transitions (no actor)
// ---------------------------------------------------------------------------

describe("assertValidStatusTransition — invalid transitions throw INVALID_STATUS_TRANSITION", () => {
  it("pending → completed is invalid",           () => expectInvalidTransition("pending", "completed"));
  it("pending → no_show is invalid",             () => expectInvalidTransition("pending", "no_show"));
  it("confirmed → pending is invalid",           () => expectInvalidTransition("confirmed", "pending"));
  it("confirmed → rejected is invalid",          () => expectInvalidTransition("confirmed", "rejected"));
  it("cancelled → confirmed is invalid",         () => expectInvalidTransition("cancelled", "confirmed"));
  it("completed → confirmed is invalid",         () => expectInvalidTransition("completed", "confirmed"));
  it("rejected → confirmed is invalid",          () => expectInvalidTransition("rejected", "confirmed"));
  it("no_show → confirmed is invalid",           () => expectInvalidTransition("no_show", "confirmed"));
  it("rescheduled → pending is invalid",         () => expectInvalidTransition("rescheduled", "pending"));
  it("reschedule_rejected → completed is invalid", () => expectInvalidTransition("reschedule_rejected", "completed"));
});

// ---------------------------------------------------------------------------
// Actor-based authorization — allowed transitions
// ---------------------------------------------------------------------------

describe("assertValidStatusTransition — actor-based authorization (allowed)", () => {
  // tenant_admin can do anything structurally valid
  it("tenant_admin: pending → confirmed",          () => expectTransitionOk("pending", "confirmed", "tenant_admin"));
  it("tenant_admin: pending → rejected",           () => expectTransitionOk("pending", "rejected", "tenant_admin"));
  it("tenant_admin: confirmed → completed",        () => expectTransitionOk("confirmed", "completed", "tenant_admin"));
  it("tenant_admin: confirmed → no_show",          () => expectTransitionOk("confirmed", "no_show", "tenant_admin"));
  it("tenant_admin: reschedule_pending → rescheduled", () => expectTransitionOk("reschedule_pending", "rescheduled", "tenant_admin"));
  it("tenant_admin: reschedule_pending → reschedule_rejected", () => expectTransitionOk("reschedule_pending", "reschedule_rejected", "tenant_admin"));

  // location_manager shares all tenant_admin transitions
  it("location_manager: pending → confirmed",      () => expectTransitionOk("pending", "confirmed", "location_manager"));
  it("location_manager: pending → rejected",       () => expectTransitionOk("pending", "rejected", "location_manager"));
  it("location_manager: confirmed → completed",    () => expectTransitionOk("confirmed", "completed", "location_manager"));
  it("location_manager: reschedule_pending → rescheduled", () => expectTransitionOk("reschedule_pending", "rescheduled", "location_manager"));

  // client allowed transitions
  it("client: pending → cancelled",                () => expectTransitionOk("pending", "cancelled", "client"));
  it("client: confirmed → reschedule_pending",     () => expectTransitionOk("confirmed", "reschedule_pending", "client"));
  it("client: confirmed → cancelled",              () => expectTransitionOk("confirmed", "cancelled", "client"));
  it("client: reschedule_pending → cancelled",     () => expectTransitionOk("reschedule_pending", "cancelled", "client"));
  it("client: reschedule_rejected → confirmed",    () => expectTransitionOk("reschedule_rejected", "confirmed", "client"));
  it("client: reschedule_rejected → cancelled",    () => expectTransitionOk("reschedule_rejected", "cancelled", "client"));
  it("client: rescheduled → cancelled",            () => expectTransitionOk("rescheduled", "cancelled", "client"));

  // technician allowed transitions
  it("technician: confirmed → completed",          () => expectTransitionOk("confirmed", "completed", "technician"));
  it("technician: confirmed → no_show",            () => expectTransitionOk("confirmed", "no_show", "technician"));
  it("technician: rescheduled → completed",        () => expectTransitionOk("rescheduled", "completed", "technician"));
  it("technician: rescheduled → no_show",          () => expectTransitionOk("rescheduled", "no_show", "technician"));
});

// ---------------------------------------------------------------------------
// Actor-based authorization — denied transitions
// ---------------------------------------------------------------------------

describe("assertValidStatusTransition — actor-based authorization (unauthorized)", () => {
  // client cannot confirm, reject, or mark no-show
  it("client cannot confirm pending booking",       () => expectUnauthorized("pending", "confirmed", "client"));
  it("client cannot reject pending booking",        () => expectUnauthorized("pending", "rejected", "client"));
  it("client cannot mark no_show on confirmed",     () => expectUnauthorized("confirmed", "no_show", "client"));
  it("client cannot mark completed on confirmed",   () => expectUnauthorized("confirmed", "completed", "client"));
  it("client cannot approve reschedule",            () => expectUnauthorized("reschedule_pending", "rescheduled", "client"));
  it("client cannot reject reschedule request",     () => expectUnauthorized("reschedule_pending", "reschedule_rejected", "client"));

  // technician cannot cancel, confirm, or reject
  it("technician cannot cancel pending",            () => expectUnauthorized("pending", "cancelled", "technician"));
  it("technician cannot confirm pending",           () => expectUnauthorized("pending", "confirmed", "technician"));
  it("technician cannot approve reschedule",        () => expectUnauthorized("reschedule_pending", "rescheduled", "technician"));

  // client INVALID_STATUS_TRANSITION (not just unauthorized) still fires first
  it("client gets INVALID_STATUS_TRANSITION for structurally invalid route", () => {
    expect(() => assertValidStatusTransition("cancelled", "pending", "client")).toThrow(
      expect.objectContaining({ code: "INVALID_STATUS_TRANSITION" }),
    );
  });
});

// ---------------------------------------------------------------------------
// ACTOR_TRANSITION_PERMISSIONS — consistency with BOOKING_STATUS_TRANSITIONS
// ---------------------------------------------------------------------------

describe("ACTOR_TRANSITION_PERMISSIONS — all entries reference valid structural transitions", () => {
  it("every (from, to) pair in ACTOR_TRANSITION_PERMISSIONS is in BOOKING_STATUS_TRANSITIONS", () => {
    for (const [from, toMap] of Object.entries(ACTOR_TRANSITION_PERMISSIONS)) {
      const validTargets = BOOKING_STATUS_TRANSITIONS[from as BookingStatus];
      for (const to of Object.keys(toMap ?? {})) {
        expect(validTargets).toContain(to);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// BookingError identity
// ---------------------------------------------------------------------------

describe("BookingError", () => {
  it("sets name to BookingError", () => {
    const err = new BookingError("SLOT_UNAVAILABLE", "test");
    expect(err.name).toBe("BookingError");
    expect(err.code).toBe("SLOT_UNAVAILABLE");
    expect(err.message).toBe("test");
  });

  it("is an instance of Error", () => {
    expect(new BookingError("BOOKING_NOT_FOUND", "")).toBeInstanceOf(Error);
  });
});
