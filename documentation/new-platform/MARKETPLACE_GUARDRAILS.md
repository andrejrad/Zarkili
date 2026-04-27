# MARKETPLACE_GUARDRAILS.md

> Authoritative reference for the anti-client-theft and anti-commission posture
> of the Zarkili Marketplace. Last updated: Week 17.

## Why guardrails exist

The Zarkili Marketplace is a discovery surface — **not** a booking aggregator.
The platform never inserts itself between a salon and its clients. Guardrails
encode that posture into the code so it cannot drift via UX iteration.

The four guardrails:

1. **No competitor recommendations inside an active booking flow.**
2. **Salon owns the client.** Acquisition attribution is captured for
   transparency and analytics, never for ownership transfer.
3. **No commission, ever.** Platform copy must never imply per-booking fees.
4. **Visibility is salon-controlled.** A salon's marketplace presence is opt-in
   and tunable per visibility mode.

## Guardrail 1 — No competitor recommendations in booking flow

**Code**: `src/domains/marketplace/guardrailsService.ts` →
`assertNoCompetitorRecommendations(context, recommendations)`

**Rule**: Once a customer enters salon X's booking funnel (deep-link from a
post, profile, or external link with `?salon=X` style attribution), no surface
inside that funnel may suggest, link to, or recommend any salon ≠ X. This
includes "people also booked", "similar near you", "more from this stylist",
and any cross-salon carousel.

**Boundary**: The check runs at every recommendation-emitting surface that
operates inside an active booking-flow context. Outside a booking flow
(anonymous discovery, browsing the home feed), all visible profiles are fair
game — that is the marketplace's purpose.

**Failure mode**: Throws `MarketplaceError("COMPETITOR_RECOMMENDATION_BLOCKED")`
listing the offending tenant ids. The error is a hard contract violation; UI
should treat it as a bug to fix, not a user-facing error.

**Companion**: `filterToContextTenant(context, recs)` returns same-tenant recs
silently for surfaces that prefer graceful degradation.

## Guardrail 2 — Salon owns the client

**Code**: `src/domains/marketplace/guardrailsService.ts` →
`attributeAcquisition(input)` → `MarketplaceAttribution` value object.

**Rule**: When a customer books through the marketplace, attribution is
recorded so the salon can see what drove the acquisition (which post, which
profile, when). The booking salon is and remains the client's salon. The
platform never:

- Owns or claims the customer relationship
- Charges the salon a commission, fee, or revenue share for the introduction
- Hides or restricts the customer's contact details from the salon
- Cross-sells the customer to other salons after the introduction

**Storage**: Attribution rides with the booking via the `MarketplaceAttribution`
value object. Suggested location:
`tenants/{tenantId}/marketplaceAcquisitions/{bookingId}`. The booking record
itself is unmodified — attribution is a sidecar.

**Data transparency**: A salon can read every attribution record for its own
tenant, see what posts drove what bookings, and export the data on demand.

## Guardrail 3 — No commission messaging

**Code**: `src/domains/marketplace/guardrailsService.ts` →
`assertNoCommissionMessaging(text)` and `findCommissionTokens(text)`.

**Forbidden vocabulary** (case-insensitive substring match):

- `commission`
- `per-booking fee` / `per booking fee`
- `marketplace fee`
- `booking fee`
- `platform fee`
- `new client fee`
- `percentage of revenue`

**Why a token-blocklist instead of a positive-vocabulary check**: zero-commission
is the load-bearing differentiator. We need to fail loudly the moment any copy
implies otherwise — even by accident. The blocklist is auditable, easy to
extend, and case-insensitive.

**Boundary**: Run `assertNoCommissionMessaging` on:

- Marketplace post text (title + description) at write time
- CMS-published copy (email, push, in-app banners) at write time
- Marketing strings exported to translation pipelines

**Companion**: `findCommissionTokens(text)` returns the offending tokens
without throwing — useful for non-blocking lint warnings during preview.

## Guardrail 4 — Visibility is salon-controlled

**Code**: `src/domains/marketplace/model.ts` → `VisibilityMode` +
`filterVisibleProfiles`.

**Modes**:

| Mode | Search | Direct link | Posts visible |
|---|---|---|---|
| `full_profile` | yes | yes | yes |
| `posts_only` | no | profile excluded | yes |
| `hidden_search_direct_link` | no | yes | yes |

**Opt-in**: A salon's profile is invisible until `MarketplaceSettings.optedIn`
is true. There is no "default-on" toggle.

## Compliance checklist for new marketplace surfaces

When adding any surface that lists, recommends, or links to salons other than
the active booking-flow tenant, the code must:

- [ ] Accept a `BookingFlowContext` (or equivalent `tenantContext`) parameter
- [ ] Call `assertNoCompetitorRecommendations` (or its non-throwing companion)
      before rendering
- [ ] Run `assertNoCommissionMessaging` on any platform-authored copy
- [ ] Persist attribution via `attributeAcquisition` when a booking is created
      from a marketplace deep-link
- [ ] Honor `filterVisibleProfiles` when selecting profiles to display
- [ ] Add tests proving the above

## See also

- `documentation/MARKETPLACE_SPECS.md` — product spec (§6 anti-client-theft)
- `src/domains/marketplace/model.ts` — types and visibility helpers
- `src/domains/marketplace/discoveryService.ts` — feed/search/profile/deep-link
- `src/domains/marketplace/guardrailsService.ts` — enforcement primitives
