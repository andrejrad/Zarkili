# 08 — Design Handoff Assets

**Purpose:** catalogue every Figma-to-development asset in `design-handoff/`, explain the token → code mapping, and give a developer the fastest path to implementing a new screen from spec.

Authoritative manifest: [HANDOFF_MANIFEST.md](../../design-handoff/HANDOFF_MANIFEST.md)  
Accessibility requirements: [ACCESSIBILITY_GUIDE.md](../../design-handoff/ACCESSIBILITY_GUIDE.md)

---

## 1. Folder layout

```
design-handoff/
├── HANDOFF_MANIFEST.md          Master index of all deliverables
├── ACCESSIBILITY_GUIDE.md       WCAG 2.1 AA rules + React Native impl patterns
├── README.md                    Quick-start guide
├── tokens/                      Design tokens (JSON)
│   ├── colors.json
│   ├── typography.json
│   └── spacing.json
├── assets/
│   ├── icons/                   24 SVG category icons (12 × 2 sizes)
│   └── images/                  Reference imagery
├── fonts/                       Manrope font files
├── strings/
│   └── en-US.json               Full English string table
├── components/                  23 component specs (JSON)
├── specs/                       19 screen specs (JSON)
│
├── batch-l/                     Iterative batches — each mirrors the root structure
├── batch-m/                     (tokens, components, specs, strings)
├── batch-o/
├── batch-p/
├── batch-q/
├── batch-r/
└── batch-s/
```

The **root-level** `tokens/`, `components/`, `specs/`, `strings/` are the **aggregate production set** — the place to read first. Batch folders preserve the orginal delivery per Figma sprint.

---

## 2. Design tokens

Three files under `design-handoff/tokens/`. Imported directly into `src/shared/theme/`.

### 2.1 Colours (`colors.json`)

| Category | Examples |
|----------|---------|
| **Brand** | Primary (Coral Blossom) `#E3A9A0` · Secondary (Warm Oat) `#D1BFB3` · Background (Cream Silk) `#F2EDDD` · Accent (Mint Fresh) `#BBEDDA` |
| **Semantic / neutral** | Foreground `#1A1A1A` · Text Muted `#6B6B6B` · Border `#E5E0D1` · Success `#4CAF50` · Error `#F44336` · Warning `#FF9800` |
| **States** | Hover `#D99A90` · Pressed `#CF8B80` · Selected `#E3A9A0` · Disabled `#B0B0B0` |
| **Opacity variants** | Defined in token file — use semantic aliases in code, never raw hex |

**Usage in code:**

```typescript
// src/shared/theme/index.ts
import colors from '../../../design-handoff/tokens/colors.json';
export const theme = {
  colors: colors.colors.semantic,
  // ...
};
```

### 2.2 Typography (`typography.json`)

Font family: **Manrope** (Google Fonts, open-source). Loaded via `expo-font` + `@expo-google-fonts/manrope`.

| Style | Size | Weight | Line height | Use |
|-------|------|--------|-------------|-----|
| heading-1 | 32px | 600 | 40px | Page titles |
| heading-2 | 24px | 600 | 32px | Section headers |
| heading-3 | 20px | 600 | 28px | Subsection headers |
| heading-4 | 18px | 600 | 24px | Card titles |
| body | 14px | 400 | 20px | Default text |
| body-small | 12px | 400 | 16px | Captions |
| label | 14px | 500 | 20px | Buttons, tabs |
| label-small | 12px | 500 | 16px | Badges |

### 2.3 Spacing (`spacing.json`)

Grid: **4pt base**. Steps: 0, 4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 64, 80, 96.

Semantic names:

| Name | Value | Use |
|------|-------|-----|
| `page.horizontal` | 16px | Screen edge padding |
| `page.vertical` | 24px | Top / bottom padding |
| `section.gap` | 24px | Between page sections |
| `element.gap` | 12px | Between list items |
| `touchTarget.min` | 44px | Minimum hit area (see §6) |

Border radius: small/chips 8px · medium/buttons 12px · large/cards 16px · 2xl/prominent 24px · full/pills 9999px.

---

## 3. Icon system

Location: `design-handoff/assets/icons/`

- **12 service categories** × **2 sizes** (24px, 20px) = 24 SVG files
- All use `currentColor` — tint at runtime with no additional assets

Categories: nails, hair, skin, lashes, brows, massage, makeup, barber, waxing, spa, injectables, wellness

**Naming convention:** `icon-category-{name}-outline-{size}.svg`

**Usage pattern:**

```typescript
import NailsIcon from 'design-handoff/assets/icons/icon-category-nails-outline-24.svg';

<NailsIcon
  color={isActive ? theme.colors.primary : theme.colors.textMuted}
  width={24}
  height={24}
/>
```

Requires: `react-native-svg` (already in `package.json`). For PNG conversion if needed: follow `PNG_EXPORT_GUIDE.md` inside the icons folder — PNG is intentionally deferred for the v1 React Native build.

---

## 4. Component specs

23 JSON files under `design-handoff/components/`. Each file specifies layout, state-specific styling, transition specs, accessibility requirements, and code examples.

| Component | File | States |
|-----------|------|--------|
| Category Pill | `category-pill.json` | default, selected, pressed, disabled |
| Service Card | `service-card.json` | default, pressed, loading, error |
| Calendar Grid | `calendar-grid.json` | default, today, selected, disabled, holiday, pressed |
| Time-Slot Chip | `time-slot-chip.json` | default, selected, disabled, pressed |
| Progress Ring | `progress-ring.json` | default, loading, empty, error, disabled |
| Tier Badge | `tier-badge.json` | bronze, silver, gold, platinum, locked, pressed, selected |
| Reward Card | `reward-card.json` | unlocked, pressed, locked, redeemed, expired, loading, error, compact |
| Rating Selector | `rating-selector.json` | default-32, default-24, hovered, selected, pressed, disabled, error, readonly |
| Photo Upload Tile | `photo-upload-tile.json` | empty, pressed, filled, uploading, error, disabled, max-reached |
| Search Bar | `search-bar.json` | |
| Filter Button | `filter-button.json` | |
| Chip | `chip.json` | |
| Badge | `badge.json` | |
| Bottom Tab Item | `bottom-tab-item.json` | |
| Client Header | `client-header.json` | |
| Currency Input | `currency-input.json` | |
| Payment Method Row | `payment-method-row.json` | |
| Queue Card | `queue-card.json` | |
| Receipt Line Item | `receipt-line-item.json` | |
| Staff Calendar Grid | `staff-calendar-grid.json` | |
| AI Chat Composer | `ai-chat-composer.json` | |
| AI Suggestion Card | `ai-suggestion-card.json` | |
| Tip Preset Chip Group | `tip-preset-chip-group.json` | |

---

## 5. Screen specs

19 screen JSON files under `design-handoff/specs/`, plus 1 interaction spec. Each screen spec includes layout hierarchy, spacing redlines, safe-area behaviour, scroll config, sticky elements, loading/empty/error variants, and responsive breakpoints.

### 5.1 Consumer screens (root `specs/`)

| Screen | File |
|--------|------|
| Explore | `screen-explore.json` |
| Home | `screen-home.json` |
| Welcome | `screen-welcome.json` |
| Booking — Date Picker | `screen-booking-date-picker.json` |
| Booking — Time Picker | `screen-booking-time-picker.json` |
| Loyalty Landing | `screen-loyalty-landing.json` |
| Booking History | `screen-booking-history.json` |
| Add Payment Method | `screen-add-payment-method.json` |
| Saved Payment Methods | `screen-saved-payment-methods.json` |
| Receipt | `screen-receipt.json` |
| Refund Status | `screen-refund-status.json` |
| Tipping | `screen-tipping.json` |
| Client Lookup | `screen-client-lookup.json` |
| Client Detail | `screen-client-detail.json` |
| Client Notes / History | `screen-client-notes-history.json` |
| Queue | `screen-queue.json` |
| Staff Calendar | `screen-staff-calendar.json` |
| Staff Today | `screen-staff-today.json` |
| Interactions | `interactions.json` (all UI patterns + animation specs) |

### 5.2 Batch delivery specs (batch-m → batch-s)

Each batch folder mirrors the root structure and contains specs for additional screens delivered in that design sprint.

**batch-l** — *No sub-folder listing; mirrors root token/component/spec structure*

**batch-m** (admin billing & store):
AdminFirstRunTour, AdminPaymentMethod, BrandSettings, BusinessProfileSettings, CancelSubscription, ConnectHealthStatus, DomainSettings, InvoiceHistory, LegalDocumentsSettings, OperatorNotificationCenter, OwnerHomeKpiDashboard, OwnerNotificationPreferences, PayoutHistory, PrintPdfLayoutSpec, RefundDisputeAdmin, StripeConnectOnboarding, SubscriptionPlanSelection, TaxSettings, TenantSettingsShell

**batch-o** (booking ops):
BlockTime, BookingDetailAdmin, CancelBooking, ConflictResolver, DragReschedule, ForceBook, ManualBooking, MasterCalendar, NoShow, Rebook, RecurringBooking

**batch-p** (CRM, loyalty, campaigns):
AbVariant, ActivityCatalog, AiContentApprovalQueue, BlockClient, CampaignCreate, CampaignList, CampaignPerformanceDashboard, ClientDetail, ClientListFilters, ClientList, GdprExport, LoyaltyConfig, LoyaltyPerformanceDashboard, ManualPointAdjustment, MergeClients, MultiChannelTemplateEditor, PreSendCompliance, RewardCatalogEditor, SegmentBuilder, TransactionalTemplateEditor

**batch-q** (messaging, waitlist, reviews):
AutoReplySchedule, BlockFromInbox, CannedReplies, ConvertWaitlist, InboxTriage, MessageArchive, ModerationAction, ReplyComposer, ReputationSummary, ReviewQueue, ReviewRequestRules, ThreadAssignment, WaitlistAdmin, WaitlistPolicies

**batch-r** (analytics, AI):
AiAuditLog, AiBudgetConfig, AiSuggestionReviewQueue, AiToggles, AiUsageAnalytics, AntiTheftCompliance, AuditLogExplorer, BookingFunnel, ClientRetentionCohort, CustomReportBuilder, ExportRbac, MarketplaceAttribution, MarketplacePostComposer, PerPostPerformance, PrintReportPreview, RevenueDashboard, ScheduledReport, StaffProductivity

**batch-s** (platform super-admin — W49):
Components: command-palette-overlay, destructive-confirm-with-reason, feature-flag-toggle-row, impersonation-banner, migration-runner-step-view  
Screens: AdminDeviceManagement, AdminSignIn, AIBudgetOverrides, BackupRestore, BulkActionConfirm, CommandPalette, ConsentPolicyVersionLog, CrossTenantAnalytics, DataExportRequest, DestructiveActionConfirm, FeatureFlagConsole, GeneralAuditLog, ImpersonationFlow, IncidentResponse, MarketplaceModeration, MigrationRunner, PlatformAuditLog, PlatformHealthDashboard, PricingPlanManagement, RoleDenied, SecurityEvents, SupportInbox, SuspendTenant, TenantDirectory, ViewAsClient

---

## 6. Accessibility requirements (summary)

Full detail: [ACCESSIBILITY_GUIDE.md](../../design-handoff/ACCESSIBILITY_GUIDE.md). Standard: **WCAG 2.1 Level AA**.

| Rule | Value |
|------|-------|
| Minimum touch target | 44×44 pt |
| Recommended touch target | 48×48 pt |
| Icon-only button minimum | 44×44 pt (use `hitSlop` if visual is smaller) |
| Tab bar items | 44×64 pt |
| Target spacing | 8 pt minimum; 12–16 pt recommended |
| Text contrast (<18px regular) | ≥ 4.5:1 |

```typescript
// Correct pattern for 20px icon in a 44pt target
<TouchableOpacity
  hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
  accessibilityRole="button"
  accessibilityLabel="Favourite"
>
  <HeartIcon size={20} />
</TouchableOpacity>
```

---

## 7. String table

`design-handoff/strings/en-US.json` — full English string catalogue covering navigation, screen content, category names, filter labels, messages, accessibility labels, truncation rules, and error messages. Structured for localization.

```typescript
import strings from '../../design-handoff/strings/en-US.json';
const placeholder = strings.strings.explore.searchPlaceholder;
// "Search services, salons..."
```

---

## 8. How to implement a new screen from spec

1. Open the matching JSON from `design-handoff/specs/` (or the relevant batch folder).
2. Map every spacing value to the nearest token from `spacing.json` (do not use magic numbers).
3. Map every colour to the semantic alias from `colors.json` (do not use raw hex in code).
4. For typography, use the named text style from `typography.json`.
5. For icons, import the SVG directly and pass `currentColor` via the `color` prop.
6. Verify all touch targets meet 44pt minimum (use `hitSlop` when the visual is smaller).
7. Add `accessibilityRole`, `accessibilityLabel`, `accessibilityHint` per the component spec's accessibility section.
8. Check the `interactions.json` spec if the screen has animations or haptics.

---

## 9. Relationship to code

| Design layer | Code location |
|---|---|
| `tokens/colors.json` | `src/shared/theme/colors.ts` (or theme index) |
| `tokens/typography.json` | `src/shared/theme/typography.ts` |
| `tokens/spacing.json` | `src/shared/theme/spacing.ts` |
| `assets/icons/` | `src/shared/ui/icons/` (wrapped SVG components) |
| `components/*.json` | `src/shared/ui/` or per-domain component |
| `specs/screen-*.json` | `src/app/` screen file matching the route |
| `strings/en-US.json` | `src/shared/i18n/` (if i18n is wired) |

If the code and the spec disagree, the spec wins. File a DEBT entry and align the code.
