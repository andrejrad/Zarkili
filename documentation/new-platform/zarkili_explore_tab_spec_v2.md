# Zarkili — Explore Tab Feature Specification

**Version:** 2.0 — Brand / Location hierarchy, service-level ratings, technician profiles  
**Replaces:** `zarkili_explore_tab_spec.md` v1.0  
**Platform:** iOS + Android (React Native / Expo)  
**Data model:** `zarkili_service_data_model_v3.md`  
**Dependencies:** `zarkili_home_tab_spec.md`, `zarkili_home_empty_states_spec.md`

---

## 1. Overview

### 1.1 Core principle

The Explore tab is a **service browser**, not a salon or brand browser. Users
search for "gel manicure" or "lash lift" — not "nail salons near me." Each
Explore card represents one bookable service type at one specific location.

### 1.2 Business hierarchy

```
Brand          e.g. "Glam Studio"
  Location     e.g. "Glam Studio · Shoreditch"
    Service    e.g. "Gel manicure" — one Explore card
    type
```

- A **brand** with 3 locations and 6 service types per location = 18 Explore cards.
- A **single-location** brand with 6 service types = 6 Explore cards.
- A location offering services across multiple categories (e.g. Nails and Hair)
  has one service type card per distinct service, each with its own `categoryId`.
  Selecting "Nails" shows only that location's nail service cards.
  Selecting "All" shows all service type cards from that location.

### 1.3 Guest vs logged-in

Explore is approximately 90% identical for both user states. All content is
visible without an account. The differences are **additive only**.

| Aspect | Guest | Logged-in |
|--------|-------|-----------|
| All services, prices, availability | ✓ | ✓ |
| All filters and sorting | ✓ | ✓ |
| Map view | ✓ | ✓ |
| Default sort | Popularity + proximity | Same + weighted by aesthetic tags + booking history |
| Save (heart) icon on cards | ✗ | ✓ |
| "Member · X pts" badge on cards | ✗ | ✓ (brand-level points, shown on all locations of that brand) |
| Book CTA | Fires sign-up prompt → returns to booking flow | Goes directly into booking flow |
| Waitlist CTA | Fires sign-up prompt → WaitlistSetupScreen | Opens WaitlistSetupScreen directly |
| Search suggestions | Service names + location names + aesthetic tags | Same + search history + "Book again" shortcuts |
| Filter state persistence | Resets each session | Persists via AsyncStorage |
| Empty state — no services | Email capture (manual entry) | Email capture (pre-filled from account) |

---

## 2. Screen structure (top to bottom)

| # | Element | Always visible |
|---|---------|---------------|
| 1 | Header — title + map toggle | Yes |
| 2 | Search bar | Yes |
| 3 | Category chip row | Yes |
| 4 | Results row — count + location + sort + filters | Yes |
| 5 | Service card list — vertical, infinite scroll | Yes |

---

## 3. Element specifications

### 3.1 Header

**Contents:**
- Left: screen title `"Explore"` — 22px, weight 500
- Right: map toggle icon button (`ti-map-pin`)

**Rules:**
- No subtitle. Remove `"Main discovery screen for salons and services."` —
  production apps do not describe their own screens.
- No notification bell. The bell belongs on Home only.
- No salon/brand context chip. Explore is always fully global — no brand or
  location scoping applies here.

---

### 3.2 Search bar

**Placement:** Full width, directly below header.

**Placeholder:** `"Search services, salons..."`

**On tap:**
- Keyboard opens immediately.
- Recent searches shown below the bar (local device storage, max 5).
- Logged-in users: "Book again" shortcuts for most recently booked services
  appear above recent searches.

**While typing:**
- Live suggestions after 2 characters, target latency < 150ms.
- Three suggestion types with distinct icons:
  - Services — `ti-sparkles` — e.g. "Gel manicure"
  - Locations — `ti-building` — e.g. "Glam Studio · Shoreditch"
  - Aesthetic tags — `ti-palette` — e.g. "Y2K nails"
- Results update live as the user types. No Enter or submit button needed.
- Clear `✕` button inside the bar once any character is typed.

**Empty results state:**
```
"No results for '[query]'"
[Clear search] chip
[Category chip row — lets user pivot to browsing by category]
```

**Rules:**
- Never require Enter or a submit button.
- Skeleton rows only while loading — never a full-screen spinner.
- Voice search: out of scope for v1.

---

### 3.3 Category chip row

**Categories:**
```
All · Nails · Hair · Skin · Lashes · Brows · Massage
```

Order: "All" always leftmost. Remaining chips ordered by booking popularity in
the user's area, recalculated weekly. Only categories with at least one active
service type in the user's area are shown.

**Interaction:**
- Single-select. Tap to filter instantly — no confirm step.
- "All" is the default and resets the category filter.
- Tapping the already-active chip does nothing.

**Active chip style:**
```
background: #FBEAF0
border:     0.5px solid #F4C0D1
color:      #993556
```

**Scroll:** Horizontal. Show partial peek of the next chip. No scroll dots.

**What "All" means:**
- Removes the category constraint from the query.
- Returns the default Recommended feed: proximity + popularity +
  personalisation (logged-in) sorted by `popularityScore DESC`.
- Results row shows: `"48 services near London"` when "All" is active.
- The same Recommended algorithm powers the "Trending near you" strip on Home.
  Overlap between Home and Explore "All" is intentional coherence, not duplication.

**Multi-category location handling:**
A location offering both Nails and Hair has separate `service_types` documents
per service, each with its own `categoryId`. Selecting "Nails" returns only nail
service cards from that location. Selecting "All" returns all service cards from
all locations. The location's brand name and branch name appear on each card.

---

### 3.4 Results row

```
[count + location link]          [sort label ▾]  [Filters (n)]
"48 services near London"        Recommended     Filters
```

**Count + location:**
- Copy: `"[n] services near [city]"`
- `"near [city]"` is tappable — opens location change bottom sheet (see 3.4.1).
- Count updates live as filters or category changes.

**Sort label:**
- Tappable `"Recommended ▾"` — opens sort-only bottom sheet.
- 4 options: Recommended (default) · Nearest · Price: low to high · Rating
- Active sort label updates in the results row on selection.
- Sort preference persists when switching between category chips.

**Filters button:**
- Label: `"Filters"` when no active filters.
- Label: `"Filters (n)"` when n non-default filters are applied.
- Background: `#FBEAF0` when any filter is active; white otherwise.

#### 3.4.1 Location change bottom sheet

Opened by tapping `"near [city]"`.

```
[Use my current location]       ← requires GPS permission
[Enter a city or postcode]      ← manual text input
```

- If GPS was previously denied: show `"Allow location access"` linking to
  device settings. Never re-trigger the native OS dialog after a denial.
- Selection takes effect immediately. Sheet dismisses.

**City chip row replacement:**  
The previous two-row layout (category chips + city chips) is replaced by the
inline `"near [city]"` tappable label. City selection is a secondary utility,
not a primary filter.

---

### 3.5 Service cards

One card per service type per location. A location with 6 service types = 6 cards.
Nail length variants (Short/Medium/Long) are NOT separate cards — they are variant
chips on the service detail screen.

#### 3.5.1 Card anatomy

```
┌───────────────────────────────────────────┐
│  [client result photo — 16:9]             │  ← client photos before salon photos
│  [Member badge — bottom left]             │  ← logged-in only, brand members
│  [Save icon — top right]                 │  ← logged-in only
│  [Photo count — bottom right]            │
├───────────────────────────────────────────┤
│  Gel manicure                   [4.9 ★]  │  ← service name + service-level rating
│  at Glam Studio · Shoreditch · (128)     │  ← location display name + review count
│  [Nails]                                 │  ← category tag(s), max 3
│  Today 4:30 PM · 45 min       from £25  │  ← availability + duration + price
│  [            Book            ]          │  ← primary CTA
└───────────────────────────────────────────┘
```

#### 3.5.2 Photo

- **Source priority:** client result photos always before salon portfolio photos.
  Ordered by `source ASC` ("client" < "salon"), then `displayOrder ASC`.
- **What client photos show:** the actual result of the service — nails, hair
  colour outcome, lash result. Not salon interiors.
- **Fallback:** if no photos exist, show a branded placeholder tile: brand
  initials in a coloured circle (colour deterministically derived from brand name).
  Never a blank grey box.
- **Aspect ratio:** 16:9, fixed height, full card width.
- **Loading:** progressive — 40px thumbnail upscaled. Never a broken-image icon.

#### 3.5.3 Service name

- Primary heading, 15px, weight 500.
- Source: `service_types.name` (e.g. "Gel manicure").
- Always the service, never the brand or location name.

#### 3.5.4 Location display name

- Secondary text, 13px, `--color-text-secondary`.
- Format: `"at [locationDisplayName]"` e.g. `"at Glam Studio · Shoreditch"`
- Source: `service_types.locationDisplayName` (denormalised from location document).
- **Single-location brand:** `locationDisplayName` = brand name alone —
  `"at Luna Studio"`. No branch suffix needed.
- **Multi-location brand:** `locationDisplayName` = brand name + branch suffix —
  `"at Glam Studio · Shoreditch"`. The client must know which branch to go to.
- Tappable → navigates to the location profile page (shows all services at
  that specific location, plus the brand overview).

#### 3.5.5 Rating + review count

- Format: `"4.9 ★ (128)"`
- **Primary rating:** `serviceAverageRating` — the average rating for this
  specific service type at this location. Source: aggregate maintained by the
  `updateReviewAggregates` Cloud Function.
- **Fallback:** when `serviceReviewCount < 5`, fall back to
  `locationAverageRating`. Append a location indicator:
  `"4.7 ★ location (312)"` vs `"4.9 ★ (128)"` — so the user understands
  which level is being shown.
- **New locations / services:** if `locationReviewCount < 5`, show a `"New"`
  badge instead of a rating. Never display a rating from fewer than 5 reviews.
- Review count is the service-level count (`serviceReviewCount`) when available,
  location-level count when falling back.

**Why service-level, not location-level:**  
A location with excellent nails (4.9) and mediocre balayage (4.2) should not
have both service cards penalised by the blended average. Service-level ratings
surface which treatments a location actually excels at.

#### 3.5.6 Category tags

- Max 3 tags. Source: `service_types.categoryId` → `service_categories.name`.
- Each tag is tappable — filters Explore to that category.

#### 3.5.7 Availability

- Format: `"Today 4:30 PM"` / `"Tomorrow 11:00 AM"` / `"Thu 22 May · 2:00 PM"`
- Source: `service_types.nextAvailableAt` (denormalised, maintained by
  `updateNextAvailability` Cloud Function).
- **Fully booked:** when `isFullyBooked: true`, replace availability text with
  a `"Fully booked"` badge and replace Book CTA with `"Join waitlist"`.
- Never manufactured urgency. Only show real availability data.

#### 3.5.8 Duration

- Format: `"45 min"` or `"1 hr 30 min"`
- Source: `service_types.durationFrom` — shortest active variant's duration.
- Always shown alongside availability: `"Today 4:30 PM · 45 min"`.

#### 3.5.9 Price display

```js
// Price display logic — application layer
const variantCount = activeVariants.length

if (variantCount === 1) {
  priceDisplay = `£${(variant.price / 100).toFixed(0)}`
  // Renders as: "£48" — no "from"
} else {
  priceDisplay = `from £${(serviceType.priceFrom / 100).toFixed(0)}`
  // Renders as: "from £25"
}
```

- `service_types.priceFrom` is derived automatically from
  `MIN(active variants.price)` by the `updateServiceTypeDerivedFields`
  Cloud Function. Never set manually.
- `"from £X"` on a **service type card** is acceptable — the user knows which
  service they are considering. The variation (e.g. nail length) is a rational
  parameter they expect to configure on the detail screen.
- `"From £X"` on a **brand/location card** is a dark pattern — avoided by using
  service type cards as the primary unit.
- Never omit the price. Missing price = extra tap + reduced trust.

#### 3.5.10 Book CTA

| User state | CTA label | Action |
|-----------|-----------|--------|
| Logged-in, available | `"Book"` | → Service detail screen → booking flow |
| Guest, available | `"Book"` | → Sign-up prompt. Pre-fills: `"You're booking [service] at [location]"`. After sign-up, returns to booking flow. Never drops to Home. |
| Any user, fully booked | `"Join waitlist"` | Logged-in: → WaitlistSetupScreen. Guest: sign-up prompt first. |
| `isBookableOnline: false` | `"Call to book"` | Opens `tel:[location.phone]` |

#### 3.5.11 Logged-in only — save icon

- Position: top-right corner of the photo.
- Icon: `ti-heart` (outline → filled on save).
- Tap: saves to `Profile > Saved services`. Optimistic UI — update immediately,
  sync to server in background.
- `accessibilityRole="button"`, `accessibilityLabel="Save [service name]"` /
  `"Remove [service name] from saved"`.
- Not shown for guest users.

#### 3.5.12 Logged-in only — member badge

- Position: bottom-left corner of the photo.
- Condition: shown when `user_brand_loyalty/{userId}_{brandId}` document exists
  for this card's `brandId`. Includes all locations of the brand.
- Format: `"Member · 340 pts"` — brand-level points balance.
- Source: `user_brand_loyalty.pointsBalance` where `brandId = card.brandId`.
- Style: background `#D4537E`, text `#FBEAF0`, border-radius 10px.
- A user who has visited "Glam Studio Shoreditch" will see the "Member · 340 pts"
  badge on ALL Glam Studio location cards, including "Glam Studio Canary Wharf"
  — because points are brand-level.

---

### 3.6 Filters bottom sheet

Opened by tapping `"Filters"`. Bottom sheet, max 70% viewport height,
swipe-dismissible.

#### 3.6.1 Filter controls

| Filter | Component | Default | Notes |
|--------|-----------|---------|-------|
| Price range | Dual-handle slider | £0 to p95 of local prices | Live result count updates: `"34 services in this range"` |
| Availability | Chips: "Today" · "This week" · "Any time" | "Any time" | Multi-select. "Today + This week" = next 7 days. |
| Minimum rating | 5 tappable star icons | No minimum | Rating compared against `serviceAverageRating` (with `locationAverageRating` fallback). |
| Distance | Single-handle slider | 5 km | Only when GPS is granted. Range: 1–25 km. |

#### 3.6.2 Filter behaviour

- Filters apply live — no "Apply" button. Results update behind the sheet.
- `"Clear all"` text link at top resets all filters to defaults.
- Dismiss at any point — applied filters are retained.
- Logged-in: filter state persists via AsyncStorage.
- Guest: filter state resets on session end.

#### 3.6.3 Active filter badge count

```js
let count = 0
if (priceMin > 0 || priceMax < p95Price) count++
if (availability !== 'any')              count++
if (minRating > 0)                       count++
if (distanceKm !== 5 && gpsGranted)      count++

filterButtonLabel = count > 0 ? `Filters (${count})` : 'Filters'
```

---

### 3.7 Sort bottom sheet

Opened by tapping `"Recommended ▾"`. Single-select, applies on selection.

| Option | Default | Sort field |
|--------|---------|-----------|
| Recommended | ✓ | `popularityScore DESC` + proximity + personalisation |
| Nearest | | Distance from user (client-side after geo filter) |
| Price: low to high | | `priceFrom ASC` |
| Rating | | `serviceAverageRating DESC` (fallback to `locationAverageRating`) |

---

### 3.8 Map view

Toggled by the `ti-map-pin` icon in the header. State persists for the session.

- Shows location pins across the current area.
- Each pin displays `priceFrom`: `"from £25"`.
- Tapping a pin opens a compact service card bottom sheet for the top service
  at that location for the active category filter.
- `"View all services"` link in the sheet → location profile page.
- Map view must always have a `"Switch to list"` button visible.

---

### 3.9 Infinite scroll and pagination

- First 10 results render within 200ms (cache) / 600ms (fresh fetch).
- Subsequent batches of 10 load as the user scrolls within 2 cards of the bottom.
- Skeleton cards for in-progress batches.
- No "Load more" button — infinite scroll only.

---

## 4. Service detail screen

### 4.1 Screen structure

```
[← Back]                                    [Save icon]
─────────────────────────────────────────────────────────
[Photo gallery — horizontal scroll]
  Client result photos first, then salon portfolio photos
─────────────────────────────────────────────────────────
Service name (large, bold)
at [locationDisplayName]  (tappable → location profile)
[serviceAverageRating ★ · serviceReviewCount reviews]
─────────────────────────────────────────────────────────
Description (if salon provided one)
─────────────────────────────────────────────────────────
[Variant section — shown only when variantCount > 1]
  Section label: variantLabel (e.g. "Nail length") or "Options"
  Chip row: Short · £25  |  Medium · £30  |  Long · £35
  Pre-selected chip: isDefault = true variant

[Add-ons section — shown only when addons exist]
  Section label: "Add-ons (optional)"
  Chip per add-on: name + "+£X"
  None pre-selected
─────────────────────────────────────────────────────────
[Our team at {locationName}]
  "Any available" row (always first)
  Technician cards: photo, firstName, specialtyTags,
                    averageRating ★, reviewCount, nextAvailableAt
  Ordered by: averageRating DESC
─────────────────────────────────────────────────────────
[Reviews]
  Star breakdown (5★ through 1★ bar chart)
  Recent reviews — text + optional photo + reviewer first name + initial
  Optional: technician shout-out text displayed separately per review
─────────────────────────────────────────────────────────
[Sticky footer — always visible]
  "45 min  ·  £25"         [Continue to time slots →]
  Updates live as variant / add-ons change
```

### 4.2 Variant picker

```js
const variants = serviceType.variants.filter(v => v.isActive)

if (variants.length === 0) {
  // Invalid state — all service types must have at least one active variant
  throw new Error('No active variants for service type')
}

if (variants.length === 1) {
  // Auto-select silently — do NOT render the variant picker section
  selectedVariant = variants[0]
} else {
  // Render chip row with section label
  selectedVariant = variants.find(v => v.isDefault) ?? variants[0]
}
```

**Live price update:**

```js
const totalPrice = selectedVariant.price +
  selectedAddons.reduce((sum, a) => sum + a.price, 0)

const totalMinutes = selectedVariant.durationMinutes +
  selectedAddons.reduce((sum, a) => sum + a.durationMinutes, 0)

// Sticky footer updates immediately on every variant or add-on change:
footerLabel = `${formatDuration(totalMinutes)} · £${(totalPrice / 100).toFixed(0)}`
```

### 4.3 Technician cards (Our team section)

Each technician card shows:
- Profile photo (circular, 44×44 pt)
- First name
- Specialty tags (max 3)
- Rating: `technician.averageRating ★ · (technician.reviewCount)`
  Shown only when `reviewCount >= 3`. "New" badge otherwise.
- Next available slot for this technician + service type combination

Tapping a technician card pre-selects them in booking step 2 (Stylist selection).
The user does not have to re-select in the booking flow.

### 4.4 Reviews section

Each review shows:
- Reviewer: first name + last initial only (e.g. "Aisha K.")
- `overallRating` as stars
- `body` text — full text, no truncation on first view
- Photo thumbnail(s) if attached
- If `technicianComment` is present: display as a separate line in a teal
  callout block: `"About Maria: [technicianComment]"`
- Date (relative: "3 weeks ago" / absolute for reviews > 6 months old)

---

## 5. Data model — Firestore reference

Full schema in `zarkili_service_data_model_v3.md`. Summary for Explore:

### 5.1 Collections used

| Collection | Purpose | Key fields used |
|-----------|---------|----------------|
| `service_categories` | Category chip row | `id`, `name`, `displayOrder` |
| `brands/{id}/locations/{id}/service_types` | One doc = one Explore card | `id`, `brandId`, `locationId`, `categoryId`, `name`, `locationDisplayName`, `priceFrom`, `durationFrom`, `serviceAverageRating`, `serviceReviewCount`, `locationAverageRating`, `locationReviewCount`, `nextAvailableAt`, `isFullyBooked`, `isActive`, `isBookableOnline`, `popularityScore`, `locationLat`, `locationLng`, `locationGeohash`, `primaryPhotoUrl`, `primaryPhotoSource` |
| `.../variants` | Variant picker on detail screen | `id`, `name`, `price`, `durationMinutes`, `isDefault`, `displayOrder`, `isActive` |
| `.../addons` | Add-on chips on detail screen | `id`, `name`, `price`, `durationMinutes`, `displayOrder`, `isActive` |
| `.../photos` | Gallery on detail screen | `id`, `source`, `storageUrl`, `displayOrder`, `isApproved` |
| `brands/{id}/locations/{id}/technicians` | "Our team" on detail screen | `id`, `firstName`, `photoUrl`, `specialtyTags`, `serviceTypeIds`, `averageRating`, `reviewCount`, `isActive` |
| `reviews` | Review list on detail screen | `locationId`, `serviceTypeId`, `overallRating`, `body`, `technicianComment`, `photoUrls`, `isPublished`, `createdAt` |
| `user_brand_loyalty` | Member badge + points on cards | `userId`, `brandId`, `pointsBalance` |

### 5.2 ServiceCardObject TypeScript interface

```ts
interface ServiceCardObject {
  // Identity
  id:                  string   // service_types document ID
  brandId:             string
  locationId:          string
  categoryId:          string
  categoryName:        string

  // Display
  serviceName:         string   // "Gel manicure"
  locationDisplayName: string   // "Glam Studio · Shoreditch" or "Luna Studio"

  // Pricing
  priceFrom:           number   // pence — 2500 = £25
  variantCount:        number   // 1 = show "£25"; > 1 = show "from £25"

  // Duration
  durationFrom:        number   // minutes

  // Ratings — service-level primary, location-level fallback
  serviceAverageRating:  number | null  // null if serviceReviewCount < 5
  serviceReviewCount:    number
  locationAverageRating: number | null  // fallback when service rating unavailable
  locationReviewCount:   number

  // Availability
  nextAvailableAt:     string | null   // ISO timestamp | null
  isFullyBooked:       boolean

  // Photo
  primaryPhotoUrl:     string | null
  primaryPhotoSource:  'client' | 'salon' | null

  // Booking
  isBookableOnline:    boolean

  // Location geo — for client-side distance display
  locationLat:         number
  locationLng:         number
  distanceMetres:      number | null   // computed by server or client from user coords

  // Logged-in only — null for guest requests
  isSaved:             boolean | null
  memberPoints:        number | null   // from user_brand_loyalty where brandId matches
}
```

---

## 6. API endpoints

```
GET /explore/services
  Query params:
    lat={float}               required when GPS granted
    lng={float}               required when GPS granted
    city={string}             fallback if no GPS
    radiusKm={int}            default: 5, max: 25
    categoryId={string}       optional — omit for "All"
    priceMin={int}            optional — pence
    priceMax={int}            optional — pence
    availability={today|week|any}  default: any
    minRating={float}         optional — compared against serviceAverageRating
    sort={recommended|nearest|price|rating}  default: recommended
    userId={string}           optional — enables personalised sort + member badges
    cursor={string}           optional — last document ID for pagination
    pageSize={int}            default: 10

  Response:
    {
      total:          number,
      locationLabel:  string,         // "near London"
      services:       ServiceCardObject[],
      nextCursor:     string | null   // last document ID for next page
    }

GET /explore/services/:serviceTypeId
  Path params:
    brandId    (passed as query param or resolved from serviceTypeId)
    locationId (passed as query param or resolved from serviceTypeId)

  Response:
    {
      serviceType:     ServiceTypeDetailObject,
      variants:        ServiceVariantObject[],
      addons:          ServiceAddonObject[],
      photos:          ServicePhotoObject[],
      technicians:     TechnicianCardObject[],
      reviewsSummary:  { averageRating, count, breakdown: {5:n, 4:n, 3:n, 2:n, 1:n} },
      recentReviews:   ReviewObject[]
    }

GET /explore/search/suggestions
  Query params:
    q={string}          min 2 characters
    userId={string}     optional — enables personalised suggestions
    lat={float}         optional
    lng={float}         optional
  Response:
    {
      services:  [{ id, name, categoryName, locationDisplayName }],
      locations: [{ id, displayName, brandId }],
      tags:      [{ label }]
    }

GET /explore/categories
  Query params:
    lat={float}   optional — filters to categories with services in area
    lng={float}   optional
  Response:
    { categories: [{ id, name, iconName, displayOrder }] }
  Note:
    Returns only categories with >= 1 active service in the user's area.
```

---

## 7. Empty states

| Condition | Content |
|-----------|---------|
| No services for active filters | Illustration + `"No services match these filters"` + `"Clear all filters"` CTA |
| No services for search query | `"No results for '[query]'"` + `"Clear search"` chip + category chip row |
| No services in area (25km+ exhausted) | `"No services in your area yet"` + `"Notify me when Zarkili launches nearby"` CTA. Guest: email input. Logged-in: pre-filled, one-tap subscribe. |
| Loading — first render | 3× `SkeletonServiceCard` — same dimensions as real cards. Render within 200ms of tab tap. |
| Loading — next page | 2× `SkeletonServiceCard` appended below last card. |

**Rule:** Never a blank white screen. Every zero-result state has an illustration,
a one-sentence reason, and at least one CTA with a forward path.

---

## 8. Accessibility

| Element | Requirement |
|---------|------------|
| Category chips | `accessibilityRole="radio"` within `role="radiogroup"`. Selected: `accessibilityState={{ selected: true }}` |
| Service card | One tappable region. `accessibilityLabel="[service] at [location], [rating] stars, [price], available [time]"` |
| Save icon | `accessibilityRole="button"`, `accessibilityLabel="Save [service]"` or `"Remove [service] from saved"` |
| Member badge | `accessibilityElementsHidden={true}` — communicated via the card's main accessibilityLabel |
| Rating | Text label — never colour alone. `"4.9 stars, 128 reviews"` |
| Card photo | `accessibilityLabel` describing the service result shown |
| Filters button | `accessibilityLabel="Filters, [n] active"` when filters applied |
| Fully booked | `accessibilityLabel="[service] at [location], fully booked. Join waitlist."` |
| Skeleton loaders | `accessibilityElementsHidden={true}` |
| Map view | `"Switch to list"` always visible. Pins: `accessibilityLabel="[location name], from £[price]"` |

---

## 9. Performance targets

| Metric | Target |
|--------|--------|
| Tab tap → first card visible | < 200ms (cache) / < 600ms (fresh fetch) |
| Category chip tap → results update | < 200ms |
| Filter change → results update | < 200ms |
| Search suggestion appearance | < 150ms after 2nd character |
| Card photo loading | Progressive — 40px thumbnail first, full res on scroll-into-view |
| Skeleton render | Immediate — never a blank screen during fetch |

---

## 10. Current screen — fixes required

Items from the live Explore screen that need to change before production:

| Priority | Issue | Fix |
|----------|-------|-----|
| Critical | `"Main discovery screen for salons and services."` subtitle | Remove entirely |
| Critical | `"From EUR28"` — location-level "from" price on a salon card | Switch to service type cards with service-level `priceFrom` |
| Critical | Currency mixing (EUR and USD on same screen) | Geo-detect currency at session start, apply consistently |
| ✅ Done | Notification bell in Explore header | Removed pre-W51 — bell replaced with Map icon |
| High | City chip row (Austin, Brooklyn, Chicago) | Replace with `"near [city]"` tappable label in results row |
| High | Salon interior as primary card photo | Client result photos must be primary. Interior shots on location profile only. |
| High | Missing service duration on cards | Add: `"Today 4:30 PM · 45 min"` |
| High | Card shows salon-level rating | Show `serviceAverageRating` with `locationAverageRating` fallback |
| Medium | No save icon for logged-in users | Add `ti-heart` top-right of photo |
| Medium | `"Member"` badge shows no points | Extend to `"Member · 340 pts"` (brand-level balance) |
| Medium | No branded fallback for missing photos | Implement initials tile with deterministic colour |

---

## 11. Out of scope for v1

- Voice search
- AR try-on
- Service comparison across locations
- Group / party booking
- Salon grouping / collapsing in results
- Brand-level (cross-location) service catalogue browsing

---

## 12. Open decisions

| # | Decision | Affects | Owner |
|---|----------|---------|-------|
| 1 | `variantLabel` on service types: does the salon set it manually, or does the platform infer it from variant names? | Variant picker section heading on detail screen | Product |
| 2 | Minimum review counts: service-level rating shown at 5+, technician rating at 3+, location rating at 5+. Confirm these thresholds. | Rating display on cards and detail screen | Product |
| 3 | Distance slider default (5km) and max (25km). Confirm range. | Filter sheet | Product |
| 4 | `popularityScore` weighting: booking count 60%, rating 30%, recency 10%. Confirm formula. | Recommended sort order | Product + Data |
| 5 | Non-bookable services (`isBookableOnline: false`): open phone dialler or show a contact form? | "Call to book" CTA action | Product |
| 6 | Should the "Member" badge on Explore cards link to the loyalty programme details, or just be informational? | Member badge tap action | Product |

---

## 13. What changed from v1.0

| v1.0 | v2.0 |
|------|------|
| `"at [salonName]"` secondary line on cards | `"at [locationDisplayName]"` — includes branch for multi-location brands |
| Single `averageRating` (location-level) on cards | `serviceAverageRating` primary, `locationAverageRating` as fallback |
| Member badge: `user_salon_loyalty` | Member badge: `user_brand_loyalty` — covers all locations of the brand |
| No technician section on service detail | "Our team" section with technician cards, ratings, and pre-selection |
| Reviews section: text only | Reviews section: text + optional technician shout-out callout |
| References to `salons/` collection path | Updated to `brands/{id}/locations/{id}/service_types` |
| `salon_id` in TypeScript interface | `brandId` + `locationId` |

---

*End of specification — Zarkili Explore Tab v2.0*  
*Data model: `zarkili_service_data_model_v3.md`*  
*Related: `zarkili_home_tab_spec.md`, `zarkili_home_empty_states_spec.md`,*  
*`zarkili_home_spec_diff.md`*
