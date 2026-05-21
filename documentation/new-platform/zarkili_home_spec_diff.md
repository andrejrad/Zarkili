# Spec update — Option B inline salon switcher
# 3 changes to `zarkili_home_tab_spec.md`

---

## Change 1 of 3
**Section:** `1.4 Element 3 — Quick Rebook Strip`  
**Find this block** (under the `**Rules**` heading):

```markdown
- Always labelled `"At [Salon Name]"` above the strip — never show this strip without the salon context label
```

**Replace with:**

```markdown
- The section header right side shows a `SalonContextChip` component — not a plain text label.
  - **Multi-salon user** (`registeredSalons.length > 1`): renders as a tappable chip — `"Glam Studio ▾"` — with a caret. Tapping opens `SalonSwitcherSheet`.
  - **Single-salon user** (`registeredSalons.length === 1`): renders as a plain non-interactive label — `"At Glam Studio"` — with no caret and no tap affordance.
- On first launch for a new multi-salon user: chip plays a single 400ms scale pulse to signal it is interactive. Never repeats after the first session.
```

---

## Change 2 of 3
**Section:** `1.5 Element 4 — Loyalty Nudge Banner`  
**Find this block** (under the `**Content rules**` heading):

```markdown
- Always include the salon name: `"340 pts · Glam Studio"` — never just `"340 pts"`. The per-salon context is essential.
```

**Replace with:**

```markdown
- The banner header row shows the points balance on the left and a `SalonContextChip` on the right.
  - **Multi-salon user**: chip renders as `"Glam Studio ▾"` (tappable, opens `SalonSwitcherSheet`). Points balance shows without salon name since the chip provides the context: `"340 pts"`.
  - **Single-salon user**: no chip. Points balance includes the salon name inline: `"340 pts · Glam Studio"`. No caret, no tap affordance.
- Never show just `"340 pts"` with no salon attribution on a single-salon setup — the salon name must always be visible somewhere on the banner.
```

---

## Change 3 of 3
**Section:** `6. API Endpoints Required`  
**Find this block:**

```markdown
GET /home/quick-rebook?userId={id}&salonId={activeSalonId}
  Response: { services: ServiceObject[], maxResults: 3 }

GET /home/loyalty-summary?userId={id}&salonId={activeSalonId}
  Response: { points: number, tier: string, nextMilestone: { name: string, pointsRequired: number } }
```

**Replace with:**

```markdown
GET /home/quick-rebook?userId={id}&salonId={activeSalonId}
  Response: { services: ServiceObject[], maxResults: 3 }

GET /home/loyalty-summary?userId={id}&salonId={activeSalonId}
  Response: { points: number, tier: string, nextMilestone: { name: string, pointsRequired: number } }
```

**And add this note directly below those two endpoints:**

```markdown
> **On salon switch:** Both endpoints fire simultaneously when `activeSalonId` changes.
> Neither endpoint is called for the next appointment card, trending, or recommended
> sections — those are unaffected by salon switching on Home.
```

---

## No other changes needed

The following are confirmed **unchanged** by this update:

| Element | Status |
|---------|--------|
| Element 1 — Greeting + header | No change — global, no salon context |
| Element 2 — Next appointment card | No change — always cross-salon |
| Element 5 — Trending near you | No change — always global |
| Element 6 — Recommended for you | No change — always global |
| Section 2 — Guest user Home | No change — no salon context for guests |
| Section 3 — Tab bar guest state | No change |
| Section 4 — Accessibility | No change — existing `SalonContextChip` a11y spec covers this |
| Section 5 — Performance targets | No change |
| Section 7 — Open decisions | No change |

---

## Shared state note (add anywhere in a comment or README)

Both chips (`SalonContextChip` in Quick Rebook header and inside the Loyalty banner) read from
and write to the same `activeSalonId` in global app state. They are two entry points to one value —
not two independent controls. Switching either chip updates both instantly. The same `activeSalonId`
is shared across Home, Bookings, and Rewards tabs.
