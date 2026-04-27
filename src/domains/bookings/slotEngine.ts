import type { ScheduleTimeBlock, ScheduleWeekday, StaffScheduleTemplate } from "../staff/staffSchedulesModel";
import { hasConflict } from "./conflictChecker";
import type { BookedInterval } from "./conflictChecker";

export type AvailableSlot = {
  startMinutes: number;
  endMinutes: number;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
};

export type GenerateSlotsInput = {
  schedule: StaffScheduleTemplate;
  date: string; // YYYY-MM-DD
  existingBookings: BookedInterval[];
  serviceDurationMinutes: number;
  bufferMinutes: number;
};

// --- Pure time helpers -------------------------------------------------------

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function dateToWeekday(date: string): ScheduleWeekday {
  // Parse as local date components to avoid UTC-offset shifting the day
  const parts = date.split("-").map(Number);
  const d = new Date(parts[0] ?? 0, (parts[1] ?? 1) - 1, parts[2] ?? 1);
  const days: ScheduleWeekday[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  return days[d.getDay()] as ScheduleWeekday;
}

// --- Block resolution --------------------------------------------------------

function getBlocksForDate(
  schedule: StaffScheduleTemplate,
  date: string,
): ScheduleTimeBlock[] | null {
  const exception = schedule.exceptions.find((e) => e.date === date);
  if (exception) {
    return exception.isClosed ? null : exception.blocks;
  }
  const weekday = dateToWeekday(date);
  return schedule.weekTemplate[weekday] ?? null;
}

// --- Slot generation ----------------------------------------------------------

export function generateSlots(input: GenerateSlotsInput): AvailableSlot[] {
  const { schedule, date, existingBookings, serviceDurationMinutes, bufferMinutes } = input;

  if (serviceDurationMinutes <= 0) return [];

  const blocks = getBlocksForDate(schedule, date);
  if (!blocks || blocks.length === 0) return [];

  const slots: AvailableSlot[] = [];

  for (const block of blocks) {
    const blockStart = timeToMinutes(block.start);
    const blockEnd = timeToMinutes(block.end);
    if (blockEnd <= blockStart) continue; // malformed block — skip

    let pos = blockStart;
    while (pos + serviceDurationMinutes <= blockEnd) {
      const proposed = { startMinutes: pos, endMinutes: pos + serviceDurationMinutes };
      if (!hasConflict(proposed, existingBookings)) {
        slots.push({
          startMinutes: proposed.startMinutes,
          endMinutes: proposed.endMinutes,
          startTime: minutesToTime(proposed.startMinutes),
          endTime: minutesToTime(proposed.endMinutes),
        });
      }
      pos += serviceDurationMinutes + bufferMinutes;
    }
  }

  return slots;
}
