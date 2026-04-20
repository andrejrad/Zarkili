import { Timestamp } from "firebase/firestore";

export type Service = {
  serviceId: string;
  tenantId: string;
  locationIds: string[];
  name: string;
  category: string;
  durationMinutes: number;
  bufferMinutes: number;
  price: number;
  currency: string;
  active: boolean;
  sortOrder: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type CreateServiceInput = Omit<Service, "serviceId" | "createdAt" | "updatedAt">;

export type UpdateServiceInput = Partial<
  Pick<
    Service,
    | "locationIds"
    | "name"
    | "category"
    | "durationMinutes"
    | "bufferMinutes"
    | "price"
    | "currency"
    | "active"
    | "sortOrder"
  >
>;
