import { Timestamp } from "firebase/firestore";

export type ScheduleWeekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type ScheduleTimeBlock = {
  start: string; // HH:mm
  end: string; // HH:mm
};

export type StaffScheduleException = {
  date: string; // YYYY-MM-DD
  blocks: ScheduleTimeBlock[];
  isClosed: boolean;
  note: string | null;
};

export type StaffScheduleWeekTemplate = Partial<Record<ScheduleWeekday, ScheduleTimeBlock[]>>;

export type StaffScheduleTemplate = {
  scheduleId: string;
  tenantId: string;
  staffId: string;
  locationId: string;
  weekTemplate: StaffScheduleWeekTemplate;
  exceptions: StaffScheduleException[];
  updatedAt: Timestamp;
};

export type UpsertStaffScheduleTemplateInput = Omit<StaffScheduleTemplate, "scheduleId" | "updatedAt">;
