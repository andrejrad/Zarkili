# Zarkili — Service Data Model (Cloud Firestore)

**Version:** 3.1 — Three implementation decisions resolved
**Replaces:** `zarkili_service_data_model_v3.md` v3.0
**Referenced by:** `zarkili_explore_tab_spec_v2.md`
**Database:** Cloud Firestore (not Realtime Database)

---

## Resolved decisions (changelog from v3.0)

| # | Decision | Resolution |
|---|----------|-----------|
| 1 | `availability_slots` collection | **Removed.** `nextAvailableAt` is derived on-the-fly from `bookings` + `technician.weeklySchedule` in the `updateNextAvailability` Cloud Function. No materialised slot documents. |
| 2 | Reviews path | **Keep nested** `tenants/{tenantId}/reviews` (existing structure, working security rules). `tenantId` = `brandId`. Add six new required fields. Rename `rating` → `overallRating`. Use `collectionGroup('reviews')` for all cross-tenant aggregation queries. Add one `COLLECTION_GROUP` index. |
| 3 | Technicians portable profile | **Defer `technicians/{globalId}` top-level collection to v2.** Reserve `globalId: null` on location-scoped technician documents now for a non-breaking v2 migration. |

---

## 1. Which Firebase product

Use **Cloud Firestore** — not Realtime Database. Firestore is Firebase's
recommendation for all new projects requiring queryability and scalability.

### PostgreSQL → Firestore translation map

| PostgreSQL concept | Firestore equivalent |
|-------------------|---------------------|
| Table | Collection |
| Row | Document |
| Foreign key | Reference field or subcollection path |
| JOIN | Separate query + client-side merge, or denormalised field |
| Trigger | Cloud Function (`onDocumentWritten`) |
| Computed column | Field updated by Cloud Function |
| `AVG()` / `COUNT()` | Fields maintained by Cloud Function |
| LIMIT + OFFSET | Cursor pagination via `startAfter(lastDoc)` |

---

## 2. Core concepts

### 2.1 Three-level business hierarchy

```
Brand          Business identity. Name, logo, loyalty programme.
               e.g. "Glam Studio"
               Single-location businesses are a brand with one location.

  Location     A physical place. Address, coordinates, hours, phone.
               e.g. "Glam Studio · Shoreditch"

    Service    A bookable treatment at a specific location.
    type       One document = one Explore card.
               e.g. "Gel manicure at Glam Studio Shoreditch"
```

### 2.2 Three-level review hierarchy

One review submission feeds three aggregates simultaneously via Cloud Function:

```
Location rating    Overall experience at the physical location.
                   Primary source for location.averageRating.

  Service rating   Quality of this specific service type here.
                   PRIMARY rating shown on Explore cards.

    Technician     Skill and manner of the individual technician.
    rating         Shown on stylist selection screen.
```

### 2.3 Booking formula

```
one service type + one variant + zero or more add-ons + one technician
```

Price:    `variant.price + sum(selectedAddons.price)`
Duration: `variant.durationMinutes + sum(selectedAddons.durationMinutes)`

Both snapshotted on the booking document at creation time — immutable.

---

## 3. Collection structure

```
brands/                                      ← top-level
  {brandId}/
    locations/                               ← subcollection
      {locationId}/
        service_types/                       ← one doc = one Explore card
          {serviceTypeId}/
            variants/                        ← subcollection
              {variantId}
            addons/                          ← subcollection
              {addonId}
            photos/                          ← subcollection
              {photoId}
        technicians/                         ← subcollection
          {technicianId}
          ↳ includes weeklySchedule field
          ↳ includes globalId: null (reserved for v2 portable profile)

tenants/                                     ← top-level (existing — retained)
  {tenantId}/                                ← tenantId === brandId
    reviews/                                 ← subcollection (existing — retained)
      {reviewId}
      ↳ six new fields added (see §4.10)

service_categories/                          ← top-level, platform-managed
  {categoryId}

user_brand_loyalty/                          ← top-level (composite ID)
  {userId}_{brandId}

bookings/                                    ← top-level
  {bookingId}
```

### What is NOT in v1

- **`availability_slots/`** — removed. Availability derived from `bookings` +
  `technician.weeklySchedule` by Cloud Function.
- **`technicians/{globalId}`** — top-level portable career profiles deferred to v2.
  `globalId: null` is reserved on the location-scoped technician document.

### Why reviews stays nested

`tenants/{tenantId}/reviews` is kept as-is because:
- Existing security rules work and enforce tenant isolation structurally
- Migration cost (moving documents, rewriting rules) exceeds the benefit
- `collectionGroup('reviews')` handles all cross-tenant aggregation queries
- `tenantId` maps directly to `brandId` in the new hierarchy

---

## 4. Document shapes

### 4.1 service_categories/{categoryId}

Platform-managed. Drives the category chip row in Explore.

```js
{
  id:           "nails",
  name:         "Nails",
  displayOrder: 1,
  iconName:     "ti-sparkles"    // Tabler outline icon
}
```

**Seed data:**

| id | name | displayOrder | iconName |
|----|------|-------------|----------|
| `nails` | Nails | 1 | `ti-sparkles` |
| `hair` | Hair | 2 | `ti-scissors` |
| `skin` | Skin | 3 | `ti-plant` |
| `lash_brow` | Lash & Brow | 4 | `ti-eye` |
| `massage` | Massage | 5 | `ti-heart` |

---

### 4.2 brands/{brandId}

```js
{
  id:          "brand_glam_studio",
  name:        "Glam Studio",
  logoUrl:     "https://cdn.zarkili.com/brands/glam-studio/logo.jpg",
  description: "Premium nail and hair studio across London.",

  // Brand-level aggregate — weighted average of location ratings
  averageRating:  4.8,
  reviewCount:    892,
  locationCount:  3,

  // Loyalty programme configuration
  loyaltyEnabled:    true,
  earnRatePerPound:  1,     // points earned per £1 spent
  tiers: [
    { name: "Bronze", minPoints: 0    },
    { name: "Silver", minPoints: 500  },
    { name: "Gold",   minPoints: 1500 }
  ],

  isActive:  true,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-05-14T11:00:00Z"
}
```

---

### 4.3 brands/{brandId}/locations/{locationId}

```js
{
  id:          "loc_shoreditch",
  brandId:     "brand_glam_studio",
  brandName:   "Glam Studio",              // denormalised

  name:        "Shoreditch",               // branch suffix
  displayName: "Glam Studio · Shoreditch", // full name on Explore cards

  address:  "12 Curtain Road, London E1 6RF",
  lat:      51.5237,
  lng:     -0.0785,
  geohash:  "gcpvj8k",                     // for geofire-common geo queries
  phone:    "+44 20 7123 4567",

  openingHours: {
    mon: { open: "09:00", close: "19:00" },
    tue: { open: "09:00", close: "19:00" },
    wed: { open: "09:00", close: "20:00" },
    thu: { open: "09:00", close: "20:00" },
    fri: { open: "09:00", close: "19:00" },
    sat: { open: "10:00", close: "18:00" },
    sun: null
  },

  // Location-level review aggregate (overall experience)
  // Updated by Cloud Function updateReviewAggregates
  averageRating: 4.7,
  reviewCount:   312,
  ratingSum:     1466.4,

  isActive:  true,
  createdAt: "2026-01-10T09:00:00Z",
  updatedAt: "2026-05-14T11:22:00Z"
}
```

---

### 4.4 brands/{brandId}/locations/{locationId}/service_types/{serviceTypeId}

**One document = one Explore card.**

```js
{
  id:          "svc_gel_manicure_shoreditch",
  brandId:     "brand_glam_studio",
  locationId:  "loc_shoreditch",
  categoryId:  "nails",

  name:                "Gel manicure",
  locationDisplayName: "Glam Studio · Shoreditch",
  description:         "Long-lasting gel polish with glossy finish.",
  variantLabel:        "Nail length",   // null → UI defaults to "Options"

  // DERIVED — never set manually.
  // Updated by Cloud Function updateServiceTypeDerivedFields
  // on every variant create / update / deactivate.
  priceFrom:    2500,   // pence — MIN(active variants.price)
  durationFrom: 45,     // minutes — MIN(active variants.durationMinutes)

  isActive:         true,
  isBookableOnline: true,
  popularityScore:  0.82,   // updated weekly by scheduled function

  // Geo fields — denormalised from location document
  locationLat:     51.5237,
  locationLng:    -0.0785,
  locationGeohash: "gcpvj8k",

  // SERVICE-LEVEL rating — primary rating on Explore cards
  // Updated by Cloud Function updateReviewAggregates
  serviceAverageRating: 4.9,   // null when serviceReviewCount < 5
  serviceReviewCount:   128,
  serviceRatingSum:     627.2,

  // LOCATION-LEVEL fallback — shown when serviceReviewCount < 5
  // Denormalised from location document
  locationAverageRating: 4.7,
  locationReviewCount:   312,

  // Next availability — derived from bookings + weeklySchedule
  // Updated by Cloud Function updateNextAvailability on booking changes
  // and by scheduled midnight function
  nextAvailableAt: "2026-05-15T16:30:00Z",   // ISO string | null
  isFullyBooked:   false,

  // Primary photo — denormalised from photos subcollection
  primaryPhotoUrl:    "https://cdn.zarkili.com/...",
  primaryPhotoSource: "client",   // "client" | "salon" | null

  createdAt: "2026-01-10T09:00:00Z",
  updatedAt: "2026-05-14T11:22:00Z"
}
```

**Multi-category example — Glam Studio Shoreditch offering Nails and Hair:**

```
brands/brand_glam_studio/locations/loc_shoreditch/service_types/
  svc_gel_manicure_shoreditch     categoryId: "nails"
  svc_nail_art_shoreditch         categoryId: "nails"
  svc_gloss_blowout_shoreditch    categoryId: "hair"
  svc_balayage_shoreditch         categoryId: "hair"
```

---

### 4.5 .../service_types/{id}/variants/{variantId}

```js
{
  id:              "var_short",
  serviceTypeId:   "svc_gel_manicure_shoreditch",
  locationId:      "loc_shoreditch",    // denormalised
  brandId:         "brand_glam_studio", // denormalised
  name:            "Short",
  price:           2500,                // pence — exact price charged at booking
  durationMinutes: 45,                  // full appointment block inc. setup/cleanup
  isDefault:       false,
  displayOrder:    1,                   // convention: cheapest/shortest first
  isActive:        true,
  createdAt:       "2026-01-10T09:00:00Z"
}
```

**Rules:**
- Every service type must have at least one active variant.
- If no configuration is needed, create one `"Standard"` variant.
- Exactly one variant per service type should have `isDefault: true`.
- **Never delete a variant** — set `isActive: false`. Past bookings reference `variantId`.

---

### 4.6 .../service_types/{id}/addons/{addonId}

```js
{
  id:              "addon_nail_art",
  serviceTypeId:   "svc_gel_manicure_shoreditch",
  locationId:      "loc_shoreditch",
  brandId:         "brand_glam_studio",
  name:            "Nail art design",
  price:           1000,    // pence — incremental
  durationMinutes: 15,      // extra minutes added to slot block
  displayOrder:    1,
  isActive:        true
}
```

---

### 4.7 .../service_types/{id}/photos/{photoId}

```js
{
  id:               "photo_001",
  serviceTypeId:    "svc_gel_manicure_shoreditch",
  locationId:       "loc_shoreditch",
  brandId:          "brand_glam_studio",
  storageUrl:       "https://cdn.zarkili.com/photos/...",
  source:           "client",          // "client" | "salon"
  uploadedByUserId: "user_abc",        // null when source === "salon"
  bookingId:        "booking_xyz",     // null when source === "salon"
  displayOrder:     1,
  isApproved:       true,
  createdAt:        "2026-03-01T14:00:00Z"
}
```

**Query order (client photos always first):**
```js
orderBy('source',       'asc')   // "client" < "salon" alphabetically
orderBy('displayOrder', 'asc')
limit(1)                         // for Explore card primary photo
```

---

### 4.8 brands/{brandId}/locations/{locationId}/technicians/{technicianId}

Location-scoped assignment. Includes `weeklySchedule` used by the availability
Cloud Function. `globalId` reserved for v2 portable profile — set to `null` in v1.

```js
{
  id:            "tech_maria_shoreditch",
  globalId:      null,                    // RESERVED — v2 only. Do not populate in v1.
  locationId:    "loc_shoreditch",
  brandId:       "brand_glam_studio",
  firstName:     "Maria",
  photoUrl:      "https://cdn.zarkili.com/technicians/maria.jpg",
  specialtyTags: ["Gel specialist", "Nail art", "Chrome nails"],

  serviceTypeIds: [
    "svc_gel_manicure_shoreditch",
    "svc_nail_art_shoreditch"
  ],  // services this technician performs at this location
      // used by updateNextAvailability and stylist picker

  // Weekly availability schedule — used to derive nextAvailableAt.
  // Times are local to the location's timezone.
  weeklySchedule: {
    mon: { start: "09:00", end: "18:00" },
    tue: { start: "09:00", end: "18:00" },
    wed: null,                            // day off
    thu: { start: "10:00", end: "20:00" },
    fri: { start: "09:00", end: "18:00" },
    sat: { start: "10:00", end: "17:00" },
    sun: null
  },

  // Technician-level rating aggregate at this location.
  // Updated by Cloud Function updateReviewAggregates.
  // Shown when reviewCount >= 3.
  averageRating: 4.9,
  reviewCount:   67,
  ratingSum:     328.3,

  isActive:  true,
  createdAt: "2026-01-15T09:00:00Z"
}
```

---

### 4.9 tenants/{tenantId}/reviews/{reviewId}

**Kept nested (existing structure).** `tenantId` = `brandId`.

Six fields added from the v3 data model requirements. Field `rating` renamed to
`overallRating` for clarity. All other existing fields unchanged.

```js
{
  id:    "review_001",

  // Hierarchy — required fields (NEW in v3.1)
  brandId:           "brand_glam_studio",       // NEW — same as tenantId
  locationId:        "loc_shoreditch",           // NEW
  serviceTypeId:     "svc_gel_manicure_shoreditch", // NEW
  technicianId:      "tech_maria_shoreditch",    // NEW — nullable

  userId:    "user_abc",
  bookingId: "booking_xyz",

  // Ratings
  overallRating:     5,    // RENAMED from "rating" — feeds location + service aggregates
  technicianRating:  5,    // NEW — nullable — feeds technician aggregate
  technicianComment: "Maria is incredible — always gets it perfect.",
                           // NEW — nullable — shown on technician profile card

  body:      "Amazing nails! Maria was so careful and precise.",
  photoUrls: ["https://cdn.zarkili.com/reviews/..."],

  isPublished: true,
  createdAt:   "2026-05-10T18:30:00Z"
}
```

**Migration note for existing reviews:**
- Add `locationId`, `serviceTypeId`, `technicianId: null` as new fields.
- Rename `rating` → `overallRating` (or support both during a transition window).
- `technicianRating` and `technicianComment` default to `null` for existing records.

**What each rating field feeds:**

| Field | Aggregate updated | Cloud Function action |
|-------|------------------|-----------------------|
| `overallRating` | `locations/{locationId}.averageRating` | Increment `ratingSum`, `reviewCount` |
| `overallRating` | `.../service_types/{id}.serviceAverageRating` | Increment `serviceRatingSum`, `serviceReviewCount` |
| `technicianRating` | `.../technicians/{id}.averageRating` | Increment `ratingSum`, `reviewCount` (only when not null) |

---

### 4.10 user_brand_loyalty/{userId}_{brandId}

Points are earned at brand level — not location level.

```js
{
  userId:    "user_abc",
  brandId:   "brand_glam_studio",
  brandName: "Glam Studio",        // denormalised for display

  pointsBalance: 340,
  tier:          "Silver",

  locationBreakdown: {
    "loc_shoreditch":   { visits: 8, pointsEarned: 280, lastVisitAt: "2026-05-14T16:30:00Z" },
    "loc_canary_wharf": { visits: 2, pointsEarned: 60,  lastVisitAt: "2026-03-10T11:00:00Z" }
  },

  joinedAt:       "2026-01-15T10:00:00Z",
  lastActivityAt: "2026-05-14T16:30:00Z"
}
```

---

### 4.11 bookings/{bookingId}

Relevant fields — price and duration snapshotted at creation, immutable.

```js
{
  brandId:    "brand_glam_studio",
  locationId: "loc_shoreditch",
  serviceTypeId:  "svc_gel_manicure_shoreditch",
  variantId:      "var_medium",
  technicianId:   "tech_maria_shoreditch",
  addonIds:       ["addon_nail_art"],
  userId:         "user_abc",

  // Immutable snapshots
  priceSnapshot:            3000,    // pence — variant + addons at booking time
  durationSnapshot:         60,      // minutes — variant + addons at booking time
  variantNameSnapshot:      "Medium",
  technicianNameSnapshot:   "Maria",
  locationNameSnapshot:     "Glam Studio · Shoreditch",
  serviceNameSnapshot:      "Gel manicure",
  addonsSnapshot:           [{ name: "Nail art design", price: 1000, durationMinutes: 15 }],
  cancellationPolicySnapshot: {
    freeWindowHours: 24,
    lateFeeType:     "percent",
    lateFeeValue:    50
  },

  startsAt:  "2026-05-17T14:00:00Z",
  endsAt:    "2026-05-17T15:00:00Z",
  status:    "confirmed",    // confirmed | cancelled | completed | no_show
  createdAt: "2026-05-14T10:00:00Z"
}
```

---

## 5. Booking price calculation

```js
const variant = await getVariant(variantId)
const addons  = await getAddons(addonIds)

const priceSnapshot    = variant.price +
  addons.reduce((sum, a) => sum + a.price, 0)

const durationSnapshot = variant.durationMinutes +
  addons.reduce((sum, a) => sum + a.durationMinutes, 0)
```

---

## 6. Firestore queries

### 6.1 Explore feed — services near a location

```bash
npm install geofire-common
```

```js
import { geohashQueryBounds, distanceBetween } from 'geofire-common'
import { collectionGroup, query, where, orderBy,
         startAt, endAt, limit, getDocs } from 'firebase/firestore'

const exploreServices = async ({
  lat, lng, radiusKm = 5, categoryId = null,
  sortBy = 'recommended', pageSize = 10, lastDoc = null,
}) => {
  const centre = [lat, lng]
  const bounds = geohashQueryBounds(centre, radiusKm * 1000)

  const constraints = [
    where('isActive',     '==', true),
    where('isFullyBooked','==', false),
    ...(categoryId ? [where('categoryId', '==', categoryId)] : []),
  ]

  const snapshots = await Promise.all(
    bounds.map(b => getDocs(query(
      collectionGroup(db, 'service_types'),
      ...constraints,
      orderBy('locationGeohash'),
      startAt(b[0]),
      endAt(b[1]),
      limit(pageSize * 3)
    )))
  )

  const results = snapshots
    .flatMap(s => s.docs.map(d => ({ ref: d, data: d.data() })))
    .filter(({ data: d }) =>
      distanceBetween([d.locationLat, d.locationLng], centre) <= radiusKm
    )

  const sorted = {
    recommended: results.sort((a, b) => b.data.popularityScore - a.data.popularityScore),
    nearest:     results.sort((a, b) =>
      distanceBetween([a.data.locationLat, a.data.locationLng], centre) -
      distanceBetween([b.data.locationLat, b.data.locationLng], centre)),
    price:       results.sort((a, b) => a.data.priceFrom - b.data.priceFrom),
    rating:      results.sort((a, b) =>
      (b.data.serviceAverageRating ?? b.data.locationAverageRating ?? 0) -
      (a.data.serviceAverageRating ?? a.data.locationAverageRating ?? 0)),
  }[sortBy] ?? results

  return sorted.slice(0, pageSize).map(({ data }) => data)
}
```

### 6.2 Service detail — variants, add-ons, technicians, photos

```js
const path = `brands/${brandId}/locations/${locationId}/service_types/${serviceTypeId}`

const [variantsSnap, addonsSnap, techniciansSnap, photosSnap] = await Promise.all([
  getDocs(query(
    collection(db, `${path}/variants`),
    where('isActive', '==', true),
    orderBy('displayOrder', 'asc')
  )),
  getDocs(query(
    collection(db, `${path}/addons`),
    where('isActive', '==', true),
    orderBy('displayOrder', 'asc')
  )),
  getDocs(query(
    collection(db, `brands/${brandId}/locations/${locationId}/technicians`),
    where('isActive',        '==', true),
    where('serviceTypeIds',  'array-contains', serviceTypeId),
    orderBy('averageRating', 'desc')
  )),
  getDocs(query(
    collection(db, `${path}/photos`),
    where('isApproved', '==', true),
    orderBy('source',       'asc'),
    orderBy('displayOrder', 'asc'),
    limit(10)
  ))
])
```

### 6.3 Reviews — using collectionGroup across tenants

```js
// Fetch recent reviews for a service type across all tenants
const reviewsSnap = await getDocs(query(
  collectionGroup(db, 'reviews'),
  where('serviceTypeId', '==', serviceTypeId),
  where('isPublished',   '==', true),
  orderBy('createdAt',   'desc'),
  limit(20)
))

// Fetch all reviews for a location (for aggregate recomputation)
const locationReviewsSnap = await getDocs(query(
  collectionGroup(db, 'reviews'),
  where('locationId',  '==', locationId),
  where('isPublished', '==', true)
))
```

### 6.4 Cursor-based pagination

```js
const firstPage = await getDocs(query(baseQuery, limit(10)))
const cursor    = firstPage.docs[firstPage.docs.length - 1]
const nextPage  = await getDocs(query(baseQuery, startAfter(cursor), limit(10)))
```

---

## 7. Required Firestore composite indexes

```json
{
  "indexes": [
    {
      "collectionGroup": "service_types",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        { "fieldPath": "isActive",        "order": "ASCENDING" },
        { "fieldPath": "locationGeohash", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "service_types",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        { "fieldPath": "isActive",        "order": "ASCENDING" },
        { "fieldPath": "categoryId",      "order": "ASCENDING" },
        { "fieldPath": "locationGeohash", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "service_types",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        { "fieldPath": "isActive",        "order": "ASCENDING" },
        { "fieldPath": "categoryId",      "order": "ASCENDING" },
        { "fieldPath": "popularityScore", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "service_types",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        { "fieldPath": "isActive",   "order": "ASCENDING" },
        { "fieldPath": "categoryId", "order": "ASCENDING" },
        { "fieldPath": "priceFrom",  "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "service_types",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        { "fieldPath": "isActive",             "order": "ASCENDING" },
        { "fieldPath": "categoryId",           "order": "ASCENDING" },
        { "fieldPath": "serviceAverageRating", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "service_types",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        { "fieldPath": "isActive",        "order": "ASCENDING" },
        { "fieldPath": "isFullyBooked",   "order": "ASCENDING" },
        { "fieldPath": "nextAvailableAt", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "technicians",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        { "fieldPath": "isActive",       "order": "ASCENDING" },
        { "fieldPath": "serviceTypeIds", "order": "ASCENDING" },
        { "fieldPath": "averageRating",  "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "reviews",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        { "fieldPath": "locationId",  "order": "ASCENDING" },
        { "fieldPath": "isPublished", "order": "ASCENDING" },
        { "fieldPath": "createdAt",   "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

## 8. Cloud Functions

### 8.1 updateServiceTypeDerivedFields

Triggered on every variant write. Recomputes `priceFrom` and `durationFrom`.

```js
import { onDocumentWritten } from 'firebase-functions/v2/firestore'
import { getFirestore }      from 'firebase-admin/firestore'

export const updateServiceTypeDerivedFields = onDocumentWritten(
  'brands/{brandId}/locations/{locationId}/service_types/{serviceTypeId}/variants/{variantId}',
  async (event) => {
    const { brandId, locationId, serviceTypeId } = event.params
    const db = getFirestore()

    const variantsSnap = await db
      .collection(
        `brands/${brandId}/locations/${locationId}/service_types/${serviceTypeId}/variants`
      )
      .where('isActive', '==', true)
      .get()

    if (variantsSnap.empty) return

    const variants     = variantsSnap.docs.map(d => d.data())
    const priceFrom    = Math.min(...variants.map(v => v.price))
    const durationFrom = Math.min(...variants.map(v => v.durationMinutes))

    await db
      .doc(`brands/${brandId}/locations/${locationId}/service_types/${serviceTypeId}`)
      .update({ priceFrom, durationFrom, updatedAt: new Date() })
  }
)
```

---

### 8.2 updateReviewAggregates

Triggered on every review write inside `tenants/{tenantId}/reviews`.
Uses `collectionGroup('reviews')` to query across all tenants.
Updates three aggregates in one batched write.

```js
export const updateReviewAggregates = onDocumentWritten(
  'tenants/{tenantId}/reviews/{reviewId}',
  async (event) => {
    const after  = event.data?.after?.data()
    const before = event.data?.before?.data()
    const review = after ?? before
    if (!review) return

    const db         = getFirestore()
    const { brandId, locationId, serviceTypeId, technicianId } = review
    const batch      = db.batch()

    // ── 1. Location-level aggregate ──────────────────────────────────────────
    const locReviewsSnap = await db.collectionGroup('reviews')
      .where('locationId',  '==', locationId)
      .where('isPublished', '==', true)
      .get()

    const locReviews   = locReviewsSnap.docs.map(d => d.data())
    const locCount     = locReviews.length
    const locRatingSum = locReviews.reduce((s, r) => s + r.overallRating, 0)
    const locAvg       = locCount >= 5
      ? Math.round((locRatingSum / locCount) * 10) / 10
      : null

    batch.update(
      db.doc(`brands/${brandId}/locations/${locationId}`),
      { averageRating: locAvg, reviewCount: locCount,
        ratingSum: locRatingSum, updatedAt: new Date() }
    )

    // ── 2. Service-type-level aggregate ──────────────────────────────────────
    const svcReviewsSnap = await db.collectionGroup('reviews')
      .where('serviceTypeId', '==', serviceTypeId)
      .where('isPublished',   '==', true)
      .get()

    const svcReviews   = svcReviewsSnap.docs.map(d => d.data())
    const svcCount     = svcReviews.length
    const svcRatingSum = svcReviews.reduce((s, r) => s + r.overallRating, 0)
    const svcAvg       = svcCount >= 5
      ? Math.round((svcRatingSum / svcCount) * 10) / 10
      : null

    const svcPath =
      `brands/${brandId}/locations/${locationId}/service_types/${serviceTypeId}`
    batch.update(db.doc(svcPath), {
      serviceAverageRating:  svcAvg,
      serviceReviewCount:    svcCount,
      serviceRatingSum:      svcRatingSum,
      locationAverageRating: locAvg,   // keep fallback in sync
      locationReviewCount:   locCount,
      updatedAt: new Date()
    })

    // ── 3. Technician-level aggregate (only when technicianRating present) ───
    if (technicianId) {
      const techReviewsSnap = await db.collectionGroup('reviews')
        .where('technicianId',    '==', technicianId)
        .where('isPublished',     '==', true)
        .where('technicianRating','!=', null)
        .get()

      const tReviews   = techReviewsSnap.docs.map(d => d.data())
      const tCount     = tReviews.length
      const tRatingSum = tReviews.reduce((s, r) => s + (r.technicianRating ?? 0), 0)
      const tAvg       = tCount >= 3
        ? Math.round((tRatingSum / tCount) * 10) / 10
        : null

      const techPath =
        `brands/${brandId}/locations/${locationId}/technicians/${technicianId}`
      batch.update(db.doc(techPath), {
        averageRating: tAvg,
        reviewCount:   tCount,
        ratingSum:     tRatingSum,
        updatedAt:     new Date()
      })
    }

    await batch.commit()
  }
)
```

---

### 8.3 updateNextAvailability

Triggered on every booking write. **No `availability_slots` collection is used.**
Derives `nextAvailableAt` from `bookings` + `technician.weeklySchedule`.
Also fires on technician schedule changes and daily at midnight.

```js
export const updateNextAvailability = onDocumentWritten(
  'bookings/{bookingId}',
  async (event) => {
    const booking = event.data?.after?.data() ?? event.data?.before?.data()
    if (!booking?.serviceTypeId) return

    const db         = getFirestore()
    const { brandId, locationId, serviceTypeId } = booking

    const result = await computeNextAvailableAt(db, brandId, locationId, serviceTypeId)

    await db
      .doc(`brands/${brandId}/locations/${locationId}/service_types/${serviceTypeId}`)
      .update({ ...result, updatedAt: new Date() })
  }
)

// Core availability computation — no availability_slots collection
const computeNextAvailableAt = async (db, brandId, locationId, serviceTypeId) => {
  const now         = new Date()
  const searchEnd   = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  // 1. Get active technicians for this service type
  const techsSnap = await db
    .collection(`brands/${brandId}/locations/${locationId}/technicians`)
    .where('isActive',        '==', true)
    .where('serviceTypeIds',  'array-contains', serviceTypeId)
    .get()

  const techs = techsSnap.docs.map(d => d.data())
  if (techs.length === 0) return { nextAvailableAt: null, isFullyBooked: true }

  // 2. Get confirmed bookings for this service type in the next 30 days
  const bookingsSnap = await db.collection('bookings')
    .where('serviceTypeId', '==', serviceTypeId)
    .where('status',        'in', ['confirmed'])
    .where('startsAt',      '>',  now)
    .where('startsAt',      '<',  searchEnd)
    .get()

  const bookedBlocks = bookingsSnap.docs.map(d => ({
    technicianId: d.data().technicianId,
    startsAt:     d.data().startsAt.toDate(),
    endsAt:       d.data().endsAt.toDate(),
  }))

  // 3. Get service duration
  const svcSnap = await db
    .doc(`brands/${brandId}/locations/${locationId}/service_types/${serviceTypeId}`)
    .get()
  const durationMs = svcSnap.data().durationFrom * 60000

  // 4. Walk forward in time and find first open slot across any technician
  const dayNames = ['sun','mon','tue','wed','thu','fri','sat']

  for (const tech of techs) {
    const techBookings = bookedBlocks.filter(b => b.technicianId === tech.id)

    // Iterate days from today forward
    for (let d = 0; d < 30; d++) {
      const date    = new Date(now.getTime() + d * 86400000)
      const dayName = dayNames[date.getDay()]
      const hours   = tech.weeklySchedule?.[dayName]
      if (!hours) continue   // day off

      const [startH, startM] = hours.start.split(':').map(Number)
      const [endH,   endM  ] = hours.end.split(':').map(Number)

      const dayStart = new Date(date)
      dayStart.setHours(startH, startM, 0, 0)
      const dayEnd = new Date(date)
      dayEnd.setHours(endH, endM, 0, 0)

      // Walk forward in 15-minute increments within the working day
      let cursor = new Date(Math.max(dayStart.getTime(), now.getTime()))
      while (cursor.getTime() + durationMs <= dayEnd.getTime()) {
        const slotEnd = new Date(cursor.getTime() + durationMs)
        const conflict = techBookings.some(b =>
          b.startsAt < slotEnd && b.endsAt > cursor
        )
        if (!conflict) {
          return { nextAvailableAt: cursor.toISOString(), isFullyBooked: false }
        }
        cursor = new Date(cursor.getTime() + 15 * 60000)
      }
    }
  }

  return { nextAvailableAt: null, isFullyBooked: true }
}
```

**Additional trigger — technician schedule change:**

```js
export const updateNextAvailabilityOnScheduleChange = onDocumentWritten(
  'brands/{brandId}/locations/{locationId}/technicians/{technicianId}',
  async (event) => {
    const before = event.data?.before?.data()
    const after  = event.data?.after?.data()
    // Only recompute if weeklySchedule or serviceTypeIds changed
    if (JSON.stringify(before?.weeklySchedule) === JSON.stringify(after?.weeklySchedule) &&
        JSON.stringify(before?.serviceTypeIds)  === JSON.stringify(after?.serviceTypeIds)) return

    const { brandId, locationId } = event.params
    const tech = after ?? before
    const db   = getFirestore()

    // Recompute nextAvailableAt for all service types this technician covers
    await Promise.all((tech.serviceTypeIds ?? []).map(async (serviceTypeId) => {
      const result = await computeNextAvailableAt(db, brandId, locationId, serviceTypeId)
      await db
        .doc(`brands/${brandId}/locations/${locationId}/service_types/${serviceTypeId}`)
        .update({ ...result, updatedAt: new Date() })
    }))
  }
)
```

**Scheduled trigger — roll forward at midnight:**

```js
import { onSchedule } from 'firebase-functions/v2/scheduler'

export const rollNextAvailabilityDaily = onSchedule(
  { schedule: 'every 24 hours', timeZone: 'UTC' },
  async () => {
    const db = getFirestore()
    // Find all service types that are not fully booked but whose
    // nextAvailableAt is in the past (window expired overnight)
    const staleSnap = await db.collectionGroup('service_types')
      .where('isActive',        '==', true)
      .where('isFullyBooked',   '==', false)
      .where('nextAvailableAt', '<',  new Date().toISOString())
      .get()

    await Promise.all(staleSnap.docs.map(async (doc) => {
      const { brandId, locationId, id: serviceTypeId } = doc.data()
      const result = await computeNextAvailableAt(db, brandId, locationId, serviceTypeId)
      await doc.ref.update({ ...result, updatedAt: new Date() })
    }))
  }
)
```

---

### 8.4 updateServiceTypeDerivedFields — (see §8.1)

### 8.5 recomputePopularityScores — scheduled weekly

```js
export const recomputePopularityScores = onSchedule(
  { schedule: 'every 168 hours', timeZone: 'UTC' },
  async () => {
    const db    = getFirestore()
    const ago30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const bookingsSnap = await db.collection('bookings')
      .where('createdAt', '>=', ago30)
      .where('status',    'in', ['confirmed', 'completed'])
      .get()

    const counts = {}
    bookingsSnap.docs.forEach(d => {
      const id = d.data().serviceTypeId
      if (id) counts[id] = (counts[id] ?? 0) + 1
    })

    const maxCount = Math.max(...Object.values(counts), 1)
    const batch    = db.batch()

    for (const [serviceTypeId, count] of Object.entries(counts)) {
      const snap = await db.collectionGroup('service_types')
        .where('id', '==', serviceTypeId).limit(1).get()
      if (snap.empty) continue

      const doc   = snap.docs[0]
      const data  = doc.data()
      const score =
        (count / maxCount)                                  * 0.6 +
        (((data.serviceAverageRating ?? 3) - 1) / 4)        * 0.3 +
        0.1   // recency factor (simplified — weight recent bookings higher in v2)

      batch.update(doc.ref, {
        popularityScore: Math.round(score * 100) / 100,
        updatedAt: new Date()
      })
    }

    await batch.commit()
  }
)
```

---

### 8.6 updateLoyaltyOnBookingComplete

Awards brand-level points when a booking status transitions to "completed".

```js
export const updateLoyaltyOnBookingComplete = onDocumentWritten(
  'bookings/{bookingId}',
  async (event) => {
    const before = event.data?.before?.data()
    const after  = event.data?.after?.data()
    if (before?.status === after?.status) return
    if (after?.status !== 'completed') return

    const { userId, brandId, locationId, priceSnapshot } = after
    const db = getFirestore()

    const brandSnap = await db.doc(`brands/${brandId}`).get()
    const brand     = brandSnap.data()
    if (!brand?.loyaltyEnabled) return

    const pointsEarned = Math.floor((priceSnapshot / 100) * brand.earnRatePerPound)
    const loyaltyRef   = db.doc(`user_brand_loyalty/${userId}_${brandId}`)
    const loyaltySnap  = await loyaltyRef.get()

    if (loyaltySnap.exists()) {
      const existing  = loyaltySnap.data()
      const breakdown = existing.locationBreakdown ?? {}
      const locData   = breakdown[locationId] ?? { visits: 0, pointsEarned: 0 }
      await loyaltyRef.update({
        pointsBalance: (existing.pointsBalance ?? 0) + pointsEarned,
        lastActivityAt: new Date(),
        [`locationBreakdown.${locationId}`]: {
          visits:       locData.visits + 1,
          pointsEarned: locData.pointsEarned + pointsEarned,
          lastVisitAt:  new Date()
        }
      })
    } else {
      await loyaltyRef.set({
        userId, brandId,
        brandName:     brand.name,
        pointsBalance: pointsEarned,
        tier:          'Bronze',
        locationBreakdown: {
          [locationId]: { visits: 1, pointsEarned, lastVisitAt: new Date() }
        },
        joinedAt:       new Date(),
        lastActivityAt: new Date()
      })
    }
  }
)
```

---

## 9. Security rules

```js
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /service_categories/{id} {
      allow read:  if true;
      allow write: if false;  // Admin SDK only
    }

    match /brands/{brandId} {
      allow read: if true;
      allow write: if request.auth != null
                   && request.auth.token.brandId == brandId;

      match /locations/{locationId} {
        allow read:  if true;
        allow write: if request.auth != null
                     && request.auth.token.brandId == brandId;

        match /service_types/{serviceTypeId} {
          allow read:  if true;
          allow write: if request.auth != null
                       && request.auth.token.brandId == brandId;

          match /variants/{id}  { allow read: if true; allow write: if request.auth.token.brandId == brandId; }
          match /addons/{id}    { allow read: if true; allow write: if request.auth.token.brandId == brandId; }
          match /photos/{id} {
            allow read: if true;
            allow create: if request.auth != null && (
              request.auth.token.brandId == brandId ||
              (request.resource.data.source     == 'client' &&
               request.resource.data.uploadedByUserId == request.auth.uid)
            );
            allow update: if request.auth.token.brandId == brandId;
            allow delete: if false;
          }
        }

        match /technicians/{id} {
          allow read:  if true;
          allow write: if request.auth != null
                       && request.auth.token.brandId == brandId;
        }
      }
    }

    // Reviews — nested under tenants (existing structure retained)
    match /tenants/{tenantId}/reviews/{reviewId} {
      allow read: if true;
      allow create: if request.auth != null
                    && request.resource.data.userId == request.auth.uid;
      allow update: if false;   // immutable once published
      allow delete: if false;   // set isPublished: false via Cloud Function
    }

    match /user_brand_loyalty/{compositeId} {
      allow read: if request.auth != null && (
        resource.data.userId  == request.auth.uid ||
        request.auth.token.brandId == resource.data.brandId
      );
      allow write: if false;  // Cloud Functions only
    }
  }
}
```

---

## 10. Salon setup flow

### Step 1 — Create brand (one time)
Brand name, logo, loyalty programme configuration (earn rate, tier thresholds).

### Step 2 — Add locations
For each physical location: branch name, address, phone, opening hours.
Platform generates `geohash` from lat/lng automatically.

### Step 3 — Add technicians
First name, photo, specialty tags. Assign `serviceTypeIds` (services they perform
at this location). Set `weeklySchedule` — required for availability computation.
`globalId` is always `null` in v1.

### Step 4 — Create service types
1. Pick platform category
2. Name the service
3. Define variants: Name | Price | Duration
   - Single price/duration → auto-creates `"Standard"` variant, suppresses variant picker UI
4. Add-ons (optional): Name | +Price | +Extra time
5. Variant label (optional, shown only if multiple variants)
6. Upload photos
7. Publish (`isActive: true`)

`priceFrom` and `durationFrom` auto-set by Cloud Function on variant save.
`nextAvailableAt` auto-computed by Cloud Function on first booking or schedule write.

---

## 11. Important rules

| Rule | Reason |
|------|--------|
| Never delete a variant — set `isActive: false` | Past bookings reference `variantId` |
| Never delete a service type — set `isActive: false` | Same reason |
| Never delete a review — set `isPublished: false` | Aggregate recomputation needs full history |
| `priceFrom` / `durationFrom` never set manually | Derived by Cloud Function — manual edits overwritten |
| Rating shown as `null` below threshold (location/service: 5, technician: 3) | Unreliable below threshold — unfair to new entries |
| All prices in smallest currency unit | Never float for money |
| `ratingSum` + `reviewCount` stored separately | Allows recomputation when a review is unpublished |
| Loyalty is brand-level — `user_brand_loyalty` doc ID = `{userId}_{brandId}` | Points earned at any location contribute to one balance |
| `availability_slots` collection does not exist | Availability derived from `bookings` + `weeklySchedule` |
| `tenantId` in review path = `brandId` | Confirm and document this mapping in onboarding docs |
| `globalId: null` on every location-scoped technician | Reserved for v2 portable profile — non-breaking migration |

---

## 12. What changed from v3.0

| v3.0 | v3.1 |
|------|------|
| `availability_slots/` collection in structure diagram | Removed. Availability derived from `bookings` + `weeklySchedule`. |
| `availability_slots/{slotId}` document shape (§4.12) | Removed. |
| `updateNextAvailability` Cloud Function queried slots collection | Rewritten: queries `bookings` + walks `weeklySchedule`. Added schedule-change trigger and daily midnight rollover. |
| `technicians/{globalId}` top-level collection in structure | Moved to "v2 only" note. Removed from v1 structure diagram. |
| `globalId` field not mentioned | Added as `null` reserved field on location-scoped technician document. |
| `reviews/` top-level collection in structure | Replaced with `tenants/{tenantId}/reviews` (existing path). `tenantId` = `brandId`. |
| Review document had no `locationId`, `serviceTypeId`, `technicianId` | Added as required fields. |
| `rating` field on review document | Renamed to `overallRating`. |
| `technicianRating`, `technicianComment` not in review document | Added as nullable fields. |
| `updateReviewAggregates` triggered on `reviews/{reviewId}` | Trigger path updated to `tenants/{tenantId}/reviews/{reviewId}`. Queries use `collectionGroup('reviews')`. |
| indexes: no `COLLECTION_GROUP` review index | Added `reviews` collectionGroup index. |

---

*End of data model — Zarkili Service Data Model v3.1 (Firestore)*
*Replaces: `zarkili_service_data_model_v3.md`*
*Referenced by: `zarkili_explore_tab_spec_v2.md`*
