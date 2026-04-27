# Zarkili Figma Prompt Pack — Index

This pack contains **copy-pasteable prompts** for every screen and component in the 52‑week build (Phases 2 and 3). Each prompt is engineered for AI Figma tools (Figma Make / Galileo / Builder.io Visual Copilot / Magician / Uizard) and bakes in the **existing design system** delivered in [`design-handoff/`](../../design-handoff/HANDOFF_MANIFEST.md).

> **Hard rule for every prompt:** do not invent new colors, typography, spacing, or radii. Reuse the tokens from [`design-handoff/tokens/`](../../design-handoff/tokens/) and the components in [`design-handoff/components/`](../../design-handoff/components/). New components are allowed only when the batch explicitly defines them.

---

## How to use

1. Open the relevant batch file below.
2. Copy a single screen or component prompt block (between the fenced `--- PROMPT ---` markers).
3. Paste it into your AI design tool. Run it on a frame sized for one of the test devices (iPhone SE 375×667, iPhone 14 390×844, iPhone 14 Pro Max 430×932, iPad 768×1024).
4. Validate the output against the **Human Review Checklist** at the bottom of every batch file.
5. Package the approved frames per [`FIGMA_HANDOFF_TO_DEVELOPMENT_PLAYBOOK.md`](../FIGMA_HANDOFF_TO_DEVELOPMENT_PLAYBOOK.md) Phase 5.

---

## Global Design System Anchor (paste this block above every prompt if your tool needs explicit context)

```text
DESIGN SYSTEM: Zarkili v1.0.0 (do not deviate)

BRAND COLORS
- Primary       Coral Blossom    #E3A9A0   (CTAs, selected, brand accents)
- Secondary     Warm Oat         #D1BFB3   (secondary surfaces, dividers warm)
- Background    Cream Silk       #F2EDDD   (app background)
- Accent        Mint Fresh       #BBEDDA   (success/positive highlights, badges)

SEMANTIC
- Surface       #FFFFFF
- Foreground    #1A1A1A
- Text muted    #6B6B6B
- Border        #E5E0D1
- Accent fg     #2D4A42
- Success       #4CAF50
- Warning       #FF9800
- Error         #F44336
- Info          #2196F3

INTERACTION STATES
- Primary hover    #D99A90
- Primary pressed  #CF8B80
- Selected         #E3A9A0
- Disabled fg      #B0B0B0
- Disabled bg      #F5F5F5
- Overlay scrim    rgba(0,0,0,0.5)

TYPOGRAPHY (Manrope, weights 300/400/500/600)
- heading-1   32 / 40   weight 600
- heading-2   24 / 32   weight 600
- heading-3   20 / 28   weight 600
- heading-4   18 / 24   weight 500
- body        14 / 20   weight 400
- body-small  12 / 16   weight 400
- label       14 / 20   weight 500
- label-small 12 / 16   weight 500

SPACING (4pt grid)
- Allowed: 0, 4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 64, 80, 96
- Page horizontal padding: 16
- Page vertical padding:   24
- Section gap:             24
- Element gap inside group: 12
- Min touch target:        44 × 44

RADII
- small  8   (chips, tag pills)
- medium 12  (buttons, inputs)
- large  16  (cards)
- 2xl    24  (prominent / hero cards)
- full   9999 (avatars, fully rounded pills)

EXISTING REUSABLE COMPONENTS — reuse, don't redraw
- badge, bottom-tab-item, category-pill, chip, filter-button, search-bar, service-card
- Screens already shipped: welcome, home, explore (use as anchor for header/tab patterns)

ACCESSIBILITY (WCAG 2.1 AA + ADA)
- Text contrast ≥ 4.5:1 on Cream Silk background; large text ≥ 3:1.
- Every interactive element ≥ 44×44 with 8px hit slop tolerance.
- All icons paired with accessibilityLabel; decorative icons set to accessibilityElementsHidden.
- Respect prefers-reduced-motion: replace slide/fade > 200ms with instant or 100ms cross-fade.
- Dynamic type: layouts must not clip when body grows from 14 → 20.

US-PRIMARY DEFAULTS (US is launch market; EU/HR are secondary)
- Locale       en-US
- Currency     USD ($), 2 decimal places
- Date format  MM/DD/YYYY
- Time format  12-hour with AM/PM
- Phone format (XXX) XXX-XXXX
- Address      Street / Apt / City / State (2-letter) / ZIP (5 or 5+4)
- Compliance footers cite ADA + WCAG 2.1 AA

REQUIRED STATES (every screen must show)
1. Default (loaded with realistic content)
2. Loading (skeletons, no spinners over 1s)
3. Empty (friendly illustration + primary CTA)
4. Error (recoverable + retry CTA)
5. Permission / role-denied (where applicable)
6. Success / confirmation (where applicable)
```

---

## Batch Index

### Phase 2 — Consumer (Weeks 21–28)
| Batch | Title | Consumed by week | Critical path |
|---|---|---|---|
| [A](BATCH_A_AUTH_ONBOARDING.md) | Auth & Onboarding | W21 | YES |
| [B](BATCH_B_DISCOVER_EXPLORE_PROFILE.md) | Discover, Explore, Profile | W22 | YES |
| [C](BATCH_C_BOOKING_FLOW.md) | Booking Flow | W23 | YES (highest value) |
| [D](BATCH_D_PAYMENTS_TIPPING_RECEIPTS.md) | Payments, Tipping, Receipts | W24 | YES |
| [E](BATCH_E_LOYALTY_ACTIVITIES_REVIEWS.md) | Loyalty, Activities, Reviews | W25 | — |
| [F](BATCH_F_MESSAGING_NOTIFICATIONS_WAITLIST.md) | Messaging, Notifications, Waitlist | W26 | — |
| [G](BATCH_G_STAFF_APP_AI.md) | Staff App Shell + AI | W27 | — |
| [H](BATCH_H_MARKETPLACE_CONSUMER.md) | Marketplace Consumer Extensions | W28 | — |

### Phase 2.1 — Edge cases & lifecycle (Weeks 29–32)
| Batch | Title | Consumed by week | Critical path |
|---|---|---|---|
| [I](BATCH_I_LEGAL_LIFECYCLE_SETTINGS_AUTH_EDGES.md) | Legal, Lifecycle, Settings depth, Auth edges | W29–30 | — |
| [J](BATCH_J_BOOKING_PAYMENTS_DISCOVERY_EDGES.md) | Booking / Payments / Discovery edges | W30–31 | — |
| [K](BATCH_K_AI_MESSAGING_LOYALTY_MARKETPLACE_STAFF_EXTRAS.md) | AI / Messaging / Loyalty / Marketplace / Staff extras | W31–32 | — |
| [L](BATCH_L_CROSS_CUTTING_I18N_STORE_READINESS.md) | Cross-cutting, i18n, store readiness | W32 | — |

### Phase 3 — Admin (Weeks 33–44)
| Batch | Title | Consumed by week | Critical path |
|---|---|---|---|
| [M](BATCH_M_OWNER_HOME_BILLING_CONNECT.md) | Owner home, tenant settings, billing, Connect, payouts | W33–34 | YES |
| [N](BATCH_N_LOCATIONS_STAFF_SERVICES.md) | Locations, staff, service catalog depth | W35–36 | YES |
| [O](BATCH_O_BOOKING_OPS_MASTER_CALENDAR.md) | Booking ops + master calendar | W37–38 | YES (highest complexity) |
| [P](BATCH_P_CRM_LOYALTY_CAMPAIGNS_ADMIN.md) | CRM, loyalty, activities, campaigns admin | W39–40 | — |
| [Q](BATCH_Q_REVIEWS_MESSAGING_WAITLIST_ADMIN.md) | Reviews, messaging, waitlist admin | W41 | — |
| [R](BATCH_R_ANALYTICS_AI_ADMIN_MARKETPLACE.md) | Analytics, reporting, AI admin, marketplace tenant | W42–43 | — |
| [S](BATCH_S_PLATFORM_SUPER_ADMIN.md) | Platform super-admin & cross-cutting admin | W44 | — |

---

See [`_TEMPLATE.md`](_TEMPLATE.md) for the canonical prompt structure used inside every batch file.
