# Marketplace Domain — Technical Specification

## Overview

The Marketplace is an optional discovery surface where salon profiles and posts
are visible to prospective customers browsing the platform. Salons fully control
their visibility and can opt out at any time.

**Anti-client-theft guard**: When a customer is browsing within a specific
salon's context (arrived via that salon's booking link), no competitor profiles
are surfaced. This is enforced at the data layer via `isCompetitorRecommendationAllowed`
and `filterVisibleProfiles`.

---

## Entities

### SalonPublicProfile
Stored at `tenants/{tenantId}/marketplaceProfile/{tenantId}`.

| Field          | Type       | Description                                      |
|----------------|------------|--------------------------------------------------|
| `tenantId`     | string     | Owning tenant                                    |
| `name`         | string     | Displayed salon name                             |
| `tagline`      | string     | Short marketing tagline                          |
| `bio`          | string     | Longer description                               |
| `serviceTags`  | string[]   | Curated service tags for discovery               |
| `styleTags`    | string[]   | Aesthetic style tags                             |
| `bookingUrl`   | string?    | Public direct booking link                       |
| `city`         | string?    | City for geo-search                              |
| `countryCode`  | string?    | ISO 3166-1 alpha-2                               |

### MarketplacePost
Stored at `tenants/{tenantId}/marketplacePosts/{postId}`.

| Field                      | Type     | Description                                   |
|----------------------------|----------|-----------------------------------------------|
| `postId`                   | string   | Auto-generated                                |
| `title`                    | string   | Post headline                                 |
| `description`              | string   | Post body                                     |
| `imageUrls`                | string[] | Ordered image URLs                            |
| `serviceTags`              | string[] | Service tags                                  |
| `styleTags`                | string[] | Style tags                                    |
| `bookThisLookServiceId`    | string?  | References a bookable service ("book this look") |
| `isPublished`              | boolean  | Controls visibility                           |

### MarketplaceSettings
Stored at `tenants/{tenantId}/marketplaceSettings/{tenantId}` and mirrored to
`marketplaceSettingsIndex/{tenantId}` for efficient discovery queries.

| Field            | Type             | Description                              |
|------------------|------------------|------------------------------------------|
| `visibilityMode` | VisibilityMode   | See below                                |
| `optedIn`        | boolean          | Master opt-in to marketplace feature     |

---

## Visibility Modes

| Mode                         | Search/Discovery | Direct Link |
|------------------------------|-----------------|-------------|
| `full_profile`               | ✅ Yes           | ✅ Yes      |
| `posts_only`                 | ❌ No            | ✅ Yes      |
| `hidden_search_direct_link`  | ❌ No            | ✅ Yes      |

---

## Anti-Client-Theft Guard

```typescript
// No tenant context → show all visible profiles
isCompetitorRecommendationAllowed(null)        // → true

// Browsing within salon-A's booking flow → suppress competitors
isCompetitorRecommendationAllowed("salon-A")  // → false
```

`filterVisibleProfiles(profiles, tenantContext)` applies both the visibility mode
filter and the anti-client-theft rule in a single pass.

---

## Repository API

| Method                                        | Description                               |
|-----------------------------------------------|-------------------------------------------|
| `upsertProfile(profile)`                      | Create or update salon public profile     |
| `getProfile(tenantId)`                        | Fetch public profile                      |
| `createPost(post)`                            | Create a marketplace post                 |
| `getPost(tenantId, postId)`                   | Fetch a post                              |
| `updatePost(tenantId, postId, updates)`       | Partial update                            |
| `getPublishedPosts(tenantId)`                 | Fetch published posts for a salon         |
| `upsertSettings(settings)`                    | Create or update marketplace settings     |
| `getSettings(tenantId)`                       | Fetch settings                            |
| `getVisibleProfiles(tenantContext)`           | Discovery query with anti-theft guard     |

---

## Collection Layout

```
tenants/{tenantId}/marketplaceProfile/{tenantId}
tenants/{tenantId}/marketplacePosts/{postId}
tenants/{tenantId}/marketplaceSettings/{tenantId}
marketplaceSettingsIndex/{tenantId}              ← mirrored for global discovery query
```

---

## Error Codes

| Code               | Trigger                              |
|--------------------|--------------------------------------|
| `TENANT_REQUIRED`  | Empty `tenantId` supplied            |
| `PROFILE_NOT_FOUND`| Profile not found for tenant         |
| `POST_NOT_FOUND`   | Post not found                       |
