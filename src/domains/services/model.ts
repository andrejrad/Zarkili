import { Timestamp } from "firebase/firestore";

// ---------------------------------------------------------------------------
// Platform-managed taxonomy (top-level collection: service_categories)
// ---------------------------------------------------------------------------

export type ServiceCategory = {
  id: string;
  name: string;
  displayOrder: number;
  iconName: string | null;
};

// ---------------------------------------------------------------------------
// Service  (one doc per service × location)
// Path: services/{serviceId}
// ---------------------------------------------------------------------------

export type Service = {
  serviceId: string;
  tenantId: string;
  locationId: string;
  name: string;
  description: string | null;
  categoryId: string;
  tags: string[];
  baseDurationMinutes: number;
  baseBufferMinutes: number;
  basePrice: number;
  baseCurrency: string;
  technicianIds: string[];
  photoUrl: string | null;
  active: boolean;
  sortOrder: number;
  // Derived aggregate written by Cloud Functions
  averageRating: number | null;
  reviewCount: number;
  ratingSum: number;
  popularityScore: number;
  nextAvailableAt: Timestamp | null;
  isFullyBooked: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  // Denormalised location + discovery fields (written by CF; read by getServiceCards)
  geohash: string;
  locationLat: number;
  locationLng: number;
  locationDisplayName: string;
  locationAverageRating: number | null;
  locationReviewCount: number;
  variantCount: number;
  categoryName: string;
  isBookableOnline: boolean;
  locationPhone: string | null;
  priceFrom: number;
  durationFrom: number;
  primaryPhotoUrl: string | null;
  primaryPhotoSource: "client" | "salon" | null;
};

export type CreateServiceInput = Omit<
  Service,
  | "serviceId"
  | "averageRating"
  | "reviewCount"
  | "ratingSum"
  | "popularityScore"
  | "nextAvailableAt"
  | "isFullyBooked"
  | "createdAt"
  | "updatedAt"
  | "geohash"
  | "locationLat"
  | "locationLng"
  | "locationDisplayName"
  | "locationAverageRating"
  | "locationReviewCount"
  | "variantCount"
  | "categoryName"
  | "isBookableOnline"
  | "locationPhone"
  | "priceFrom"
  | "durationFrom"
  | "primaryPhotoUrl"
  | "primaryPhotoSource"
>;

export type UpdateServiceInput = Partial<
  Pick<
    Service,
    | "name"
    | "description"
    | "categoryId"
    | "tags"
    | "baseDurationMinutes"
    | "baseBufferMinutes"
    | "basePrice"
    | "baseCurrency"
    | "technicianIds"
    | "photoUrl"
    | "active"
    | "sortOrder"
  >
>;

// ---------------------------------------------------------------------------
// ServiceVariant  (subcollection: services/{serviceId}/variants/{variantId})
// ---------------------------------------------------------------------------

export type ServiceVariant = {
  variantId: string;
  serviceId: string;
  name: string;
  durationMinutes: number;
  bufferMinutes: number;
  price: number;
  currency: string;
  isDefault: boolean;
  active: boolean;
  sortOrder: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type CreateServiceVariantInput = Omit<ServiceVariant, "variantId" | "createdAt" | "updatedAt">;

export type UpdateServiceVariantInput = Partial<
  Pick<ServiceVariant, "name" | "durationMinutes" | "bufferMinutes" | "price" | "currency" | "active" | "sortOrder">
>;

// ---------------------------------------------------------------------------
// ServicePhoto  (subcollection: services/{serviceId}/photos/{photoId})
// ---------------------------------------------------------------------------

export type ServicePhoto = {
  photoId: string;
  serviceId: string;
  url: string;
  altText: string | null;
  sortOrder: number;
  createdAt: Timestamp;
};

export type CreateServicePhotoInput = Omit<ServicePhoto, "photoId" | "createdAt">;

// ---------------------------------------------------------------------------
// ServiceAddon  (subcollection: services/{serviceId}/addons/{addonId})
// ---------------------------------------------------------------------------

export type ServiceAddon = {
  addonId: string;
  serviceId: string;
  locationId: string;
  tenantId: string;
  name: string;
  price: number;
  currency: string;
  durationMinutes: number;
  active: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type CreateServiceAddonInput = Omit<ServiceAddon, "addonId" | "createdAt" | "updatedAt">;
