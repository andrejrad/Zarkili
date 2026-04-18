# Project Gantt Plan (Agile, Parallel Streams)

## Purpose
This Gantt chart gives an execution order and parallelization map for the full 20-week program.
It is not strict waterfall. Streams run in parallel, with dependency points and quality gates.

Assumptions:
- Week 1 start: 2026-04-20
- Weekly sprint cadence
- Continuous integration, security checks, and documentation updates throughout

## Mermaid Gantt Chart

```mermaid
gantt
  title Zarkili Multi-Tenant Program - 20 Week Agile Plan
  dateFormat  YYYY-MM-DD
  axisFormat  %d %b
  excludes    weekends

  section Program Governance
  Sprint planning and backlog grooming             :active, gov1, 2026-04-20, 140d
  Architecture and risk reviews                    :gov2, 2026-04-20, 140d
  Weekly demo and acceptance                       :gov3, 2026-04-24, 136d

  section Core Platform (Weeks 1-4)
  W1 Foundation, providers, env, CI                :crit, core1, 2026-04-20, 7d
  W2 Tenant and location core                      :crit, core2, after core1, 7d
  W3 Services and staff modules                    :crit, core3, after core2, 7d
  W4 Scheduling engine v1                          :crit, core4, after core3, 7d

  section Booking, Messaging, Loyalty (Weeks 5-8)
  W5 Booking lifecycle and admin queue             :crit, bk1, after core4, 7d
  W5.5 Multi-salon dashboard and context switcher  :crit, bk2, after bk1, 4d
  W6 Backend automations and notifications          :bk3, after bk1, 7d
  W7 Messaging and waitlist                         :bk4, after bk3, 7d
  W8 Loyalty and referrals                          :bk5, after bk4, 7d

  section Growth and Pilot Readiness (Weeks 9-12)
  W9 Reviews and moderation                         :gr1, after bk5, 7d
  W10 Segments, campaigns, activities               :gr2, after gr1, 7d
  W11 Analytics and reporting                       :gr3, after gr2, 7d
  W12 Pilot migration and hardening                 :crit, gr4, after gr3, 7d

  section Monetization and Onboarding (Weeks 13-16)
  W13 Stripe billing and Stripe Connect foundation  :crit, mon1, after gr4, 7d
  W14 Free trial lifecycle and feature gating       :crit, mon2, after mon1, 7d
  W15 Salon onboarding wizard and controls          :mon3, after mon2, 7d
  W16 Client onboarding orchestration               :mon4, after mon3, 7d

  section Marketplace and AI (Weeks 17-20)
  W17 Marketplace UX launch v1                      :mkt1, after mon4, 7d
  W18 Marketplace analytics and moderation          :mkt2, after mkt1, 7d
  W19 AI assistant and automations                  :ai1, after mkt2, 7d
  W20 AI personalization and release hardening      :crit, ai2, after ai1, 7d

  section Cross-Cutting Quality (Parallel)
  Tenant isolation and security rule checks         :qc1, 2026-04-20, 140d
  Automated tests and regression suite growth       :qc2, 2026-04-20, 140d
  Firestore indexes and performance tuning          :qc3, 2026-04-27, 133d
  Docs and runbooks updates                         :qc4, 2026-04-20, 140d
```

## How to Use With Agile Delivery
1. Treat each week block as a sprint primary objective, not a hard phase gate.
2. Pull secondary tasks in parallel from the tracking board when capacity allows.
3. Keep max 2 to 3 cards in In Progress per stream to limit context switching.
4. Re-baseline dates after each sprint review if scope shifts.

## Dependency Highlights
1. Core platform (Weeks 1-4) is a prerequisite for everything else.
2. Stripe and gating (Weeks 13-14) must finish before full monetized rollout.
3. Marketplace launch (Week 17) should precede AI personalization (Weeks 19-20).
4. Security, QA, and docs remain continuous and release-critical.

## Trello Sync Code Legend
Card titles in Trello now use this prefix format:
- [W##-CAT-###] Task title

Examples:
- [W01-ARCH-001] ...
- [W13-PAY-004] ...
- [W19-AI-002] ...

Category code map:
- ARCH: Architecture
- BE: Backend
- FE: Frontend
- FB: Firebase
- SEC: Security
- QA: QA
- OPS: DevOps
- PAY: Payments
- ONB: Onboarding
- MKT: Marketplace
- AI: AI
- LOY: Loyalty
- DOC: Documentation
- GEN: General

Automation script used:
- scripts/trello-gantt-prefix-sync.ps1
