import {
  BOOKING_STEPS,
  TIME_SEGMENT_LABELS,
  categorizeTimeSlot,
  computeBookingTotal,
  computeCancellationRefund,
  formatLongDateLabel,
  formatPhoneUs,
  formatShortDateLabel,
  formatTimeOfDay,
  formatUsd,
  formatUsDate,
  generateTimeSlots,
  groupTimeSlotsBySegment,
  parseTimeOfDay,
} from "../bookingHelpers";

describe("BOOKING_STEPS", () => {
  it("starts with service and ends with confirmation", () => {
    expect(BOOKING_STEPS[0]).toBe("service");
    expect(BOOKING_STEPS[BOOKING_STEPS.length - 1]).toBe("confirmation");
  });
});

describe("TIME_SEGMENT_LABELS", () => {
  it("has US-friendly labels", () => {
    expect(TIME_SEGMENT_LABELS.morning).toBe("Morning");
    expect(TIME_SEGMENT_LABELS.afternoon).toBe("Afternoon");
    expect(TIME_SEGMENT_LABELS.evening).toBe("Evening");
  });
});

describe("date formatters", () => {
  const date = new Date(2026, 2, 12); // Thu Mar 12 2026

  it("formatLongDateLabel produces 'Thursday, March 12'", () => {
    expect(formatLongDateLabel(date)).toBe("Thursday, March 12");
  });

  it("formatShortDateLabel produces 'Thu, Mar 12'", () => {
    expect(formatShortDateLabel(date)).toBe("Thu, Mar 12");
  });

  it("formatUsDate produces '03/12/2026'", () => {
    expect(formatUsDate(date)).toBe("03/12/2026");
  });
});

describe("time-of-day", () => {
  it("formatTimeOfDay 0 → 12:00 AM", () => {
    expect(formatTimeOfDay(0)).toBe("12:00 AM");
  });

  it("formatTimeOfDay 720 → 12:00 PM (noon)", () => {
    expect(formatTimeOfDay(12 * 60)).toBe("12:00 PM");
  });

  it("formatTimeOfDay 9*60 → 9:00 AM", () => {
    expect(formatTimeOfDay(9 * 60)).toBe("9:00 AM");
  });

  it("formatTimeOfDay 17*60+30 → 5:30 PM", () => {
    expect(formatTimeOfDay(17 * 60 + 30)).toBe("5:30 PM");
  });

  it("parseTimeOfDay roundtrips formatTimeOfDay", () => {
    for (const minutes of [0, 9 * 60, 12 * 60, 17 * 60 + 45]) {
      expect(parseTimeOfDay(formatTimeOfDay(minutes))).toBe(minutes);
    }
  });

  it("parseTimeOfDay returns NaN on bad input", () => {
    expect(parseTimeOfDay("nope")).toBeNaN();
    expect(parseTimeOfDay("9:00")).toBeNaN(); // missing AM/PM
  });
});

describe("categorizeTimeSlot", () => {
  it("returns morning before noon", () => {
    expect(categorizeTimeSlot("9:00 AM")).toBe("morning");
    expect(categorizeTimeSlot("11:59 AM")).toBe("morning");
  });

  it("returns afternoon for 12:00 PM through 4:59 PM", () => {
    expect(categorizeTimeSlot("12:00 PM")).toBe("afternoon");
    expect(categorizeTimeSlot("4:59 PM")).toBe("afternoon");
  });

  it("returns evening for 5:00 PM and later", () => {
    expect(categorizeTimeSlot("5:00 PM")).toBe("evening");
    expect(categorizeTimeSlot("11:30 PM")).toBe("evening");
  });
});

describe("groupTimeSlotsBySegment", () => {
  it("groups slots by segment and skips invalid", () => {
    const result = groupTimeSlotsBySegment([
      "9:00 AM",
      "12:30 PM",
      "6:00 PM",
      "garbage",
    ]);
    expect(result.morning).toEqual(["9:00 AM"]);
    expect(result.afternoon).toEqual(["12:30 PM"]);
    expect(result.evening).toEqual(["6:00 PM"]);
  });
});

describe("computeBookingTotal", () => {
  it("sums services + add-ons + tax + tip", () => {
    const result = computeBookingTotal({
      services: [{ priceUsd: 60 }, { priceUsd: 40 }],
      addOns: [{ priceUsd: 8 }],
      taxRate: 0.0875,
      tip: 20,
    });
    expect(result.subtotal).toBe(108);
    expect(result.tax).toBeCloseTo(9.45, 2);
    expect(result.tip).toBe(20);
    expect(result.total).toBeCloseTo(137.45, 2);
  });

  it("defaults taxRate and tip to 0", () => {
    const result = computeBookingTotal({
      services: [{ priceUsd: 50 }],
    });
    expect(result.tax).toBe(0);
    expect(result.tip).toBe(0);
    expect(result.total).toBe(50);
  });
});

describe("formatUsd", () => {
  it("renders US currency with cents", () => {
    expect(formatUsd(0)).toBe("$0.00");
    expect(formatUsd(108)).toBe("$108.00");
    expect(formatUsd(1234.5)).toBe("$1,234.50");
  });

  it("handles negative amounts", () => {
    expect(formatUsd(-10)).toBe("-$10.00");
  });
});

describe("formatPhoneUs", () => {
  it("formats 10-digit US number", () => {
    expect(formatPhoneUs("5551234567")).toBe("(555) 123-4567");
    expect(formatPhoneUs("(555) 123-4567")).toBe("(555) 123-4567");
  });

  it("returns input unchanged when not 10 digits", () => {
    expect(formatPhoneUs("123")).toBe("123");
  });
});

describe("generateTimeSlots", () => {
  it("generates inclusive slot list at given step", () => {
    const slots = generateTimeSlots(9 * 60, 11 * 60, 30);
    expect(slots).toEqual(["9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM"]);
  });

  it("returns empty for invalid input", () => {
    expect(generateTimeSlots(10 * 60, 9 * 60, 30)).toEqual([]);
    expect(generateTimeSlots(9 * 60, 10 * 60, 0)).toEqual([]);
  });
});

describe("computeCancellationRefund", () => {
  it("subtracts fee from total", () => {
    expect(computeCancellationRefund({ total: 100, fee: 25 })).toEqual({
      refund: 75,
      fee: 25,
    });
  });

  it("clamps refund at 0 when fee exceeds total", () => {
    expect(computeCancellationRefund({ total: 10, fee: 25 })).toEqual({
      refund: 0,
      fee: 25,
    });
  });

  it("clamps fee at 0", () => {
    expect(computeCancellationRefund({ total: 100, fee: -5 })).toEqual({
      refund: 100,
      fee: 0,
    });
  });
});
