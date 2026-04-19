import { Timestamp } from "firebase/firestore";

export type LocationStatus = "active" | "inactive";

export type TimeBlock = {
  start: string; // "HH:mm"
  end: string;   // "HH:mm"
};

export type OperatingHours = {
  mon?: TimeBlock[];
  tue?: TimeBlock[];
  wed?: TimeBlock[];
  thu?: TimeBlock[];
  fri?: TimeBlock[];
  sat?: TimeBlock[];
  sun?: TimeBlock[];
};

export type LocationAddress = {
  line1: string;
  city: string;
  country: string;
  postalCode: string;
  lat?: number;
  lng?: number;
};

export type Location = {
  locationId: string;
  tenantId: string;
  name: string;
  code: string;
  status: LocationStatus;
  timezone: string;
  phone: string | null;
  email: string | null;
  address: LocationAddress;
  operatingHours: OperatingHours;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type CreateLocationInput = Omit<Location, "locationId" | "createdAt" | "updatedAt">;

export type UpdateLocationInput = Partial<
  Pick<Location, "name" | "code" | "status" | "timezone" | "phone" | "email" | "address" | "operatingHours">
>;
