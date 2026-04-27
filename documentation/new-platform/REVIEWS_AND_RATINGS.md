# Reviews & Ratings

## Overview

The Reviews & Ratings feature allows customers to leave star ratings (1–5) and optional written feedback after a completed appointment. Reviews go through an admin moderation queue before being published, and aggregated ratings are displayed on staff and location profiles.

---

## Domain Model

**Collection path**: `tenants/{tenantId}/reviews/{reviewId}`

### Review document schema

| Field | Type | Description |
|-------|------|-------------|
| `reviewId` | `string` | Firestore document ID |
| `tenantId` | `string` | Owning tenant |
| `locationId` | `string` | Location where appointment took place |
| `staffId` | `string` | Staff member who performed the service |
| `bookingId` | `string` | The booking this review is for (used for duplicate prevention) |
| `customerId` | `string` | Customer who submitted the review |
| `rating` | `number` | Integer 1–5 |
| `comment` | `string \| null` | Optional free-text comment |
| `status` | `ReviewStatus` | See lifecycle below |
| `createdAt` | `Timestamp` | Submission time |
| `updatedAt` | `Timestamp` | Last updated time |
| `moderatedBy` | `string \| null` | Admin who performed the moderation action |
| `moderatedAt` | `Timestamp \| null` | When moderation was performed |
| `moderationReason` | `string \| null` | Optional reason recorded by moderator |

### Status lifecycle

```
pending_moderation → published
pending_moderation → hidden
pending_moderation → rejected
published          → hidden
published          → rejected
hidden             → published
hidden             → rejected
rejected           → published
```

---

## Error codes

| Code | When |
|------|------|
| `NOT_ELIGIBLE` | Booking is not completed, or the customer ID does not match the booking |
| `ALREADY_REVIEWED` | A review for the same `bookingId` already exists |
| `NOT_FOUND` | The review document does not exist during moderation |
| `INVALID_RATING` | Rating is not an integer in the range 1–5 |
| `INVALID_TRANSITION` | The requested moderation status is not an allowed transition from the current status |

---

## Repository API

```typescript
createReviewRepository(db: Firestore): ReviewRepository
```

### Methods

#### `createReview(input, bookingSnapshot)`
Submits a new review.
- **Eligibility guard**: `bookingSnapshot.status === "completed"` and `bookingSnapshot.customerId === input.customerId`
- Throws `NOT_ELIGIBLE`, `ALREADY_REVIEWED`, or `INVALID_RATING`
- Sets `status: "pending_moderation"`, all moderation fields to `null`

#### `getBookingReview(tenantId, bookingId)`
Returns the review for a specific booking, or `null` if none exists.

#### `listStaffReviews(tenantId, staffId, status?)`
Lists reviews for a staff member. Default status filter: `"published"`.

#### `listLocationReviews(tenantId, locationId, status?)`
Lists reviews for a location. Default status filter: `"published"`.

#### `moderateReview(input)`
Transitions a review to a new status with an optional reason.
- Throws `NOT_FOUND` if review does not exist
- Throws `INVALID_TRANSITION` if the transition is not allowed

#### `getStaffRatingAggregate(tenantId, staffId)`
Returns `{ averageRating, reviewCount }` for all **published** reviews of a staff member.

#### `getLocationRatingAggregate(tenantId, locationId)`
Returns `{ averageRating, reviewCount }` for all **published** reviews of a location.

---

## UI Components

### Client-facing (`src/app/reviews/ClientReviewScreens.tsx`)

| Component | Purpose |
|-----------|---------|
| `StarRatingInput` | Interactive 1–5 star picker |
| `StarRatingDisplay` | Read-only star display |
| `ReviewPromptBanner` | Post-appointment CTA; hides itself once a review exists |
| `ReviewSubmitForm` | Rating + comment + submit; manages own input state |
| `ReviewSuccessView` | Confirmation shown after successful submission |

### Admin-facing (`src/app/reviews/AdminModerationScreens.tsx`)

| Component | Purpose |
|-----------|---------|
| `ReviewModerationList` | Tabbed list: Pending / Published / Archived |
| `ReviewCard` | Displays a review with Publish / Hide / Reject action buttons |
| `RatingAggregateCard` | Shows average rating + count; handles zero-state and loading |

---

## Tests

| Test file | Count | Scope |
|-----------|-------|-------|
| `src/domains/reviews/__tests__/repository.test.ts` | 39 | Domain model helpers + repository methods |
| `src/app/reviews/__tests__/ReviewScreens.smoke.test.tsx` | 34 | Client and admin UI components |

---

## Integration guide

1. After a completed booking, call `getBookingReview(tenantId, bookingId)` to determine eligibility.
2. Render `ReviewPromptBanner` with the result — it shows the CTA when `existingReview === null`.
3. When the customer taps "Write a Review", show `ReviewSubmitForm`.
4. On submit, call `createReview(input, bookingSnapshot)` and on success render `ReviewSuccessView`.
5. In the admin panel, fetch reviews by status and render `ReviewModerationList`.
6. Wire moderator action buttons to `moderateReview(input)`.
7. Display `RatingAggregateCard` on staff/location profile pages, feeding data from `getStaffRatingAggregate` or `getLocationRatingAggregate`.
