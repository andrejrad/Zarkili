# Batch H — Marketplace Consumer Extensions

> Consumed by **Week 28**. Builds on Marketplace v1 from Week 17.
> Always prepend the Global Design System Anchor from [`README.md`](README.md).

Screens: Marketplace post detail · Save / collection screens · Share-sheet variants · "Book this look" deep-link landing.

New components: `post-card`, `save-toggle`, `share-target-row`.

---

## SCREEN — H.1 Marketplace Post Detail

```text
SCREEN: Post Detail    DEVICE: iPhone 14 390×844
LAYOUT
- Hero gallery-carousel (1:1 or 4:5), index dots.
- Author header: salon avatar 40 + name + tertiary "Follow" toggle.
- Title heading-3 + body description.
- Tags chip-row (hashtags).
- "Book this look" primary CTA prominent (full-width, mint-fresh accent border).
- Save (heart) + Share + Comment icon row.
- Related posts horizontal scroll of post-card.
STATES: default, saved, shared toast, removed-by-moderation, error, loading.
ACCESSIBILITY: heart accessibilityLabel "Save" / "Saved".
```

## SCREEN — H.2 Save / Collections

```text
SCREENS: Saved + Collection Detail    DEVICE: iPhone 14 390×844
H.2.1 Saved (root)
- Header tabs: All saved · Collections.
- Grid 2-col of post-card thumbnails.
- "+ New collection" tile.

H.2.2 Collection detail
- Header back, collection title editable inline, kebab (rename, delete, share).
- Cover image 16:9.
- Grid of saved posts.
- Tertiary "Make collaborative".
STATES: default, empty (illustration + "Save your first look"), editing-title, sharing, error.
```

## SCREEN — H.3 Share Sheet Variants

```text
SCREEN: Share Sheet    DEVICE: bottom modal-sheet (iPhone 14)
LAYOUT
- Header "Share post".
- Top row: app contacts share-target-row (avatar + name).
- System apps row (icons).
- Action row: Copy link · Save image · Report post.
- Optional message input (label "Add a note") above send.
STATES: default, link-copied toast, sending DM, error.
```

## SCREEN — H.4 "Book This Look" Deep-Link Landing

```text
SCREEN: Book This Look Landing    DEVICE: iPhone 14 390×844
PERSONA: Visitor following a deep link from social.
USER JOB: Land in app and immediately reach booking with the look pre-applied.

LAYOUT
- Hero image of the look.
- Heading-2 with look name.
- Auto-mapped service preview card → tap leads to C.1 with service preselected.
- "Find similar near you" CTA → B.3.
- Auth gate banner if signed out: "Sign in to book — or continue as guest".
STATES: matched (service available), unmatched (suggest similar), unauthenticated (guest path), expired-link, error.
```

---

## COMPONENTS

```text
post-card — square or 4:5 image; bottom overlay scrim; title heading-3 white; save heart top-right 44×44 (tap toggle). Loading state shimmer.

save-toggle — heart icon 24 with 44×44 hit slot; default outline, active filled coral-blossom. Toast on first save: "Added to Saved". accessibilityValue "Saved" / "Not saved".

share-target-row — avatar 40 + name body + tertiary "Send" icon-button right. Selected state shows checkmark in mint-fresh.
```

---

## Human Review Checklist

- [ ] All 4 screens + 3 components delivered.
- [ ] "Book this look" CTA reaches Booking flow C.1 with service preselected.
- [ ] Auth gate gracefully supports guest path C.10.
- [ ] Touch targets ≥44×44 (heart icon hit slop).
- [ ] All required states delivered.
- [ ] Frames named `H-<screen>-<state>`.
