import { Timestamp } from "firebase/firestore";

import { generateSlots, timeToMinutes, minutesToTime, dateToWeekday } from "../slotEngine";
import type { GenerateSlotsInput } from "../slotEngine";
import type { StaffScheduleTemplate } from "../../staff/staffSchedulesModel";

// firebase/firestore is only needed for the Timestamp type in StaffScheduleTemplate;
// no module mock required — slotEngine is a pure module.

function makeSchedule(
  overrides: Partial<StaffScheduleTemplate> = {},
): StaffScheduleTemplate {
  return {
    scheduleId: "sched-1",
    tenantId: "t1",
    staffId: "s1",
    locationId: "l1",
    weekTemplate: {},
    exceptions: [],
    updatedAt: { seconds: 0, nanoseconds: 0 } as unknown as Timestamp,
    ...overrides,
  };
}

function makeInput(
  overrides: Partial<GenerateSlotsInput> = {},
): GenerateSlotsInput {
  return {
    schedule: makeSchedule({
      weekTemplate: { mon: [{ start: "09:00", end: "17:00" }] },
    }),
    // 2026-04-27 is a Monday
    date: "2026-04-27",
    existingBookings: [],
    serviceDurationMinutes: 60,
    bufferMinutes: 10,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// timeToMinutes / minutesToTime
// ---------------------------------------------------------------------------

describe("timeToMinutes", () => {
  it("converts 00:00 to 0", () => {
    expect(timeToMinutes("00:00")).toBe(0);
  });

  it("converts 09:00 to 540", () => {
    expect(timeToMinutes("09:00")).toBe(540);
  });

  it("converts 17:30 to 1050", () => {
    expect(timeToMinutes("17:30")).toBe(1050);
  });
});

describe("minutesToTime", () => {
  it("converts 0 to 00:00", () => {
    expect(minutesToTime(0)).toBe("00:00");
  });

  it("converts 540 to 09:00", () => {
    expect(minutesToTime(540)).toBe("09:00");
  });

  it("converts 1050 to 17:30", () => {
    expect(minutesToTime(1050)).toBe("17:30");
  });
});

// ---------------------------------------------------------------------------
// dateToWeekday
// ---------------------------------------------------------------------------

describe("dateToWeekday", () => {
  it("maps a Monday to mon", () => {
    expect(dateToWeekday("2026-04-27")).toBe("mon");
  });

  it("maps a Sunday to sun", () => {
    expect(dateToWeekday("2026-04-26")).toBe("sun");
  });

  it("maps a Saturday to sat", () => {
    expect(dateToWeekday("2026-05-02")).toBe("sat");
  });
});

// ---------------------------------------------------------------------------
// generateSlots
// ---------------------------------------------------------------------------

describe("generateSlots", () => {
  it("returns empty array when serviceDurationMinutes is 0", () => {
    const result = generateSlots(makeInput({ serviceDurationMinutes: 0 }));
    expect(result).toHaveLength(0);
  });

  it("returns empty array when no week template for the date's weekday", () => {
    const schedule = makeSchedule({
      weekTemplate: { tue: [{ start: "09:00", end: "17:00" }] }, // no Monday
    });
    // 2026-04-27 = Monday
    const result = generateSlots(makeInput({ schedule, date: "2026-04-27" }));
    expect(result).toHaveLength(0);
  });

  it("returns empty array when exception marks the date as closed", () => {
    const schedule = makeSchedule({
      weekTemplate: { mon: [{ start: "09:00", end: "17:00" }] },
      exceptions: [{ date: "2026-04-27", blocks: [], isClosed: true, note: null }],
    });
    const result = generateSlots(makeInput({ schedule, date: "2026-04-27" }));
    expect(result).toHaveLength(0);
  });

  it("returns correct slots for a simple 9:00-17:00 block with 60 min service and 10 min buffer", () => {
    // Block: 540-1020 (9:00-17:00), duration=60, buffer=10
    // Positions: 540, 610, 680, 750, 820, 890, 960
    // 960+60=1020 ≤ 1020 ✓; next would be 1030+60=1090 > 1020 ✗
    const result = generateSlots(makeInput());
    expect(result).toHaveLength(7);
    expect(result[0]).toMatchObject({ startMinutes: 540, endMinutes: 600, startTime: "09:00", endTime: "10:00" });
    expect(result[6]).toMatchObject({ startMinutes: 960, endMinutes: 1020, startTime: "16:00", endTime: "17:00" });
  });

  it("excludes slots that conflict with existing bookings", () => {
    // Existing booking at 09:00-10:00 with 10-min buffer → effectiveEnd=610
    const existingBookings = [{ startMinutes: 540, endMinutes: 600, bufferMinutes: 10 }];
    const result = generateSlots(makeInput({ existingBookings }));
    // First slot at 540 conflicts → excluded; second at 610 is the next iteration
    const startTimes = result.map((s) => s.startMinutes);
    expect(startTimes).not.toContain(540);
    expect(startTimes[0]).toBe(610);
  });

  it("uses exception blocks when a date override is present", () => {
    const schedule = makeSchedule({
      weekTemplate: { mon: [{ start: "09:00", end: "17:00" }] },
      exceptions: [
        { date: "2026-04-27", blocks: [{ start: "10:00", end: "12:00" }], isClosed: false, note: null },
      ],
    });
    // Exception block 600-720 (10:00-12:00), duration=60, buffer=10
    // Positions: 600, 670; 670+60=730 > 720 ✗ → only 1 more slot at 670: 670+60=730>720 ✗
    // Actually: 600+60=660≤720 ✓; 600+60+10=670; 670+60=730>720 ✗ → 2 slots: 600 and... wait
    // pos=600: 600+60=660≤720 → slot; pos next = 600+60+10=670; 670+60=730>720 → stop
    // So just 1 slot? Let me recalculate: 600+60=660≤720 ✓ (slot); 670+60=730>720 (stop) → 1 slot
    const result = generateSlots(makeInput({ schedule, date: "2026-04-27" }));
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ startMinutes: 600, startTime: "10:00", endTime: "11:00" });
  });

  it("handles multiple blocks in one day", () => {
    const schedule = makeSchedule({
      weekTemplate: {
        mon: [
          { start: "09:00", end: "12:00" }, // 540-720: 3 periods of 60+10=70 → 540,610,680. 680+60=740>720 → 2 slots (680 barely: 680+60=740>720 → 2)
          { start: "13:00", end: "17:00" }, // 780-1020: same as above, 7 slots
        ],
      },
    });
    const result = generateSlots(makeInput({ schedule }));
    // Morning block 540-720 (9:00-12:00): pos=540(✓), 610(✓), 680: 680+60=740>720 ✗ → 2 slots
    // Afternoon block 780-1020 (13:00-17:00): 240 min; slots at 780,850,920; next 990+60=1050>1020 → 3 slots
    expect(result).toHaveLength(2 + 3);
    // Morning slots start at 09:00 and 10:10
    expect(result[0]?.startTime).toBe("09:00");
    expect(result[1]?.startTime).toBe("10:10");
    // Afternoon starts at 13:00
    expect(result[2]?.startTime).toBe("13:00");
  });

  it("includes last slot when it fits exactly at block end", () => {
    // Block 09:00-10:00 (540-600), 60 min service, 0 min buffer
    const schedule = makeSchedule({
      weekTemplate: { mon: [{ start: "09:00", end: "10:00" }] },
    });
    const result = generateSlots(makeInput({ schedule, serviceDurationMinutes: 60, bufferMinutes: 0 }));
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ startMinutes: 540, endMinutes: 600 });
  });

  it("excludes slot that would extend beyond block end", () => {
    // Block 09:00-09:30 (540-570), 60 min service → 540+60=600>570 → no slots
    const schedule = makeSchedule({
      weekTemplate: { mon: [{ start: "09:00", end: "09:30" }] },
    });
    const result = generateSlots(makeInput({ schedule, serviceDurationMinutes: 60, bufferMinutes: 0 }));
    expect(result).toHaveLength(0);
  });
});
