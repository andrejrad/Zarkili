# Batch K — AI / Messaging / Notifications / Loyalty / Marketplace / Staff Extras

> Consumed by **Weeks 31–32**.
> Always prepend the Global Design System Anchor from [`README.md`](README.md).

Topics: AI consent + feedback + explainability + history + degraded + opt-out · Messaging block/report/mute/archive/search/read receipts/typing/delivery-failure/group threads · Notifications per-channel/quiet hours/permission recovery/in-app banner · Loyalty tier-up celebration / redemption / expiry / terms · Marketplace follow/hashtag/trending/block/report/comments · Staff extras location switcher / time-off / availability override / payout / walk-in capture / daily close / staff onboarding.

New components: `ai-feedback-bar`, `explainability-sheet`, `channel-preference-matrix`, `tier-up-celebration`, `follow-toggle`, `walk-in-form`.

---

## GROUP — K.1 AI Surfaces

```text
K.1.1 AI consent / first-run explainer — full-screen onboarding card, primary "Enable AI", tertiary "Not now". Disclosure of data usage.
K.1.2 AI feedback bar — under each AI message: thumbs up/down + optional "Tell us why" sheet (categorized reasons + free-text).
K.1.3 Explainability sheet — modal-sheet "Why this suggestion?" with bullet reasoning, model name, freshness timestamp, "Report a problem".
K.1.4 AI history — list per AI conversation with timestamps; tap → restore.
K.1.5 AI degraded state — banner "AI is slow right now — basic mode active".
K.1.6 AI opt-out — settings row + confirmation modal.
States per: default, loading, error.
```

## GROUP — K.2 Messaging Extras

```text
K.2.1 Block user — destructive confirm in F.2 kebab.
K.2.2 Report message — long-press menu → form (reason picker + body).
K.2.3 Mute thread — picker (1h / 8h / 1 day / Always).
K.2.4 Archive thread — swipe + undo toast.
K.2.5 Search within messages — in-thread search bar with match highlight + nav arrows.
K.2.6 Read receipts + typing indicator — covered in F.2; expose toggle in F.5.
K.2.7 Delivery-failure retry — error chip below failed message + tap to retry.
K.2.8 Group threads (if approved) — group header with member count avatars stack.
States per: default, error.
```

## GROUP — K.3 Notifications Extras

```text
K.3.1 channel-preference-matrix — table-like layout: rows=topics, cols=Push/Email/SMS, cells=toggles.
K.3.2 Quiet hours — covered in F.5; here add weekly schedule editor (chip-row days + range).
K.3.3 Permission-denied recovery — full-bleed card "Notifications off — Enable in Settings" with deep-link CTA.
K.3.4 In-app banner pattern — top-of-screen banner variants (info/success/warning/error) sliding in (reduce-motion: instant).
States per: default, saved.
```

## GROUP — K.4 Loyalty Extras

```text
K.4.1 Tier-up celebration — full-screen overlay (mint-fresh confetti; reduce-motion: static check), heading-1 "Welcome to Gold", body benefits, CTA "See benefits".
K.4.2 Reward-redemption confirmation — covered in E.3; deliver also as toast variant.
K.4.3 Points-expiry warning — banner in E.1 "200 pts expire on MM/DD/YYYY".
K.4.4 Loyalty terms — legal-page-layout variant.
States per: default.
```

## GROUP — K.5 Marketplace Extras

```text
K.5.1 follow-toggle — pill button on profile/post, default outline, active filled coral-blossom.
K.5.2 Hashtag landing — header "#bridalnails", grid of post-card.
K.5.3 Trending feed — tab in B.2 with "Trending" label + rank chip.
K.5.4 Block author — destructive confirm.
K.5.5 Report post — form (reason + body).
K.5.6 Comments (if approved) — bottom sheet with chat-bubble variant + composer.
States: default, blocked, reported.
```

## GROUP — K.6 Staff Extras

```text
K.6.1 Location switcher — top header pill in G.1 → modal-sheet list of locations with check.
K.6.2 Time-off request — form (date range, reason, half-day toggle), status pill (Pending/Approved/Denied).
K.6.3 Availability override — date picker + per-day on/off toggle + custom hours.
K.6.4 Payout / earnings — KPI cards (today, week, month, USD) + history list with date MM/DD/YYYY.
K.6.5 walk-in-form — name, phone US format, service multi-select, est. duration, "Add to queue" CTA.
K.6.6 Daily close report — checklist + cash count + tips + send-to-owner CTA.
K.6.7 Staff onboarding — multi-step (W2/1099 disclosure, W-9 upload, direct deposit setup via Stripe Connect).
States per: default, submitting, error.
```

---

## COMPONENTS

```text
ai-feedback-bar — row under AI message: thumbs up/down 24 + "Why?" tertiary text-button. Submitted state shows checkmark + "Thanks".

explainability-sheet — modal-sheet (50% snap) with reasoning bullets, model + freshness label-small muted, "Report a problem" tertiary.

channel-preference-matrix — left column 40% topic labels; right 60% three-column toggle grid (Push/Email/SMS). Sticky column headers when scrolling.

tier-up-celebration — full-screen scrim coral-blossom-on-mint gradient, badge tier 96, heading-1 white, benefit list, primary "Continue".

follow-toggle — pill 32 height, label "Follow" / "Following" with check icon, secondary variant outline. accessibilityLabel reflects state.

walk-in-form — vertical input stack with phone mask `(XXX) XXX-XXXX`, service multi-select chips, duration stepper (15-min increments), submit primary.
```

---

## Human Review Checklist

- [ ] All 6 groups + 6 components delivered.
- [ ] AI surfaces include consent, feedback, explainability, opt-out.
- [ ] All marketing/SMS toggles default OFF.
- [ ] Reduce-motion variants for celebrations, banner slides.
- [ ] Staff onboarding includes W-9 upload + Stripe Connect direct deposit.
- [ ] Frames named `K-<screen>-<state>`.
