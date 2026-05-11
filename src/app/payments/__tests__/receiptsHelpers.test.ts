import {
  BOOKING_HISTORY_TABS,
  REFUND_STATUS_LABELS,
  buildRefundTimeline,
  computeReceiptTotals,
  countActiveBookingFilters,
  filterBookingHistory,
  formatPaymentMethodLine,
  formatRefundAmountLabel,
  lineItemSubtotal,
  type BookingHistoryRecord,
} from "../receiptsHelpers";

describe("receiptsHelpers", () => {
  describe("lineItemSubtotal + computeReceiptTotals", () => {
    it("multiplies quantity by unit price and clamps qty to >= 0", () => {
      expect(lineItemSubtotal({ id: "x", description: "Cut", quantity: 2, unitPriceUsd: 30 })).toBe(60);
      expect(lineItemSubtotal({ id: "x", description: "Cut", quantity: 0, unitPriceUsd: 30 })).toBe(0);
      expect(lineItemSubtotal({ id: "x", description: "Cut", quantity: -1, unitPriceUsd: 30 })).toBe(0);
    });

    it("aggregates subtotal + tax + tip into grand total", () => {
      const r = computeReceiptTotals({
        items: [
          { id: "a", description: "Haircut", quantity: 1, unitPriceUsd: 60 },
          { id: "b", description: "Color", quantity: 1, unitPriceUsd: 80 },
        ],
        taxLines: [{ label: "WA Sales Tax 10.25%", amount: 14.35 }],
        tip: 25,
      });
      expect(r.subtotal).toBe(140);
      expect(r.taxTotal).toBe(14.35);
      expect(r.tip).toBe(25);
      expect(r.grandTotal).toBe(179.35);
    });

    it("ignores negative tax line amounts", () => {
      const r = computeReceiptTotals({
        items: [{ id: "a", description: "Cut", quantity: 1, unitPriceUsd: 50 }],
        taxLines: [{ label: "Bad", amount: -5 }],
      });
      expect(r.taxTotal).toBe(0);
    });
  });

  describe("formatPaymentMethodLine + formatRefundAmountLabel", () => {
    it("formats card payment line", () => {
      expect(formatPaymentMethodLine({ brand: "visa", last4: "4242" })).toBe("Visa •••• 4242");
    });

    it("formats refund label and clamps negative amounts", () => {
      expect(formatRefundAmountLabel(45)).toBe("$45.00 refunded");
      expect(formatRefundAmountLabel(-5)).toBe("$0.00 refunded");
    });
  });

  describe("filterBookingHistory + countActiveBookingFilters", () => {
    const now = new Date("2026-04-27T12:00:00Z");
    const records: BookingHistoryRecord[] = [
      { id: "r1", salonId: "s1", salonName: "A", serviceName: "Cut", startsAtIso: "2026-05-01T15:00:00Z", status: "confirmed", totalUsd: 60 },
      { id: "r2", salonId: "s1", salonName: "A", serviceName: "Color", startsAtIso: "2026-04-01T15:00:00Z", status: "completed", totalUsd: 120 },
      { id: "r3", salonId: "s2", salonName: "B", serviceName: "Wash", startsAtIso: "2026-04-10T15:00:00Z", status: "cancelled", totalUsd: 30 },
      { id: "r4", salonId: "s2", salonName: "B", serviceName: "Wash", startsAtIso: "2026-04-15T15:00:00Z", status: "noShow", totalUsd: 30 },
    ];

    it("partitions Upcoming / Past / Cancelled tabs correctly", () => {
      const upcoming = filterBookingHistory(records, "upcoming", {}, now);
      expect(upcoming.map((r) => r.id)).toEqual(["r1"]);
      const past = filterBookingHistory(records, "past", {}, now);
      expect(past.map((r) => r.id)).toEqual(["r2"]);
      const cancelled = filterBookingHistory(records, "cancelled", {}, now);
      expect(cancelled.map((r) => r.id).sort()).toEqual(["r3", "r4"]);
    });

    it("applies salon and price filters", () => {
      const r = filterBookingHistory(records, "past", { salonIds: ["s1"], minPriceUsd: 100 }, now);
      expect(r.map((x) => x.id)).toEqual(["r2"]);
    });

    it("applies date range filter", () => {
      const r = filterBookingHistory(records, "cancelled", { fromDate: "2026-04-12", toDate: "2026-04-20" }, now);
      expect(r.map((x) => x.id)).toEqual(["r4"]);
    });

    it("counts active filter dimensions", () => {
      expect(countActiveBookingFilters({})).toBe(0);
      expect(countActiveBookingFilters({ salonIds: ["a"] })).toBe(1);
      expect(countActiveBookingFilters({ fromDate: "2026-01-01", toDate: "2026-12-31", status: ["confirmed"], minPriceUsd: 0 })).toBe(3);
    });
  });

  describe("buildRefundTimeline", () => {
    it("3-step success timeline with current marker", () => {
      const t = buildRefundTimeline({
        requestedAtIso: "2026-04-01",
        approvedAtIso: "2026-04-02",
        issuedAtIso: "2026-04-05",
      });
      expect(t.map((s) => s.id)).toEqual(["requested", "approved", "issued"]);
      expect(t[2].current).toBe(true);
    });

    it("denial branch", () => {
      const t = buildRefundTimeline({
        requestedAtIso: "2026-04-01",
        deniedAtIso: "2026-04-02",
      });
      expect(t.map((s) => s.id)).toEqual(["requested", "denied"]);
      expect(t[1].current).toBe(true);
    });

    it("partial completion: requested only is current", () => {
      const t = buildRefundTimeline({ requestedAtIso: "2026-04-01" });
      expect(t.find((s) => s.id === "requested")?.current).toBe(true);
      expect(t.find((s) => s.id === "issued")?.current).toBeFalsy();
    });
  });

  describe("constants", () => {
    it("exposes 3-tab list and refund-status labels", () => {
      expect(BOOKING_HISTORY_TABS).toEqual(["upcoming", "past", "cancelled"]);
      expect(REFUND_STATUS_LABELS.pending).toBe("Pending");
      expect(REFUND_STATUS_LABELS.issued).toBe("Issued");
      expect(REFUND_STATUS_LABELS.denied).toBe("Denied");
    });
  });
});
