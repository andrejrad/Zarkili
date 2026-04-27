# Batch B — Discover, Explore, Profile

> Consumed by **Week 22**. Critical path. Builds on existing `screen-home` and `screen-explore`.
> Always prepend the Global Design System Anchor from [`README.md`](README.md).

Screens: Authenticated home · Discover feed · Explore search results · Filter sheet · Salon profile · Service detail · Staff member detail · Map view (optional, defer to W28 if needed).

New components: `filter-sheet`, `range-slider`, `rating-star-group`, `gallery-carousel`, `salon-hero-card`, `staff-avatar-list`, `sticky-cta-bar`.

---

## SCREEN — B.1 Authenticated Home

```text
SCREEN: Authenticated Home   DEVICE: iPhone 14 390×844
PERSONA: Returning consumer, en-US.
USER JOB: See personalized recommendations and resume booking flow.

LAYOUT
- Status bar + safe area top.
- Header (sticky, surface white, 56pt): left avatar (32 circle, tappable → profile), center search-bar (existing component, tap → opens Explore), right notifications icon-button with badge.
- Body (scroll, page H 16, section gap 24):
  1) Greeting "Good morning, Alex" heading-3, body small "Find your next look".
  2) Category-pill horizontal scroll (existing component): nails, hair, skin, lashes, brows, massage, makeup, barber, waxing, spa.
  3) "Continue your booking" card (if active draft) — surface white, radius large 16.
  4) Section header "Top picks near you" with link "See all".
     Horizontal scroll of service-card (existing).
  5) Section "Trending in 90210" — horizontal scroll service-card.
  6) Section "From your favorites" — horizontal scroll salon-hero-card.
  7) Promo banner (mint-fresh) "First-time bonus 10% off".
- Bottom: bottom-tab-item (existing) — Home, Explore, Bookings, Loyalty, Profile.

CONTENT (US)
- Prices in $. Distances in miles. Date pills "Today · Tomorrow · Sat Nov 8".

STATES: default, skeleton loading (3 horizontal scrollers shimmer), empty (no recs yet → "Tell us what you like" CTA → A.7.2), location-permission-denied banner top.
```

---

## SCREEN — B.2 Discover Feed

```text
SCREEN: Discover Feed     DEVICE: iPhone 14 390×844
USER JOB: Browse curated content (collections, editorials).

LAYOUT
- Header search-bar + filter chip row.
- Body: vertical feed of mixed cards:
  - Editorial cover (16:9, radius large) with title heading-3 over scrim.
  - Collection card (3 service-card thumbnails in row + title + "View collection").
  - Promo card (mint-fresh background).
  - Native ad slot (clearly labeled "Sponsored" badge — FTC disclosure).
- Pull to refresh.
STATES: default, loading skeleton, empty ("No collections yet"), error retry.
```

---

## SCREEN — B.3 Explore Search Results

```text
SCREEN: Explore Results    DEVICE: iPhone 14 390×844
USER JOB: Find salons/services matching search + filters.

LAYOUT
- Header: search-bar with active query as text + clear ✕; right "Map" toggle button.
- Sub-header: filter-button row (chips for active filters), "Sort: Recommended" tertiary button (opens sort sheet).
- Body: vertical list of service-card or salon-hero-card (toggleable list/map).
- Empty state: "No matches in 90210" + "Expand radius to 25 mi" CTA.
- Sticky bottom: result count + "Filters (3)" filter-button → opens B.4.
STATES: default (with results), loading, empty (no matches), error, location-disabled (banner).
```

---

## SCREEN — B.4 Filter Sheet

```text
SCREEN: Filter Sheet     DEVICE: bottom sheet (90% height, iPhone 14)
LAYOUT
- Drag handle 36×4 at top.
- Header "Filters" + "Reset" tertiary right.
- Sections (collapsible):
  1) Location — current ZIP + radius range-slider (1–50 mi).
  2) Service category — category-pill multi-select.
  3) Price range — range-slider $ to $$$$.
  4) Rating — rating-star-group selector (3.0+, 4.0+, 4.5+).
  5) Availability — chip-row (Today, Tomorrow, This week, Custom date).
  6) Distance — slider (already covered by 1).
  7) Amenities — chip multi-select (Parking, Walk-ins, ADA accessible, LGBTQ+ friendly).
- Sticky footer: "Apply filters (24 results)" primary button.
STATES: default, applying loader, no-results preview ("0 results — adjust filters").
ACCESSIBILITY: range-slider exposes accessibilityValue with min/max/current.
```

---

## SCREEN — B.5 Salon Profile

```text
SCREEN: Salon Profile     DEVICE: iPhone 14 390×844
USER JOB: Decide if this salon is right and start booking.

LAYOUT
- Hero: salon-hero-card (image 16:9, name heading-2 over scrim, rating, review count, distance, "Open · closes 8:00 PM").
- Sub-header sticky on scroll: tabs (Services / Staff / Reviews / Gallery / About).
- Section "Services": list of service-card grouped by category, expandable.
- Section "Staff": staff-avatar-list (horizontal scroll with name + specialty).
- Section "Reviews": rating summary + 3 latest reviews + "See all" → review list.
- Section "Gallery": gallery-carousel.
- Section "About": address (US format), phone (US format), hours (12h AM/PM), policies summary, ADA-accessible badge if applicable.
- Sticky footer (sticky-cta-bar): "Book now" primary full-width.

STATES: default, loading skeleton, error, closed-banner (warning), no-availability (CTA "Join waitlist").
```

---

## SCREEN — B.6 Service Detail

```text
SCREEN: Service Detail    DEVICE: iPhone 14 390×844
LAYOUT
- Hero image 16:9 with back chevron overlay.
- Title heading-2, duration label (e.g., "60 min"), price (USD).
- Description body.
- "Performed by" staff-avatar-list (filter to staff who do this).
- Add-ons section (chip multi-select) — each shows + price delta.
- Policies snippet (cancellation, deposit).
- Sticky footer: "Choose time" primary CTA.
STATES: default, unavailable (CTA disabled, "Currently unavailable" banner + "Notify me"), loading, error.
```

---

## SCREEN — B.7 Staff Member Detail

```text
SCREEN: Staff Detail    DEVICE: iPhone 14 390×844
LAYOUT
- Avatar 96 circle, name heading-2, specialties chip-row.
- Bio body text (collapsible to 4 lines).
- Rating + review count.
- "Services offered" list (service-card).
- Portfolio: gallery-carousel.
- Sticky CTA "Book with <name>".
STATES: default, on-leave (banner + alternative staff suggestions), loading, error.
```

---

## SCREEN — B.8 Map View (defer-eligible)

```text
SCREEN: Explore Map    DEVICE: iPhone 14 390×844
LAYOUT
- Full-bleed map with custom pins (coral-blossom for default, mint-fresh for selected).
- Top: search-bar + "List" toggle.
- Bottom: peek-card (snap to 35% / 90%) showing tapped salon as salon-hero-card mini.
- Sticky filter-button top-right.
STATES: default, loading map, location-denied (overlay with CTA), no-results-in-view (banner), error.
ACCESSIBILITY: map alternative — "Switch to list" must always be reachable.
```

---

## COMPONENTS

```text
filter-sheet — bottom sheet wrapper. Drag handle, header, scrollable body, sticky footer with primary button. Snap points 90% / 50%.

range-slider — track 4pt, thumb 24 circle coral-blossom with focus ring. Two-thumb variant. Value labels label-small. accessibilityValue exposes current range.

rating-star-group — 5 stars, fill in coral-blossom, empty stroke #B0B0B0. Sizes: 16 (compact), 20 (list), 32 (selector input). Half-star supported. accessibilityLabel "4.5 of 5 stars".

gallery-carousel — horizontal swipeable, 16:10 images, page dots at bottom, lazy-loaded. Tap → fullscreen lightbox with pinch zoom and share/save actions.

salon-hero-card — 16:9 image with bottom gradient scrim, overlaid name heading-3 white, sub-info row (rating, distance, hours), favorite icon top-right (toggle, accessibilityLabel "Save salon" / "Saved").

staff-avatar-list — horizontal scroll items: avatar 64 circle + name label-small + specialty body-small muted. Selected variant: 2px coral-blossom ring.

sticky-cta-bar — surface white, top border 1px, padding 16, full-width primary button, optional secondary tertiary inline. Bottom safe-area aware.
```

---

## Human Review Checklist

- [ ] Tokens match `design-handoff/tokens/*`.
- [ ] B.1 reuses category-pill, search-bar, service-card, bottom-tab-item from existing components.
- [ ] All 8 screens delivered (B.8 may be marked "defer to W28" if blocked).
- [ ] Filter sheet shows live result count.
- [ ] All US units (miles, $, MM/DD/YYYY, 12h AM/PM).
- [ ] ADA-accessible badge appears in salon profile when applicable.
- [ ] Sponsored content explicitly labeled (FTC-safe).
- [ ] All required states present.
- [ ] Touch targets ≥44×44; map has list fallback.
- [ ] Frames named `B-<screen>-<state>`.
