# US-Primary Market Addendum

**Decision date:** 2026-04-25  
**Decision:** Primary target market is the United States. European Union is the secondary target market and remains a supported launch geography.  
**Scope:** This addendum captures every change to the 52-week program plan implied by US-primary positioning. It does not re-architect anything; it adjusts defaults, scope items, and decision-gate outcomes.

## Summary of Impact
- **Total program length unchanged at 52 weeks.** All changes fit inside existing weeks except multi-currency, which already had a +1 week absorption budget per the Phase 3 Group B addendum.
- **Decision gates resolved.** Several previously-open Group B gates are now answered (multi-currency = YES) so they no longer block.
- **No new phase added.** EU data-residency is post-launch backlog (Phase 4+).

## Changes by Category

### 1. Payments and monetization
| Item | Plan change | Where |
|---|---|---|
| Stripe Connect account type | Default to **Stripe Connect Express** for US salons; collect W-9 (US persons) and W-8BEN (foreign owners) at onboarding; monitor 1099-K eligibility per US tax thresholds | W13 Connect domain (no week shift; default change) |
| ACH (US) and SEPA (EU) | ACH enabled at launch for US salon SaaS billing if Stripe supports tier; SEPA added when first EU tenant onboards | W13 Billing domain |
| **Stripe Tax integration** | Add Stripe Tax to handle US state sales-tax + EU VAT in one product. Wire to checkout (SaaS billing) and to in-app salon payments where the salon's state taxes services | **W14** (Free trial + gating week) — extend Task 14.x with a Stripe Tax sub-task |
| US sales tax on salon services | Most US states do not tax personal services; some do (CT, HI, NM, SD, WV, NYC surcharge, etc.). Use Stripe Tax automatic determination per salon address | W14 + W42 reporting |
| Tipping presets | Default presets **18% / 20% / 22% / Custom** for en-US locale | W24 payments + tipping (default change only) |
| Currency | **USD primary, EUR secondary** as platform-wide defaults; per-tenant currency at salon onboarding | Multi-currency Group B → resolved YES below |
| Pricing display on marketing site | USD by default; EUR on EU locale path | W47 marketing site |

### 2. Multi-currency (Phase 3 Group B → resolved YES)
The Phase 3 Group B addendum listed multi-currency as a "decide" gate that, if YES, would absorb +1 week across W34 / W42. **It is now resolved YES.**
- **Per-location currency** with FX disclosure on receipts.
- **Multi-currency reporting** in admin analytics (W42).
- **Tenant default currency** chosen at salon onboarding (W15) from a curated list (USD, EUR initially; expand on demand).
- Stripe Connect handles cross-currency settlement; document FX margins to tenants in onboarding wizard.

### 3. Compliance and legal
| Item | Plan change | Where |
|---|---|---|
| GDPR (EU) | Already in plan; no change | W29 + W49 |
| **CCPA / CPRA (California)** | Add explicit "Do Not Sell or Share My Personal Information" toggle, right-to-know, right-to-delete, opt-out preference signals (GPC) | W29 legal/lifecycle + W49 compliance pack |
| **VCDPA (Virginia), CPA (Colorado), CTDPA (Connecticut), UCPA (Utah)** | Add to privacy controls and to public privacy notice; reuse the CCPA toggle and right-to-delete plumbing | W29 + W49 |
| **COPPA (US, children under 13)** | Add age affirmation at registration; if a service recipient is under 13, require parental-consent affirmation by the booking adult; do not create separate child accounts | W21 auth/onboarding |
| **ADA + WCAG 2.1 AA** | Cite ADA explicitly in the public accessibility statement (already-existing accessibility guide stays as the implementation reference); audit covers `SupportChatScreen` and `AdminSupportQueueScreen` | W29 + W49 + ASE accessibility re-audits |
| **TCPA (US SMS)** | Explicit prior consent before SMS appointment reminders; STOP / HELP keyword handling; opt-out wired end-to-end; quiet-hours respected per US time zone | W26 messaging/notifications/waitlist |
| **CAN-SPAM (US email)** | Sender identity, physical address in footer, one-click unsubscribe; verify SES/SendGrid templates | W26 + W47 marketing site |
| **CAN-SPAM equivalence in EU (ePrivacy / GDPR)** | Already covered by GDPR consent; no change | W29 |
| HIPAA | Not applicable (no PHI). Confirm in security whitepaper | W49 compliance pack |
| **SOC 2 Type 1** | Promote from "after launch (vague)" to a scheduled **Phase 5 workstream**, kickoff in W53. Vendor selection during W47 | W49 decision gate updated; new Phase 5 backlog item |

### 4. Localization and defaults
| Item | Plan change | Where |
|---|---|---|
| Default locale | **en-US** (currency USD, dates `MM/DD/YYYY`, time 12-hour AM/PM) | W32 i18n / store readiness |
| Secondary locale | en-GB, de-DE, hr-HR (or chosen EU set) with EUR, dates `DD/MM/YYYY`, time 24-hour | W32 |
| Time zones | All 4 contiguous US zones + AK + HI; DST transition test in booking engine | W32 hardening + W46 DR drill checks |
| Address / phone validation | Per-country at salon onboarding (W15) and client account; US ZIP + state required for US tenants | W15 + W21 |
| Holiday calendar seed | US federal holidays + state-optional toggles for salon hours and booking blackouts | W36 (calendar/master scheduling depth) |

### 5. Marketing site / GTM (Phase 3.5 W47)
- US-first messaging and copy.
- Named competitor comparison: Vagaro, Square Appointments, Booksy (US presence).
- USD pricing primary; EUR pricing on EU-locale path.
- Domain strategy: `.com` primary; EU TLD secondary (decide which when EU launch is dated).
- App-store listings: en-US primary copy and screenshots; EU localized variants follow.

### 6. Customer support (Phase 3.5 W48 + W49)
- **On-call coverage**: US East/West rotation primary; EU rotation as the secondary tier.
- **Response SLAs**: 24 business hours v1 framed against US business hours; document EU-business-hours equivalence.
- **Time-zone display in admin queue**: render ticket timestamps in operator-local TZ with US zone hints.

### 7. Data residency
- **US-default Firebase region**: `us-central1` or `us-east1`. Already the implicit default.
- **EU-residency for EU tenants**: not in scope for launch. New backlog item:
  - `B-040 — Multi-region EU tenant residency` (Phase 4+ / Phase 5).
  - Out-of-scope items added: per-tenant region selection, separate Firebase project per region, replication strategy, and Schrems-II posture documentation.
- **AI provider residency**: confirm chosen provider's EU-residency option; informational only — no plan change unless vendor switches.

## Decision Gates Resolved by This Addendum
| Gate | Origin | Resolution |
|---|---|---|
| Multi-currency (Group B) | Phase 3 | **YES** — USD primary + EUR secondary |
| SOC 2 Type 1 kickoff | Phase 3.5 W47 | **Yes, scheduled Phase 5 (W53+)** instead of vague "after launch" |
| Marketing site primary locale | Phase 3.5 W47 | **en-US** |
| Default platform currency | Phase 1.5 W14 | **USD** |
| Stripe Connect default account type | Phase 1.5 W13 | **Express** for US |

## New Trello Cards
- `[W14-PAY-009]` Wire Stripe Tax (US states + EU VAT) into checkout and in-app salon payments
- `[W21-LEG-005]` COPPA age affirmation + parental-consent text for under-13 service recipients
- `[W26-LEG-006]` TCPA SMS consent capture + STOP/HELP keyword handling + quiet hours per US time zone
- `[W26-LEG-007]` CAN-SPAM email footer audit (sender identity, physical address, one-click unsubscribe)
- `[W29-LEG-008]` CCPA/CPRA "Do Not Sell or Share" toggle + GPC opt-out signal handling
- `[W29-LEG-009]` VCDPA / CPA / CTDPA / UCPA privacy notices and reuse of CCPA right-to-delete plumbing
- `[W32-I18N-005]` en-US default locale: USD, MM/DD/YYYY, 12-hour AM/PM
- `[W32-I18N-006]` US time-zone DST transition tests (4 contiguous + AK + HI)
- `[W36-ADM-018]` US federal holidays seed + state-optional toggles for booking calendar
- `[W42-RPT-007]` Multi-currency reporting columns (per-currency revenue + FX rate snapshot)
- `[W47-MKT-005]` US-first marketing copy + competitor comparison (Vagaro, Square Appointments, Booksy)
- `[W47-MKT-006]` USD pricing primary; EUR pricing on EU-locale route
- `[W47-OPS-007]` SOC 2 Type 1 vendor selection (kickoff in Phase 5 / W53)
- `[W49-LEG-010]` Compliance pack: ADA + WCAG 2.1 AA citation; CCPA + state-privacy disclosures
- `B-040` (backlog) Multi-region EU tenant residency (Phase 4+ / Phase 5)
- `B-041` (backlog) SOC 2 Type 1 audit kickoff (Phase 5 / W53+)

## What Did NOT Change
- 52-week total program length.
- Multi-tenant + RBAC + audit + Firestore architecture.
- React Native + Expo + Firebase + Stripe stack.
- Phase sequencing (Phase 1 → 1.5 → 2.0 → 2.1 → 3 → 3.5 → 4).
- Booking, loyalty, marketplace, AI feature scope.
- Phase 2 / Phase 3 / Phase 3.5 / Phase 4 week-by-week structure (only scope items inside selected weeks were extended).

## Cross-References
- Phase 1.5 prompts: [MULTITENANT_WEEKS_13_TO_20_COPILOT_PROMPTS.md](MULTITENANT_WEEKS_13_TO_20_COPILOT_PROMPTS.md)
- Phase 2 plan: [PHASE2_CONSUMER_UI_PLAN_WEEKS_21_TO_28.md](PHASE2_CONSUMER_UI_PLAN_WEEKS_21_TO_28.md)
- Phase 3 plan + Group B addendum: [PHASE3_ADMIN_UI_PLAN_WEEKS_33_TO_44.md](PHASE3_ADMIN_UI_PLAN_WEEKS_33_TO_44.md)
- Phase 3.5 plan: [PHASE3_5_RELEASE_READINESS_PLAN_WEEKS_45_TO_48.md](PHASE3_5_RELEASE_READINESS_PLAN_WEEKS_45_TO_48.md)
- Phase 4 plan: [PHASE4_AI_SUPPORT_SYSTEM_PLAN_WEEKS_49_TO_52.md](PHASE4_AI_SUPPORT_SYSTEM_PLAN_WEEKS_49_TO_52.md)
- Master index: [MULTITENANT_MASTER_INDEX.md](MULTITENANT_MASTER_INDEX.md)
- Tracking board: [PROGRAM_TRACKING_BOARD.md](PROGRAM_TRACKING_BOARD.md)
