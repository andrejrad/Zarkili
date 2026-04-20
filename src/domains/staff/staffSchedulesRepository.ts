import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Firestore,
} from "firebase/firestore";

import type {
  ScheduleTimeBlock,
  ScheduleWeekday,
  StaffScheduleException,
  StaffScheduleTemplate,
  StaffScheduleWeekTemplate,
  UpsertStaffScheduleTemplateInput,
} from "./staffSchedulesModel";

const COLLECTION = "staffSchedules";
const weekdays: ScheduleWeekday[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

function assertNonEmpty(value: string, field: string): void {
  if (!value || value.trim().length === 0) {
    throw new Error(`${field} is required`);
  }
}

function parseHm(value: string, field: string): number {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) {
    throw new Error(`${field} must use HH:mm format`);
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error(`${field} is out of range`);
  }

  return hours * 60 + minutes;
}

function validateTimeBlocks(blocks: ScheduleTimeBlock[], field: string): void {
  if (!Array.isArray(blocks)) {
    throw new Error(`${field} must be an array`);
  }

  const intervals = blocks.map((block, index) => {
    if (!block || typeof block !== "object") {
      throw new Error(`${field}[${index}] is invalid`);
    }

    const start = parseHm(block.start, `${field}[${index}].start`);
    const end = parseHm(block.end, `${field}[${index}].end`);

    if (end <= start) {
      throw new Error(`${field}[${index}] has invalid range`);
    }

    return { start, end };
  });

  const sorted = [...intervals].sort((a, b) => a.start - b.start);
  for (let i = 1; i < sorted.length; i += 1) {
    if (sorted[i - 1].end > sorted[i].start) {
      throw new Error(`${field} contains overlapping ranges`);
    }
  }
}

function validateWeekTemplate(weekTemplate: StaffScheduleWeekTemplate): void {
  if (!weekTemplate || typeof weekTemplate !== "object" || Array.isArray(weekTemplate)) {
    throw new Error("weekTemplate is invalid");
  }

  for (const [day, blocks] of Object.entries(weekTemplate)) {
    if (!weekdays.includes(day as ScheduleWeekday)) {
      throw new Error(`weekTemplate day '${day}' is invalid`);
    }

    validateTimeBlocks(blocks as ScheduleTimeBlock[], `weekTemplate.${day}`);
  }
}

function validateException(exception: StaffScheduleException, field: string): void {
  if (!exception || typeof exception !== "object") {
    throw new Error(`${field} is invalid`);
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(exception.date)) {
    throw new Error(`${field}.date must use YYYY-MM-DD format`);
  }

  if (typeof exception.isClosed !== "boolean") {
    throw new Error(`${field}.isClosed must be a boolean`);
  }

  if (exception.note !== null && typeof exception.note !== "string") {
    throw new Error(`${field}.note must be a string or null`);
  }

  validateTimeBlocks(exception.blocks, `${field}.blocks`);
}

function validateExceptions(exceptions: StaffScheduleException[]): void {
  if (!Array.isArray(exceptions)) {
    throw new Error("exceptions must be an array");
  }

  for (let i = 0; i < exceptions.length; i += 1) {
    validateException(exceptions[i], `exceptions[${i}]`);
  }
}

function validateUpsertInput(input: UpsertStaffScheduleTemplateInput): void {
  assertNonEmpty(input.tenantId, "tenantId");
  assertNonEmpty(input.staffId, "staffId");
  assertNonEmpty(input.locationId, "locationId");
  validateWeekTemplate(input.weekTemplate);
  validateExceptions(input.exceptions);
}

function buildScheduleId(tenantId: string, staffId: string, locationId: string): string {
  return `${tenantId}_${staffId}_${locationId}`;
}

export function createStaffSchedulesRepository(db: Firestore) {
  async function upsertScheduleTemplate(
    input: UpsertStaffScheduleTemplateInput
  ): Promise<StaffScheduleTemplate> {
    validateUpsertInput(input);

    const scheduleId = buildScheduleId(input.tenantId, input.staffId, input.locationId);
    const ref = doc(db, COLLECTION, scheduleId);

    await setDoc(
      ref,
      {
        scheduleId,
        ...input,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    const snapshot = await getDoc(ref);
    return { ...(snapshot.data() as Omit<StaffScheduleTemplate, "scheduleId">), scheduleId };
  }

  async function getScheduleTemplate(
    tenantId: string,
    staffId: string,
    locationId: string
  ): Promise<StaffScheduleTemplate | null> {
    assertNonEmpty(tenantId, "tenantId");
    assertNonEmpty(staffId, "staffId");
    assertNonEmpty(locationId, "locationId");

    const snapshot = await getDocs(
      query(
        collection(db, COLLECTION),
        where("tenantId", "==", tenantId),
        where("staffId", "==", staffId),
        where("locationId", "==", locationId)
      )
    );

    if (snapshot.empty) {
      return null;
    }

    const docSnap = snapshot.docs[0];
    return { ...(docSnap.data() as Omit<StaffScheduleTemplate, "scheduleId">), scheduleId: docSnap.id };
  }

  async function addException(scheduleId: string, exception: StaffScheduleException): Promise<void> {
    assertNonEmpty(scheduleId, "scheduleId");
    validateException(exception, "exception");

    const ref = doc(db, COLLECTION, scheduleId);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) {
      throw new Error(`Schedule ${scheduleId} not found`);
    }

    const existing = snapshot.data() as StaffScheduleTemplate;
    if (existing.exceptions.some((entry) => entry.date === exception.date)) {
      throw new Error(`Exception for date ${exception.date} already exists`);
    }

    const nextExceptions = [...existing.exceptions, exception];
    validateExceptions(nextExceptions);

    await updateDoc(ref, {
      exceptions: nextExceptions,
      updatedAt: serverTimestamp(),
    });
  }

  async function removeException(scheduleId: string, date: string): Promise<void> {
    assertNonEmpty(scheduleId, "scheduleId");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error("date must use YYYY-MM-DD format");
    }

    const ref = doc(db, COLLECTION, scheduleId);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) {
      throw new Error(`Schedule ${scheduleId} not found`);
    }

    const existing = snapshot.data() as StaffScheduleTemplate;
    if (!existing.exceptions.some((entry) => entry.date === date)) {
      throw new Error(`Exception for date ${date} not found`);
    }

    await updateDoc(ref, {
      exceptions: existing.exceptions.filter((entry) => entry.date !== date),
      updatedAt: serverTimestamp(),
    });
  }

  return {
    upsertScheduleTemplate,
    getScheduleTemplate,
    addException,
    removeException,
  };
}

export type StaffSchedulesRepository = ReturnType<typeof createStaffSchedulesRepository>;
