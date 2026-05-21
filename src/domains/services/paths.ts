/**
 * Firestore path helpers for the v3 catalogue hierarchy.
 *
 * Per `zarkili_service_data_model_v3.md` §3, service catalogue documents live
 * under `brands/{brandId}/locations/{locationId}/service_types/{serviceTypeId}`
 * with subcollections `variants`, `addons`, and `photos`.
 *
 * `brandId === tenantId` per v3 §2, so callers that hold a `tenantId` may use
 * it directly as the brand segment.
 *
 * NEW-DEBT-B (B2 — Catalogue cutover, hard-cutover client reads).
 */

export const BRANDS_COLLECTION = "brands";
export const LOCATIONS_COLLECTION = "locations";
export const SERVICE_TYPES_COLLECTION = "service_types";
export const VARIANTS_COLLECTION = "variants";
export const ADDONS_COLLECTION = "addons";
export const PHOTOS_COLLECTION = "photos";

/** brands/{brandId} */
export function brandDocPath(brandId: string): string {
  return `${BRANDS_COLLECTION}/${brandId}`;
}

/** brands/{brandId}/locations/{locationId} */
export function locationDocPath(brandId: string, locationId: string): string {
  return `${brandDocPath(brandId)}/${LOCATIONS_COLLECTION}/${locationId}`;
}

/** brands/{brandId}/locations/{locationId}/service_types */
export function serviceTypesCollectionPath(brandId: string, locationId: string): string {
  return `${locationDocPath(brandId, locationId)}/${SERVICE_TYPES_COLLECTION}`;
}

/** brands/{brandId}/locations/{locationId}/service_types/{serviceId} */
export function serviceTypeDocPath(
  brandId: string,
  locationId: string,
  serviceId: string,
): string {
  return `${serviceTypesCollectionPath(brandId, locationId)}/${serviceId}`;
}

/** Variants subcollection path for a service type. */
export function serviceVariantsCollectionPath(
  brandId: string,
  locationId: string,
  serviceId: string,
): string {
  return `${serviceTypeDocPath(brandId, locationId, serviceId)}/${VARIANTS_COLLECTION}`;
}

/** Addons subcollection path for a service type. */
export function serviceAddonsCollectionPath(
  brandId: string,
  locationId: string,
  serviceId: string,
): string {
  return `${serviceTypeDocPath(brandId, locationId, serviceId)}/${ADDONS_COLLECTION}`;
}

/** Photos subcollection path for a service type. */
export function servicePhotosCollectionPath(
  brandId: string,
  locationId: string,
  serviceId: string,
): string {
  return `${serviceTypeDocPath(brandId, locationId, serviceId)}/${PHOTOS_COLLECTION}`;
}

/**
 * Path segments for `doc(db, ...segments)` / `collection(db, ...segments)`.
 * Returned as an array so callers can spread into the Firestore SDK without
 * re-splitting a string (which the modular SDK does not accept).
 */
export const serviceTypeDocSegments = (
  brandId: string,
  locationId: string,
  serviceId: string,
): readonly [string, string, string, string, string, string] => [
  BRANDS_COLLECTION,
  brandId,
  LOCATIONS_COLLECTION,
  locationId,
  SERVICE_TYPES_COLLECTION,
  serviceId,
];

export const serviceVariantsCollectionSegments = (
  brandId: string,
  locationId: string,
  serviceId: string,
): readonly [string, string, string, string, string, string, string] => [
  ...serviceTypeDocSegments(brandId, locationId, serviceId),
  VARIANTS_COLLECTION,
];

export const serviceAddonsCollectionSegments = (
  brandId: string,
  locationId: string,
  serviceId: string,
): readonly [string, string, string, string, string, string, string] => [
  ...serviceTypeDocSegments(brandId, locationId, serviceId),
  ADDONS_COLLECTION,
];

export const servicePhotosCollectionSegments = (
  brandId: string,
  locationId: string,
  serviceId: string,
): readonly [string, string, string, string, string, string, string] => [
  ...serviceTypeDocSegments(brandId, locationId, serviceId),
  PHOTOS_COLLECTION,
];
