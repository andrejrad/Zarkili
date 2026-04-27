# Incident Response Runbook

**Version**: 1.0 — Week 12  
**Owner**: Zarkili Engineering  
**Last updated**: Week 12  

---

## Severity Definitions

| Level | Definition | Response window | Example |
|---|---|---|---|
| **P0** | Complete service outage; all users affected; revenue impact | 15 min acknowledgement, 2 hr resolution target | Firebase unreachable, auth broken |
| **P1** | Critical feature broken for a significant user group | 1 hr acknowledgement, 4 hr resolution target | Bookings cannot be created for all salons |
| **P2** | Feature degraded; workaround exists | 4 hr acknowledgement, next business day resolution | Analytics report 504 timeout |

---

## P0 — Complete Outage Playbook

### 1. Acknowledge (< 15 min)
1. Confirm alert source (monitoring dashboard, user report, Firebase Status at https://status.firebase.google.com).
2. Post in `#incidents` Slack channel: `P0 declared — [system] down — investigating`.
3. Assign incident commander (on-call engineer).

### 2. Diagnose (< 30 min)
```
Firebase Console → Project Overview → check Firestore / Auth / Functions status
Firebase Console → Functions → Logs → filter last 30 min for ERROR level
App monitoring → check crash rate, auth success rate
Check recent deployments in Firebase Console → Hosting → Release History
```

**Common P0 causes and checks:**

| Symptom | Check |
|---|---|
| All API calls 403 | `firestore.rules` syntax error or Cloud Functions config |
| Auth fails for all users | Firebase Auth quota or config issue |
| All Cloud Functions timeout | Cold start overload; check memory/timeout settings |
| App crashes on launch | Bad release; check Hosting → Rollback option |

### 3. Contain
- If triggered by a deployment: **roll back immediately** (see [ROLLBACK_STRATEGY.md](./ROLLBACK_STRATEGY.md)).
- If Firestore rules broken: restore last working rules from Git, redeploy: `firebase deploy --only firestore:rules`.
- If Cloud Function error: `firebase deploy --only functions:<fnName>` with the previous version.

### 4. Communicate
- Notify affected salon owners via email within 30 min.
- Update Firebase Hosting status page or internal dashboard.
- Post status updates every 30 min until resolved.

### 5. Resolve & Post-Mortem
- Verify resolution with smoke tests (see [HEALTH_CHECKS.md](./HEALTH_CHECKS.md)).
- Write post-mortem within 48 hr (5 Whys, timeline, corrective actions).
- Append incident to incident log in this file (Section 6).

---

## P1 — Critical Feature Broken Playbook

### 1. Acknowledge (< 1 hr)
1. Post in `#incidents`: `P1 declared — [feature] broken — investigating`.
2. Identify component: auth, bookings, loyalty, analytics, campaigns.

### 2. Diagnose
```
Firebase Console → Firestore → Data — check if expected documents exist
Firebase Console → Functions → Logs — filter by function name and ERROR
Local env → npx jest --testPathPattern="affected domain" — confirm test state
```

**Common P1 scenarios:**

| Feature | Common cause | Resolution path |
|---|---|---|
| Bookings not saving | Firestore write rules too restrictive | Review `bookings` rules; check tenantId in payload |
| Loyalty not crediting | Cloud Function not triggered | Check booking status trigger in `functions/src/index.ts` |
| Staff can't log in | TenantUser doc missing or wrong role | Check `tenantUsers/{tenantId}_{uid}` document |
| Campaign send failures | SendGrid config / quota | Check Cloud Function env vars in Firebase Console |

### 3. Mitigate
- Isolate to a single tenant if possible; toggle tenant's feature flag as temporary disable.
- If data corruption is suspected, halt writes to affected collection before further diagnosis.

### 4. Resolve
- Apply fix to a staging environment first; verify with integration tests.
- Deploy fix: `firebase deploy --only functions` or `firestore:rules`.
- Run smoke tests to confirm resolution.

### 5. Post-Mortem
- Same as P0 but within 5 business days.

---

## P2 — Feature Degraded Playbook

1. Log in `#incidents`: `P2 — [feature] degraded — [workaround if any]`.
2. Triage during next working session.
3. Check if issue is a known limitation in the backlog.
4. If new: create bug ticket with steps to reproduce, expected vs actual, logs.
5. Schedule fix in the next sprint planning.

---

## Escalation Matrix

| Severity | On-call engineer | Engineering lead | Stakeholder |
|---|---|---|---|
| P0 | Immediate | Immediate | < 30 min |
| P1 | Immediate | < 1 hr | < 4 hr |
| P2 | Next business day | Not required unless prolonged | Not required |

---

## Communication Templates

### P0 User-facing notification
> We are currently experiencing a service disruption affecting [Zarkili / your salon]. Our team is actively investigating and working to restore service. We will provide an update within 30 minutes. Apologies for the inconvenience.

### P0 Internal update
> P0 UPDATE [HH:MM] — [status: investigating / contained / resolving]. ETA for resolution: [X hr]. Actions taken: [list]. Next update: [HH:MM].

---

## Section 6 — Incident Log

| Date | Severity | Summary | Duration | Root cause | Preventive action |
|---|---|---|---|---|---|
| _example_ | P1 | Bookings 403 after rules deploy | 45 min | Syntax error in firestore.rules | Added rules lint step to CI |
