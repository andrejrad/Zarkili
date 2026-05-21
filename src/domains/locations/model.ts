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

export type ServiceAggregate = {
  averageRating: number | null;
  reviewCount: number;
  ratingSum: number;
  popularityScore: number;
  nextAvailableAt: Timestamp | null;
  isFullyBooked: boolean;
};

export type Location = {
  locationId: string;
  tenantId: string;
  name: string;
  displayName: string;
  code: string;
  status: LocationStatus;
  timezone: string;
  phone: string | null;
  email: string | null;
  address: LocationAddress;
  geohash: string;
  operatingHours: OperatingHours;
  // Derived aggregate written by Cloud Functions
  averageRating: number | null;
  reviewCount: number;
  ratingSum: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type CreateLocationInput = Omit<
  Location,
  "locationId" | "createdAt" | "updatedAt" | "geohash" | "averageRating" | "reviewCount" | "ratingSum"
>;

export type UpdateLocationInput = Partial<
  Pick<Location, "name" | "displayName" | "code" | "status" | "timezone" | "phone" | "email" | "address" | "geohash" | "operatingHours">
>;
