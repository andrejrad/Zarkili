# Pilot Go-Live Validation Pack

**Version**: 1.0 — Week 12  
**Owner**: Zarkili Engineering  
**Pilot tenant**: Zara Salon (`tenant-zara`)

---

## Part 1 — Pre-Launch E2E Checklist

All items below must show ✅ before the pilot goes live. Update status in-place.

### 1.1 Infrastructure
| # | Item | Status | Verified by | Date |
|---|---|---|---|---|
| I-01 | Firebase project in production mode (billing enabled) | ☐ | | |
| I-02 | Firestore region set to `europe-west1` (or agreed region) | ☐ | | |
| I-03 | Cloud Functions deployed and health check passes | ☐ | | |
| I-04 | PITR enabled on Firestore database | ☐ | | |
| I-05 | GCS backup bucket created; daily export Cloud Scheduler job active | ☐ | | |
| I-06 | Firebase App Check enabled for production app | ☐ | | |
| I-07 | Custom domain configured (if applicable) | ☐ | | |
| I-08 | SSL certificate valid and auto-renewing | ☐ | | |

### 1.2 Security
| # | Item | Status | Verified by | Date |
|---|---|---|---|---|
| S-01 | `firestore.rules` deployed — no `allow read, write: if true` present | ☐ | | |
| S-02 | Firebase Auth — email enumeration protection enabled | ☐ | | |
| S-03 | Firebase Auth — multi-factor auth configured for tenant_owner accounts | ☐ | | |
| S-04 | SECURITY_RULES_FINAL.md confirms all collections covered | ☐ | | |
| S-05 | API keys in Firebase Console restricted to production app bundle | ☐ | | |
| S-06 | `npm audit` returns 0 HIGH or CRITICAL vulnerabilities | ☐ | | |
| S-07 | No secrets in Git history (`git log -S 'FIREBASE_API_KEY'` returns nothing) | ☐ | | |

### 1.3 Data Migration (Zara)
| # | Item | Status | Verified by | Date |
|---|---|---|---|---|
| M-01 | `runZaraMigration` executed against production Firestore | ☐ | | |
| M-02 | MigrationSummary: `overallStatus == "success"` | ☐ | | |
| M-03 | MigrationSummary: `users.mismatches == []` | ☐ | | |
| M-04 | MigrationSummary: `bookings.errors == []` | ☐ | | |
| M-05 | Verified 5 sample bookings exist in Firestore with correct `tenantId` | ☐ | | |
| M-06 | Verified loyalty balances match source system for 3 sample clients | ☐ | | |
| M-07 | Migration re-run (idempotency test): second run shows 0 creates | ☐ | | |

### 1.4 Functional Smoke Tests
| # | Item | Status | Verified by | Date |
|---|---|---|---|---|
| F-01 | Zara owner can sign in and access Salon Dashboard | ☐ | | |
| F-02 | Staff member can view their schedule | ☐ | | |
| F-03 | Client can book an appointment end-to-end | ☐ | | |
| F-04 | Client cannot see another tenant's data | ☐ | | |
| F-05 | Completed booking credits loyalty points correctly | ☐ | | |
| F-06 | Analytics reports load for `tenant_admin` role | ☐ | | |
| F-07 | Analytics returns FORBIDDEN for `technician` role | ☐ | | |
| F-08 | Export produces valid CSV for last 30 days | ☐ | | |
| F-09 | Cancellation within window succeeds; outside window rejected | ☐ | | |
| F-10 | Review submission works; shows `pending_moderation` status | ☐ | | |

### 1.5 Performance
| # | Item | Status | Verified by | Date |
|---|---|---|---|---|
| P-01 | Cold-start Cloud Function response < 3 s | ☐ | | |
| P-02 | Booking creation (warm) < 1 s end-to-end | ☐ | | |
| P-03 | Retention report loads < 5 s for 1,000-booking dataset | ☐ | | |
| P-04 | No unbounded Firestore queries (all queries use `where` or date range) | ☐ | | |

---

## Part 2 — Release Signoff Template

Complete this before announcing go-live.

```
PILOT GO-LIVE SIGNOFF
=====================
Date: _______________
Pilot tenant: Zara Salon (tenant-zara)
Signed off by: _______________  (Engineering Lead)
               _______________  (Product / Stakeholder)

Test suite: ___ tests passed, 0 failed, 0 TS errors
Security audit: PASSED (Week 12 audit, 0 open P0/P1 issues)
Data migration: PASSED (MigrationSummary attached)

Pre-launch checklist: [X] All items in Part 1 verified ✅
Known issues at launch: [see Part 4]

Go-live decision: [ ] GO  [ ] NO-GO

NO-GO reason (if applicable): _______________
```

---

## Part 3 — Post-Launch Monitoring (14-Day Plan)

Follow the detailed checklist in [HEALTH_CHECKS.md](./runbooks/HEALTH_CHECKS.md) Section 5.

**Summary**:
- Days 1–3: Daily full smoke tests (HEALTH_CHECKS.md 1.x sections)
- Days 3–7: Monitor KPI dashboard; check loyalty credit accuracy
- Day 7: Week-1 review with Zara salon owner
- Days 8–13: Weekly health check; dependency audit
- Day 14: Pilot review meeting — go/no-go for onboarding Salon 2

**Escalation**: Any P0/P1 → follow [INCIDENT_RESPONSE.md](./runbooks/INCIDENT_RESPONSE.md). Any P2 unresolved after 3 days → escalate to P1.

---

## Part 4 — Known Issues Register

| ID | Summary | Severity | Workaround | Target fix |
|---|---|---|---|---|
| KI-001 | `staffSchedules` collection read restricted to `tenant_owner`/`tenant_admin` only — `location_manager` cannot yet read own schedule | Low | Admin can share schedule manually | Week 14 RBAC review |
| KI-002 | `bookingSlotTokens` expiry is app-enforced only; expired tokens not automatically purged from Firestore | Low | Tokens are read-once; no user-visible impact | Week 14 |
| KI-003 | Firestore emulator rule tests not yet written for loyalty / campaigns collections | Low | Manual verification done; rules reviewed in SECURITY_RULES_FINAL.md | Week 14 |
| KI-004 | Feature flags not yet implemented — tenant-level feature toggles require code deploy | Medium | Engineering can deploy quickly; P1 response < 4 hr | Week 16 |

---

## Part 5 — Go-Live Decision Criteria

| Criterion | Pass condition |
|---|---|
| Test suite | ≥ 1,200 tests passing, 0 failures, 0 TypeScript errors |
| Security | 0 open P0/P1 security issues; `npm audit` clean |
| Data migration | `overallStatus == "success"`, 0 user mismatches, 0 booking errors |
| Smoke tests | All F-01 through F-10 items ✅ |
| On-call readiness | On-call engineer briefed on INCIDENT_RESPONSE.md and ROLLBACK_STRATEGY.md |
| Backups | GCS daily export confirmed; PITR enabled |

**Minimum bar**: All criteria must be met for GO decision. Any single failure = NO-GO until resolved.
