# Health Checks Runbook

**Version**: 1.0 — Week 12  
**Owner**: Zarkili Engineering

---

## 1. App Smoke Tests (run after every deploy)

These checks must all pass before a deploy is considered stable.

### 1.1 Authentication
- [ ] Sign up with a new email → account created, welcome email received
- [ ] Sign in with existing credentials → JWT returned, user profile loaded
- [ ] Sign out → local session cleared, subsequent API calls rejected

### 1.2 Booking Flow
- [ ] Create a booking as a client → booking doc visible in Firestore with correct `tenantId`, `staffId`, `status: "confirmed"`
- [ ] Cancel a booking → status transitions to `cancelled`, cancellation window enforced
- [ ] Staff view shows the new booking in their schedule

### 1.3 Loyalty
- [ ] Complete a booking → loyaltyState points incremented + loyaltyTransaction created
- [ ] Duplicate booking completion → idempotency key prevents double credit

### 1.4 Analytics (tenant_admin role required)
- [ ] Retention report returns data for a tenant with bookings
- [ ] `technician` role receives `FORBIDDEN` from reporting endpoints

### 1.5 Firestore Rules
- [ ] Unauthenticated read of any collection → denied (HTTP 403 in emulator)
- [ ] Client attempting to read another tenant's bookings → denied
- [ ] Tenant admin reading own tenant data → allowed

---

## 2. Daily Health Dashboard (review each working day)

Open Firebase Console → each section below and check for alerts.

| Component | What to check | Threshold |
|---|---|---|
| **Firestore reads/writes** | Operations per day | Alert if >3× previous 7-day average |
| **Cloud Functions** | Error rate per function | Alert if >1% |
| **Cloud Functions** | P99 execution time | Alert if >10 s |
| **Authentication** | Sign-in failure rate | Alert if >5% |
| **Hosting** | 4xx / 5xx rate | Alert if >2% |
| **Storage** | Bandwidth usage | Alert if >2× baseline |

---

## 3. Weekly Health Check (every Monday)

| Check | Steps | Owner |
|---|---|---|
| Test count regression | `npx jest --no-coverage` — count must not decrease | On-call engineer |
| TypeScript errors | `npx tsc --noEmit` — must return 0 errors | On-call engineer |
| GCS backup exists | `gcloud storage ls gs://zarkili-firestore-backups/daily/` — last backup < 48 hr | On-call engineer |
| Cloud Functions health | Review last 7-day error logs in Firebase Console | On-call engineer |
| Active incidents | Review `#incidents` Slack channel; close resolved items | Engineering lead |
| Dependency audit | `npm audit --audit-level=high` — no unfixed HIGH or CRITICAL | Engineering lead |

---

## 4. KPI Thresholds — Pilot Period (first 14 days post-launch)

These are the minimum acceptable metrics for the Zara pilot. If any threshold is breached for 2+ consecutive days, open a P1 incident.

| KPI | Target | Alert threshold |
|---|---|---|
| Bookings created per day | ≥ 1 | 0 bookings for 2 consecutive days |
| Booking completion rate | ≥ 80% | < 70% |
| Auth error rate | < 1% | ≥ 3% |
| Loyalty transaction success rate | 100% (idempotent) | Any uncredited transaction |
| Cloud Function p99 latency | < 5 s | > 10 s |
| Firestore daily reads | Baseline ± 50% | > 2× baseline |
| Open bug count (P0/P1) | 0 | Any open P0 or P1 > 2 hr |

---

## 5. Post-Launch Monitoring — 14-Day Checklist

| Day | Check |
|---|---|
| Day 1 | Full smoke tests; verify all bookings visible in Salon Dashboard |
| Day 2 | Confirm loyalty credits on Day 1 bookings |
| Day 3 | Review analytics reports with tenant admin; verify FORBIDDEN for non-admin |
| Day 5 | Check Firestore read/write counts vs baseline |
| Day 7 | Week 1 health dashboard review; check GCS backup completed daily |
| Day 7 | Interview pilot salon owner for UX feedback |
| Day 10 | Dependency audit (`npm audit`) |
| Day 10 | Review Cloud Function error log for past 10 days |
| Day 14 | Full pilot review meeting — go/no-go for onboarding second salon |
| Day 14 | Update KNOWN_ISSUES register in PILOT_GO_LIVE.md |

---

## 6. Monitoring Tool Quick Links

> Replace `PROJECT_ID` with the actual Firebase project ID.

| Tool | URL |
|---|---|
| Firebase Console | https://console.firebase.google.com/project/PROJECT_ID |
| Firestore usage | https://console.firebase.google.com/project/PROJECT_ID/firestore/usage |
| Cloud Functions logs | https://console.firebase.google.com/project/PROJECT_ID/functions/logs |
| Authentication metrics | https://console.firebase.google.com/project/PROJECT_ID/authentication/users |
| GCS backups | https://console.cloud.google.com/storage/browser/zarkili-firestore-backups |
| Firebase Status | https://status.firebase.google.com |

---

## 7. Automated Alerting Setup (recommended pre-launch)

### 7.1 Cloud Functions error rate alert
```bash
gcloud alpha monitoring policies create \
  --display-name="Cloud Functions >1% Error Rate" \
  --condition-filter='resource.type="cloud_function" AND metric.type="cloudfunctions.googleapis.com/function/execution_count" AND metric.labels.status!="ok"' \
  --condition-threshold-value=0.01 \
  --notification-channels=CHANNEL_ID
```

### 7.2 Firestore read spike alert
Set up a budget alert in Google Cloud Console → Billing → Budgets to catch unexpected read spikes that could indicate a runaway query.
