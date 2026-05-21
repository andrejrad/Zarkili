# Zarkili — Explore Tab v2 + Service Data Model v3: Implementation Plan

**Version:** 1.0  
**Date:** 2026-05-16  
**Specs:** `zarkili_explore_tab_spec_v2.md`, `zarkili_service_data_model_v3.md`  
**Status:** Ready to implement

---

## 1. Locked decisions

| # | Decision | Resolution |
|---|----------|-----------|
| 1 | Tenant vs Brand identity | **Tenant = Brand** (`tenantId` maps to `brandId`). No code renaming — domain terminology only. |
| 2 | Location vs Salon identity | **Location = Salon** (`locationId` maps to `locationId`). Flat `locations/{locationId}` with `tenantId` field remains flat — not nested under tenant. |
| 3 | Availability model | **No materialized `availability_slots` collection.** Extend `availabilitySummaryTrigger.ts` to derive `nextAvailableAt` / `isFullyBooked` from `bookings` and write directly onto service docs. |
| 4 | Services collection shape | **One doc per (service × location).** Replace `locationIds: string[]` with single `locationId: string`. Simpler geo queries, correct per-location derived fields. |
| 5 | Addons path | Move to `services/{serviceId}/addons` subcollection per spec. Drop `tenants/{tenantId}/serviceAddons` — test data only, no migration needed. |
| 6 | Reviews path | Keep nested at `tenants/{tenantId}/reviews/{reviewId}`. Add `serviceId`, `technicianRating`, `technicianComment` fields. Extend aggregate trigger to write a service-level aggregate. |
| 7 | Technician portable profile | Defer `technicians/{globalId}` global career profile to v2. |
| 8 | Loyalty path | **No change.** `tenants/{tenantId}/loyaltyStates/{userId}` is already brand-level (per tenant). Extend to write `locationBreakdown` map. |
| 9 | Existing test data | **Drop and reseed.** All current Firestore data is test data — no migration constraints. |
| 10 | Product thresholds | Service rating shown at ≥ 5 reviews. Technician rating shown at ≥ 3 reviews. Location rating shown at ≥ 5 reviews. Distance: default 5 km, max 25 km. |

---

## 2. Architecture overview

```
Firestore collections (final state)
────────────────────────────────────
tenants/{tenantId}                          ← Brand (name, logo, loyaltyConfig)
  loyaltyConfig/config
  loyaltyStates/{userId}                    ← pointsBalance, tier, locationBreakdown
  loyaltyTransactions/{txId}
  reviews/{reviewId}                        ← overallRating, technicianRating, serviceId

locations/{locationId}                      ← Physical location (tenantId, geohash, displayName)

services/{serviceId}                        ← One Explore card (tenantId, locationId, categoryId)
  variants/{variantId}                      ← Short/Medium/Long or "Standard"
  addons/{addonId}                          ← Optional extras (+price, +duration)
  photos/{photoId}                          ← source: "client"|"salon"

staff/{staffId}                             ← Technician (photoUrl, specialtyTags, averageRating)

service_categories/{categoryId}             ← Platform taxonomy (Nails, Hair, Skin...)

bookings/{bookingId}                        ← Includes variant/addon snapshots

bookingSlotTokens/{tokenId}                 ← Slot reservation mutex (unchanged)
```

```
Cloud Functions (final state)
─────────────────────────────
updateServiceDerivedFields      — variants write → priceFrom, durationFrom on service
                                  photos write → primaryPhotoUrl, primaryPhotoSource on service
updateReviewAggregates (ext.)   — review write → location + service + technician aggregates
updateNextAvailability (ext.)   — booking write → nextAvailableAt, isFullyBooked on service
recomputePopularityScores (ext.)— weekly → popularityScore on all services
updateLoyaltyOnBookingComplete  — booking → completed: award points + locationBreakdown
```

---

## 3. Phases

### Phase 0 — Scaffolding & type extensions
*No behaviour change. Pre-requisite for all later phases.*

#### 0.1 Extend `Location` type
**File:** `src/domains/locations/model.ts`
- Add `geohash: string` (computed from `address.lat` / `address.lng` via `geofire-common`)
- Add `displayName: string` — e.g. `"Glam Studio · Shoreditch"` for multi-location brands, `"Luna Studio"` for single-location

#### 0.2 Extend `StaffMember` type
**File:** `src/domains/staff/model.ts`
- Add `photoUrl: string | null`
- Add `specialtyTags: string[]`
- Add `averageRating: number | null`, `reviewCount: number`, `ratingSum: number`

#### 0.3 Add `ServiceCategory` type + reader
**File:** `src/domains/services/model.ts`
```ts
export type ServiceCategory = {
  id: string;            // "nails" | "hair" | "skin" | "lash_brow" | "massage"
  name: string;          // "Nails"
  displayOrder: number;
  iconName: string;      // "ti-sparkles"
}
```
**File:** `src/domains/services/repository.ts`
- Add `getActiveCategories(lat?: number, lng?: number): Promise<ServiceCategory[]>` — returns only categories with ≥ 1 active service in user's area

#### 0.4 Seed `service_categories` + rules
**File:** `firestore.rules` — add block:
```
match /service_categories/{categoryId} {
  allow read:  if true;
  allow write: if false;
}
```
**File:** `firestore.indexes.json` — single-field ascending index on `displayOrder`

Seed data:

| id | name | displayOrder | iconName |
|----|------|-------------|----------|
| `nails` | Nails | 1 | `ti-sparkles` |
| `hair` | Hair | 2 | `ti-scissors` |
| `skin` | Skin | 3 | `ti-plant` |
| `lash_brow` | Lash & Brow | 4 | `ti-eye` |
| `massage` | Massage | 5 | `ti-heart` |

---

### Phase 1 — Reshape `services` collection + new subcollections
*Foundational data model change. Drop-and-reseed — no migration.*

#### 1.1 Reshape `Service` type
**File:** `src/domains/services/model.ts`

**Remove:** `locationIds: string[]`, `price: number`, `durationMinutes: number`, `bufferMinutes: number`, `currency: string`

**Add:**
```ts
// Identity
locationId:          string        // single location (replaces locationIds[])
categoryId:          string        // references service_categories
variantLabel:        string | null // "Nail length" | null → UI defaults to "Options"
isBookableOnline:    boolean
isActive:            boolean       // replaces active: boolean

// Derived — Cloud Function managed, never set manually
priceFrom:           number        // pence — MIN(active variants.price)
durationFrom:        number        // minutes — MIN(active variants.durationMinutes)
popularityScore:     number        // 0–1, updated weekly

// Location denormalized — updated when location doc changes
locationDisplayName: string        // "Glam Studio · Shoreditch"
locationLat:         number | null
locationLng:         number | null
locationGeohash:     string | null

// Service-level review aggregate — updated by Cloud Function
serviceAverageRating: number | null  // null if serviceReviewCount < 5
serviceReviewCount:   number
serviceRatingSum:     number

// Location-level rating fallback — denormalized from location doc
locationAverageRating: number | null
locationReviewCount:   number

// Availability — denormalized by Cloud Function
nextAvailableAt:     string | null  // ISO timestamp | null
isFullyBooked:       boolean

// Primary photo — denormalized by Cloud Function
primaryPhotoUrl:     string | null
primaryPhotoSource:  'client' | 'salon' | null
```

#### 1.2 Create `ServiceVariant` type + subcollection
**File:** `src/domains/services/serviceCatalogModel.ts`
```ts
export type ServiceVariant = {
  variantId:       string
  serviceId:       string
  locationId:      string
  tenantId:        string
  name:            string       // "Short" | "Standard"
  price:           number       // pence
  durationMinutes: number
  isDefault:       boolean      // exactly one per service = true
  displayOrder:    number
  isActive:        boolean
  createdAt:       Timestamp
}
```
Path: `services/{serviceId}/variants/{variantId}`

**Rule:** never delete — set `isActive: false`. Exactly one `isDefault: true` per service.

**File:** `src/app/admin/serviceCatalogAdapters.ts` — add `createServiceVariantRepository()` factory

**Rules block** (inside services rules):
```
match /variants/{variantId} {
  allow read:  if true;
  allow write: if request.auth != null && request.auth.uid == resource.data.tenantId;
}
```

#### 1.3 Repath `ServiceAddon` to subcollection
**File:** `src/domains/services/serviceCatalogModel.ts` — update `ServiceAddon` to add `serviceId`, `locationId` fields; remove `tenantId`-scoped path
```ts
export type ServiceAddon = {
  addonId:         string
  serviceId:       string       // added
  locationId:      string       // added
  tenantId:        string
  name:            string       // "Nail art design"
  price:           number       // pence — incremental
  durationMinutes: number       // extra minutes added to booking block
  displayOrder:    number
  isActive:        boolean
}
```
Path: `services/{serviceId}/addons/{addonId}` (replaces `tenants/{tenantId}/serviceAddons/{addonId}`)

**File:** `src/app/admin/serviceCatalogAdapters.ts` — update `createServiceAddonRepository()` for new path

**File:** `firestore.rules` — remove `tenants/{tenantId}/serviceAddons` block; add subcollection block under services

#### 1.4 Create `ServicePhoto` type + subcollection
**File:** `src/domains/services/serviceCatalogModel.ts`
```ts
export type ServicePhoto = {
  photoId:          string
  serviceId:        string
  locationId:       string
  tenantId:         string
  storageUrl:       string
  source:           'client' | 'salon'
  uploadedByUserId: string | null   // null if source === 'salon'
  bookingId:        string | null   // null if source === 'salon'
  displayOrder:     number
  isApproved:       boolean
  createdAt:        Timestamp
}
```
Path: `services/{serviceId}/photos/{photoId}`

**Rules:**
```
match /photos/{photoId} {
  allow read:   if true;
  allow create: if request.auth != null && (
    request.auth.uid == resource.data.tenantId ||
    (request.resource.data.source == 'client' &&
     request.resource.data.uploadedByUserId == request.auth.uid)
  );
  allow update: if request.auth != null && request.auth.uid == resource.data.tenantId;
  allow delete: if false;  // set isApproved: false instead
}
```

#### 1.5 Add composite indexes for Explore queries
**File:** `firestore.indexes.json` — add (all on `services` collection, `COLLECTION` scope):

| Fields | Purpose |
|--------|---------|
| `isActive` ↑ · `locationGeohash` ↑ | Geo base query |
| `isActive` ↑ · `categoryId` ↑ · `locationGeohash` ↑ | Geo + category |
| `isActive` ↑ · `categoryId` ↑ · `popularityScore` ↓ | Recommended sort |
| `isActive` ↑ · `categoryId` ↑ · `priceFrom` ↑ | Price sort |
| `isActive` ↑ · `categoryId` ↑ · `serviceAverageRating` ↓ | Rating sort |
| `isActive` ↑ · `isFullyBooked` ↑ · `nextAvailableAt` ↑ | Availability filter |
| `tenantId` ↑ · `locationId` ↑ · `isActive` ↑ | Admin service list |

#### 1.6 Update top-level `services` rules block
**File:** `firestore.rules` — update services block to use `locationId` (not `locationIds`) ownership check; add subcollection blocks for `variants`, `addons`, `photos`

---

### Phase 2 — Cloud Functions (5 functions)
*Depends on Phase 1. All in `functions/src/`.*

#### 2.1 New: `updateServiceDerivedFields`
**File:** `functions/src/serviceDerivedFields.ts` (new file)

**Trigger 1:** `onDocumentWritten('services/{serviceId}/variants/{variantId}')`
- Read all active variants for the service
- Write `priceFrom = MIN(price)`, `durationFrom = MIN(durationMinutes)` to parent service doc

**Trigger 2:** `onDocumentWritten('services/{serviceId}/photos/{photoId}')`
- Read first approved photo ordered by `source ASC → displayOrder ASC`
- Write `primaryPhotoUrl` and `primaryPhotoSource` to parent service doc

**Register in:** `functions/src/index.ts`

#### 2.2 Extend: `updateReviewAggregates`
**File:** `functions/src/bookingTriggers.ts` (extend existing review trigger)

Add to existing batch that already writes location + staff aggregates:

**New: Service-level aggregate**
- Read all published reviews where `serviceId == review.serviceId && locationId == review.locationId`
- Compute `serviceAverageRating` (null if count < 5), `serviceReviewCount`, `serviceRatingSum`
- `batch.update(db.doc('services/${review.serviceId}'), { serviceAverageRating, serviceReviewCount, serviceRatingSum })`

**New: Technician aggregate on staff doc** (when `review.technicianRating != null`)
- Read all published reviews where `staffId == review.staffId`
- Compute `averageRating` (null if count < 3), `reviewCount`, `ratingSum`
- `batch.update(db.doc('staff/${review.staffId}'), { averageRating, reviewCount, ratingSum })`

**Also: Backfill `locationAverageRating` / `locationReviewCount` on service docs**
- When location aggregate changes, push denormalized values to all service docs for that location

#### 2.3 Extend: `updateNextAvailability`
**File:** `functions/src/availabilitySummaryTrigger.ts`

After existing availability summary logic, add per-service derivation:
- On booking write: resolve `serviceId` and `locationId` from booking
- Query `bookings` where `serviceId == booking.serviceId && locationId == booking.locationId && status NOT IN ['cancelled', 'no_show'] && date >= today`
- Cross-reference with location `operatingHours` + existing `slotEngine.ts` logic to find first open slot in next 30 days
- Write `nextAvailableAt` and `isFullyBooked` to `services/{serviceId}`

#### 2.4 Extend: `recomputePopularityScores`
**File:** `functions/src/popularityIndex.ts`

Extend weekly output to write `popularityScore` (0–1, normalized) to each `services/{serviceId}` doc.

Formula (per spec): `bookingCount × 0.6 + normalizedRating × 0.3 + recencyFactor × 0.1`
- `bookingCount`: bookings in last 30 days for this service
- `normalizedRating`: `serviceAverageRating / 5` (or `locationAverageRating / 5` as fallback)
- `recencyFactor`: normalized days since last booking (`1 - daysSinceLastBooking / 30`)

#### 2.5 Extend: `updateLoyaltyOnBookingComplete`
**File:** `functions/src/payments.ts`

Loyalty already fires on booking completion. Extend to also write `locationBreakdown` map:
```js
// Read current loyalty doc
// Increment locationBreakdown[booking.locationId].visits
// Add points earned to locationBreakdown[booking.locationId].pointsEarned
// Set locationBreakdown[booking.locationId].lastVisitAt = now
```

---

### Phase 3 — Reseed test data
*Depends on Phase 1 + Phase 2 path correctness. Drop and reseed.*

**File:** `scripts/seed-qa-firestore.mjs` — rewrite to emit:

- `service_categories` (5 docs — see Phase 0.4)
- `locations/{locationId}` — add `geohash` (compute from lat/lng), `displayName`
- `services/{serviceId}` — one doc per (service × location); pre-populate all denormalized fields manually (functions maintain them going forward):
  - `locationDisplayName`, `locationGeohash`, `locationLat`, `locationLng`
  - `priceFrom`, `durationFrom` (from cheapest variant)
  - `serviceAverageRating: null` (no reviews yet), `serviceReviewCount: 0`
  - `locationAverageRating: null`, `locationReviewCount: 0`
  - `nextAvailableAt`: a future ISO timestamp, `isFullyBooked: false`
  - `primaryPhotoUrl`: placeholder CDN URL, `primaryPhotoSource: 'salon'`
  - `popularityScore: 0.5` (placeholder until first weekly run)
- `services/{serviceId}/variants` — at least 2 variants per service (e.g. Short/Medium/Long for nails; Standard for single-option services); one with `isDefault: true`
- `services/{serviceId}/addons` — at least 1 optional addon per service where applicable
- `services/{serviceId}/photos` — 1 client photo + 1 salon photo per service
- `staff/{staffId}` — with `photoUrl`, `specialtyTags`
- `tenants/{tenantId}/reviews/{reviewId}` — with `serviceId`, `technicianRating: null | number`, `technicianComment: null | string`, `overallRating`
- `bookings/{bookingId}` — with `variantId`, `addonIds: []`, `priceSnapshot`, `durationSnapshot`, `variantNameSnapshot`, `addonsSnapshot: []`, `serviceNameSnapshot`, `locationNameSnapshot`, `technicianNameSnapshot`

---

### Phase 4 — Booking model + snapshot fields
*Depends on Phase 3. Touches the critical booking creation path.*

#### 4.1 Extend `Booking` type
**File:** `src/domains/bookings/model.ts`

Add to `Booking`:
```ts
variantId:              string
addonIds:               string[]
priceSnapshot:          number       // pence — immutable copy at booking time
durationSnapshot:       number       // minutes — immutable
variantNameSnapshot:    string       // e.g. "Medium"
addonsSnapshot:         Array<{ name: string; price: number; durationMinutes: number }>
serviceNameSnapshot:    string       // e.g. "Gel manicure"
locationNameSnapshot:   string       // e.g. "Glam Studio · Shoreditch"
technicianNameSnapshot: string       // e.g. "Maria"
```

#### 4.2 Update booking creation
**File:** `src/domains/bookings/repository.ts`

Update `createBooking` to:
1. Fetch `variant` from `services/{serviceId}/variants/{variantId}`
2. Fetch `addons` from `services/{serviceId}/addons` for each selected `addonId`
3. Compute `priceSnapshot = variant.price + sum(addons.price)`
4. Compute `durationSnapshot = variant.durationMinutes + sum(addons.durationMinutes)`
5. Write all snapshot fields on the booking document

Price and duration must be computed at creation and stored immutably. Subsequent variant price changes must not alter historical bookings.

#### 4.3 Confirm `updateNextAvailability` fires on booking writes
**File:** `functions/src/availabilitySummaryTrigger.ts` — confirm trigger fires on all booking status changes including cancellation, so `isFullyBooked` stays current.

---

### Phase 5 — Explore UI rewrite
*Largest phase. Depends on Phase 3 for seed data to develop against.*
*Sub-steps 5.2–5.4 are independent and can run in parallel.*

#### 5.1 New domain types
**File:** `src/domains/discovery/model.ts`

Add (keep `DiscoverySalonCard` until Phase 9 cleanup):
```ts
interface ServiceTypeCard {
  // Identity
  id:                    string
  tenantId:              string
  locationId:            string
  categoryId:            string
  categoryName:          string

  // Display
  serviceName:           string        // "Gel manicure"
  locationDisplayName:   string        // "Glam Studio · Shoreditch"

  // Pricing
  priceFrom:             number        // pence
  variantCount:          number        // 1 = "£25"; > 1 = "from £25"

  // Duration
  durationFrom:          number        // minutes

  // Ratings
  serviceAverageRating:  number | null // null if serviceReviewCount < 5
  serviceReviewCount:    number
  locationAverageRating: number | null // fallback
  locationReviewCount:   number

  // Availability
  nextAvailableAt:       string | null
  isFullyBooked:         boolean

  // Photo
  primaryPhotoUrl:       string | null
  primaryPhotoSource:    'client' | 'salon' | null

  // Booking
  isBookableOnline:      boolean

  // Geo
  locationLat:           number
  locationLng:           number
  distanceMetres:        number | null  // computed client-side

  // Logged-in only — null for guest
  isSaved:               boolean | null
  memberPoints:          number | null  // from tenants/{tenantId}/loyaltyStates/{userId}
}
```

Also add: `ServiceDetailObject`, `ServiceVariantObject`, `ServiceAddonObject`, `TechnicianCardObject`, `ReviewSummary`, `ReviewObject`

#### 5.2 Rewrite discovery repository
**File:** `src/domains/discovery/repository.ts`

Replace `discoveryFeaturedSalons` queries with `geofire-common` geo queries on `services` collection:

- `getServiceCards(params)` — geo bounds query using `geohashQueryBounds` + client-side distance filter; supports category, price range, availability, min rating, sort, cursor pagination; returns `{ services, nextCursor, total, locationLabel }`
- `getServiceDetail(serviceId)` — parallel fetch: service doc + variants + addons + photos + staff (`array-contains serviceId`) + recent reviews
- `getSearchSuggestions(q, lat?, lng?)` — services + locations matching query prefix
- `getUserLoyaltyForServices(userId, tenantIds[])` — batch `getDoc` on loyalty state for each unique tenant in the result set

Install dependency: `geofire-common` (already confirmed to work with Expo)

#### 5.3 Category chip row component
New component `CategoryChipRow`:
- Source: `service_categories` collection via `getActiveCategories(lat, lng)`
- "All" always leftmost, default, always visible
- Single-select; tapping active chip is a no-op
- Active style: `background: #FBEAF0 / border: 0.5px solid #F4C0D1 / color: #993556`
- Horizontal scroll with partial peek of next chip; no scroll dots
- `accessibilityRole="radio"` within `role="radiogroup"`; active chip: `accessibilityState={{ selected: true }}`
- Categories with zero active services in user's area are hidden

#### 5.4 `ServiceTypeCard` component
Replace `DiscoverySalonCard` rendering. New component anatomy:

**Photo block (16:9):**
- Progressive load: 40px thumbnail → full res on scroll-into-view
- Client-before-salon source priority
- Branded initials fallback (deterministic colour from `tenantId` hash; never blank grey box)
- Guest: no overlays. Logged-in: Save icon top-right (`ti-heart` outline→filled, optimistic state) + Member badge bottom-left (`"Member · 340 pts"`, `#D4537E` background)

**Info block:**
- Service name: 15px/500
- `"at [locationDisplayName]"`: 13px/`--color-text-secondary`; tappable → location profile
- Rating: `serviceAverageRating` primary → `locationAverageRating` fallback; `null` → `"New"` badge; `"4.9 ★ (128)"` or `"4.7 ★ location (312)"` for fallback
- Category tag chips (max 3); tappable → filter Explore to that category
- Availability + duration: `"Today 4:30 PM · 45 min"` / `"Fully booked"` badge
- Price: `variantCount === 1` → `"£48"`, else → `"from £25"`

**Book CTA:**
- Logged-in + available → `"Book"` → service detail screen
- Guest + available → `"Book"` → sign-up prompt (pre-filled: `"You're booking [service] at [location]"`) → returns to booking flow
- Fully booked → `"Join waitlist"` → WaitlistSetupScreen (logged-in) or sign-up first
- `isBookableOnline: false` → `"Call to book"` → `tel:[location.phone]`

**Accessibility:**
- Card: one tappable region; `accessibilityLabel="[service] at [location], [rating] stars, [price], available [time]"`
- Save icon: `accessibilityRole="button"`, `accessibilityLabel="Save [service]"` / `"Remove [service] from saved"`
- Member badge: `accessibilityElementsHidden={true}`
- Fully booked: `accessibilityLabel="[service] at [location], fully booked. Join waitlist."`

#### 5.5 Filters bottom sheet
**File:** `src/app/discover/FilterSheetScreen.tsx` — extend to full spec:

| Filter | Component | Default |
|--------|-----------|---------|
| Price range | Dual-handle slider | £0 to p95 local prices |
| Availability | Chips: Today / This week / Any time | Any time |
| Minimum rating | 5 tappable star icons | No minimum |
| Distance | Single-handle slider 1–25 km | 5 km (GPS-gated) |

- Filters apply live — no "Apply" button; results update behind the sheet
- Live result count: `"34 services in this range"` below price slider
- `"Clear all"` text link at top
- Dismiss retains current filter state
- Logged-in: persist in `AsyncStorage`. Guest: reset on session end.
- Badge count logic:
  ```js
  let count = 0
  if (priceMin > 0 || priceMax < p95Price) count++
  if (availability !== 'any')              count++
  if (minRating > 0)                       count++
  if (distanceKm !== 5 && gpsGranted)      count++
  ```

#### 5.6 Sort bottom sheet
New small component (or within FilterSheetScreen):
- 4 options: Recommended ✓ / Nearest / Price: low to high / Rating
- Single-select; applies on selection; sheet dismisses immediately
- Active label updates in results row `"Recommended ▾"`
- Sort persists when switching category chips

#### 5.7 Location change bottom sheet
New component:
- `"Use my current location"` (GPS) + `"Enter a city or postcode"` (text input)
- GPS denied → `"Allow location access"` → `Linking.openSettings()`; never re-triggers native permission prompt
- Selection takes effect immediately; sheet dismisses

#### 5.8 Main Explore feed screen
**File:** `src/app/discover/ExploreSearchResultsScreen.tsx` — full rewrite (or replace `src/app/discovery/ExploreResultsScreen.tsx`)

Structure (top to bottom):
1. **Header:** `"Explore"` 22px/500 left + `ti-map-pin` map toggle right. No bell. No subtitle. No context chip.
2. **Search bar:** full width, placeholder `"Search services, salons..."`, live suggestions after 2 chars (services `ti-sparkles` / locations `ti-building` / tags `ti-palette`), ✕ clear button, `AsyncStorage` recent searches (max 5), logged-in "Book again" shortcuts
3. **Category chip row** (5.3)
4. **Results row:** `"[n] services near [city]"` (city tappable → location sheet 5.7) + `"Recommended ▾"` (tappable → sort sheet 5.6) + `"Filters [n]"` button
5. **`FlatList` of `ServiceTypeCard`:** first 10 within 200ms (cache) / 600ms (fresh); infinite scroll in batches of 10; 2 skeleton cards for in-progress batches; never "Load more" button

**Empty states:**
- Filters match nothing → illustration + `"No services match these filters"` + `"Clear all filters"`
- Search no results → `"No results for '[query]'"` + `"Clear search"` chip + category chip row
- No services in area → `"No services in your area yet"` + email capture CTA

#### 5.9 Service detail screen
**File:** `src/app/discover/ServiceDetailScreen.tsx` — full rewrite

Structure:
1. `[← Back]` + `[Save icon]`
2. Photo gallery horizontal scroll (client photos first)
3. Service name (large/bold) + `"at [locationDisplayName]"` (tappable) + rating
4. Description (if provided)
5. **Variant picker** (only when `variants.length > 1`): chip row with section label `variantLabel ?? "Options"`; pre-selected = `isDefault: true` variant
6. **Add-ons** (only when addons exist): `"Add-ons (optional)"` multi-select chips `"Nail art +£10"`; none pre-selected
7. **"Our team at [locationName]"**: technician cards (44×44 circular photo, firstName, specialtyTags ≤3, rating ≥3 reviews or `"New"`, next available); ordered `averageRating DESC`; tap pre-selects technician in booking step 2
8. **Reviews**: star breakdown bar chart + recent reviews (firstName + last initial, stars, body, photos, `technicianComment` in teal callout, relative date)
9. **Sticky footer** (always visible): `"45 min  ·  £25"` + `"Continue to time slots →"` CTA; price and duration update live on every variant/addon selection; CTA enabled immediately (auto-selected single variant) or on first variant tap

Live price/duration formula:
```js
const totalPrice   = selectedVariant.price + selectedAddons.reduce((s,a) => s + a.price, 0)
const totalMinutes = selectedVariant.durationMinutes + selectedAddons.reduce((s,a) => s + a.durationMinutes, 0)
footerLabel = `${formatDuration(totalMinutes)} · £${(totalPrice / 100).toFixed(0)}`
```

---

### Phase 6 — Map view
*Depends on Phase 5.2 (geo query). Can run parallel with Phase 7.*

**File:** `src/app/discover/ExploreMapScreen.tsx`

- Toggle from header `ti-map-pin` — swaps `FlatList` for `MapView` (`react-native-maps`)
- One pin per unique `locationId` in the result set (not per service card); pin shows `"from £[priceFrom]"` bubble for the cheapest service at that location for the active category filter
- Tap pin → compact card bottom sheet: top service at that location; `"View all services"` link → location profile
- `"Switch to list"` button always visible in map view
- Map pin `accessibilityLabel="[locationDisplayName], from £[price]"`
- Session-level state: map/list toggle remembered until tab is unmounted

---

### Phase 7 — Admin service setup flow
*Depends on Phase 1 types. Can run parallel with Phase 5.*

**File:** `src/app/admin/serviceCatalogAdapters.ts` — build out guided 5-step service creation:

1. **Pick category** — single-select from `service_categories`
2. **Name the service** — free text; platform suggests common names per category
3. **Define variants** — row editor (Name / Price / Duration); validates ≥ 1 variant, exactly one `isDefault: true`; if salon selects "no variants" → auto-creates `name: "Standard"` variant
4. **Define add-ons (optional)** — row editor (Name / +Price / +Extra minutes); extra time 0 is valid; included in booking block
5. **Variant label (optional, only if > 1 variant)** — e.g. `"Nail length"` → stored as `variantLabel` on service doc
6. **Upload photos** → `services/{serviceId}/photos` subcollection with `source: "salon"`
7. **Publish** → set `isActive: true`

`updateServiceDerivedFields` Cloud Function (Phase 2.1) automatically sets `priceFrom` and `durationFrom` after step 3 saves. Never set manually.

---

### Phase 8 — Reviews delta
*Small. Can run parallel with Phases 5–7.*

#### 8.1 Extend `Review` type
**File:** `src/domains/reviews/model.ts`
- Add `serviceId: string | null`
- Add `technicianRating: number | null` (1–5; null if client skipped technician section)
- Add `technicianComment: string | null` (freeform; shown on technician card as teal callout)
- Rename `rating` to `overallRating` (or add alias)

#### 8.2 Add service-scoped review queries
**File:** `src/domains/reviews/repository.ts`
- Add `getReviewsForService(tenantId, locationId, serviceId, limit)` → `ReviewObject[]`
- Add `getServiceReviewBreakdown(tenantId, locationId, serviceId)` → `{ average, count, breakdown: {5:n, 4:n, 3:n, 2:n, 1:n} }`

#### 8.3 Update seed
Already covered in Phase 3.

---

### Phase 9 — Cleanup
*After Phases 5–8 pass all verification checks.*

- Remove `discoveryFeaturedSalons` reads from `src/domains/discovery/repository.ts`
- Remove `discoveryFeaturedSalons` rules block from `firestore.rules`
- Remove `DiscoverySalonCard` type from `src/domains/discovery/model.ts`
- Remove `tenants/{tenantId}/serviceAddons` rules block from `firestore.rules`
- Consolidate `src/app/discover/` and `src/app/discovery/` directories (two overlapping directories currently exist)
- Remove unused indexes from `firestore.indexes.json`

---

## 4. File reference

### Data model
| File | Change |
|------|--------|
| `src/domains/services/model.ts` | Reshape `Service`; add `ServiceCategory` |
| `src/domains/services/serviceCatalogModel.ts` | Add `ServiceVariant`, `ServicePhoto`; repath `ServiceAddon` |
| `src/domains/services/repository.ts` | Add `getActiveCategories()` |
| `src/domains/locations/model.ts` | Add `geohash`, `displayName` |
| `src/domains/staff/model.ts` | Add `photoUrl`, `specialtyTags`, rating aggregate fields |
| `src/domains/bookings/model.ts` | Add variant/addon snapshot fields |
| `src/domains/bookings/repository.ts` | Booking creation reads variants + addons, writes snapshots |
| `src/domains/reviews/model.ts` | Add `serviceId`, `technicianRating`, `technicianComment` |
| `src/domains/reviews/repository.ts` | Add service-scoped review queries |
| `src/domains/discovery/model.ts` | Add `ServiceTypeCard` and all consumer types |
| `src/domains/discovery/repository.ts` | Full rewrite for geo queries on `services` collection |

### UI
| File | Change |
|------|--------|
| `src/app/discover/ExploreSearchResultsScreen.tsx` | Full rewrite → Explore feed |
| `src/app/discover/ServiceDetailScreen.tsx` | Full rewrite → service detail |
| `src/app/discover/FilterSheetScreen.tsx` | Extend to full filters spec |
| `src/app/discover/ExploreMapScreen.tsx` | Extend to price-bubble pins |
| `src/app/discover/discoveryFilters.ts` | Extend filter state logic |
| `src/app/admin/serviceCatalogAdapters.ts` | Build out 5-step setup flow |

### Cloud Functions
| File | Change |
|------|--------|
| `functions/src/serviceDerivedFields.ts` | **New** — variants + photos triggers |
| `functions/src/availabilitySummaryTrigger.ts` | Extend to write `nextAvailableAt` / `isFullyBooked` |
| `functions/src/bookingTriggers.ts` | Extend review aggregates (service + technician level) |
| `functions/src/popularityIndex.ts` | Extend to write `popularityScore` to services |
| `functions/src/payments.ts` | Extend loyalty to write `locationBreakdown` |
| `functions/src/index.ts` | Register new exported functions |

### Infrastructure
| File | Change |
|------|--------|
| `firestore.rules` | Add service subcollections, `service_categories`; remove legacy blocks |
| `firestore.indexes.json` | Add 7 new composite indexes |
| `scripts/seed-qa-firestore.mjs` | Full reseed with new shapes |

---

## 5. Verification checklist

- [ ] A seeded location with Nails + Hair services appears as N separate cards; "Nails" chip filters to only nail cards
- [ ] Selecting a non-default variant on service detail updates sticky footer price and duration live
- [ ] Booking created with a non-default variant + one addon stores correct `priceSnapshot` and `durationSnapshot`; changing variant price afterwards does not alter the historical booking
- [ ] A service with < 5 reviews shows no rating on the card; ≥ 5 shows `serviceAverageRating`; when service count < 5 but location count ≥ 5, shows `locationAverageRating` with `"location"` suffix
- [ ] `updateServiceDerivedFields`: adding a cheaper variant reduces `priceFrom` on the parent service doc
- [ ] `updateNextAvailability`: cancelling the last available booking sets `isFullyBooked: true` on the service doc
- [ ] Firestore rules emulator: unauthenticated user can read `services` and `service_categories`; cannot write variants; client can upload photo only with own `uid` as `uploadedByUserId`
- [ ] Geo query returns only services within `radiusKm`; `geofire-common` bounds + client-side distance filter removes false positives
- [ ] All 5 category chips render; a category with zero active services in area is hidden
- [ ] Completing a booking increments `tenants/{tenantId}/loyaltyStates/{userId}.pointsBalance` and correctly updates `locationBreakdown[locationId]`
- [ ] Guest "Book" CTA fires sign-up prompt pre-filled with correct service + location; after sign-up returns to booking flow (not Home)
- [ ] Map view: pin per unique locationId (not per card); tapping pin opens compact card sheet for top service at that location

---

## 6. Out of scope for v1

- Voice search
- AR try-on / service comparison
- Group / party booking
- Technician portable `globalId` career profile
- Salon grouping / collapsing in results
- `"Call to book"` → contact form (v1 opens phone dialler)
- Member badge tap action (informational only in v1)

---

*End of implementation plan — Explore Tab v2 + Service Data Model v3*  
*Cross-references: `zarkili_explore_tab_spec_v2.md`, `zarkili_service_data_model_v3.md`*
