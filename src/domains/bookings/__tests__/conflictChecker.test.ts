import { hasConflict } from "../conflictChecker";
import type { BookedInterval, ProposedInterval } from "../conflictChecker";

function booked(startMinutes: number, endMinutes: number, bufferMinutes = 0): BookedInterval {
  return { startMinutes, endMinutes, bufferMinutes };
}

function proposed(startMinutes: number, endMinutes: number): ProposedInterval {
  return { startMinutes, endMinutes };
}

describe("hasConflict", () => {
  it("returns false when proposed is entirely before existing booking", () => {
    // proposed 540-600, booked 660-720
    expect(hasConflict(proposed(540, 600), [booked(660, 720)])).toBe(false);
  });

  it("returns false when proposed is entirely after existing booking + buffer", () => {
    // proposed 660-720, booked 540-600, buffer=60 → effectiveEnd=660
    expect(hasConflict(proposed(660, 720), [booked(540, 600, 60)])).toBe(false);
  });

  it("returns true when proposed overlaps start of existing booking", () => {
    // proposed 600-660, booked 630-690
    expect(hasConflict(proposed(600, 660), [booked(630, 690)])).toBe(true);
  });

  it("returns true when proposed overlaps end of existing booking", () => {
    // proposed 570-630, booked 540-600
    expect(hasConflict(proposed(570, 630), [booked(540, 600)])).toBe(true);
  });

  it("returns true when proposed is completely inside existing booking", () => {
    // proposed 560-580, booked 540-600
    expect(hasConflict(proposed(560, 580), [booked(540, 600)])).toBe(true);
  });

  it("returns true when proposed completely contains existing booking", () => {
    // proposed 530-610, booked 540-600
    expect(hasConflict(proposed(530, 610), [booked(540, 600)])).toBe(true);
  });

  it("returns false for empty booked list", () => {
    expect(hasConflict(proposed(540, 600), [])).toBe(false);
  });

  it("returns true when proposed starts during buffer gap following existing booking", () => {
    // booked 540-600, buffer=30 → effectiveEnd=630
    // proposed 610-670 → 610 < 630 AND 540 < 670 → conflict
    expect(hasConflict(proposed(610, 670), [booked(540, 600, 30)])).toBe(true);
  });

  it("returns false when proposed starts exactly at effectiveEnd of existing booking", () => {
    // booked 540-600, buffer=30 → effectiveEnd=630
    // proposed 630-690 → 630 < 630 is false → no conflict
    expect(hasConflict(proposed(630, 690), [booked(540, 600, 30)])).toBe(false);
  });
});
