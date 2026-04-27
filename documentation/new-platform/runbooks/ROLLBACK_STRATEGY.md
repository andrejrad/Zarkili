# Rollback Strategy Runbook

**Version**: 1.0 — Week 12  
**Owner**: Zarkili Engineering

---

## 1. Rollback Decision Tree

```
Was the issue caused by a code deploy?
  ├─ YES → Follow Section 2 (Code Rollback)
  └─ NO → Was Firestore data mutated?
              ├─ YES (bad migration run) → Follow Section 3 (Data Rollback)
              ├─ YES (bad rules deploy) → Follow Section 4 (Rules Rollback)
              └─ NO → Diagnose in INCIDENT_RESPONSE.md
```

---

## 2. Code Rollback — Failed Deployment

### 2.1 Firebase Hosting (React Native Web / Admin UI)
```bash
# List recent releases
firebase hosting:channel:list --site=zarkili-admin

# Roll back to the previous release
firebase hosting:clone zarkili-admin:PREVIOUS_CHANNEL_ID zarkili-admin:live
```

Or via Firebase Console: Hosting → Releases → select previous release → Rollback.

### 2.2 Cloud Functions
```bash
# List deployed function versions
gcloud functions list --project=PROJECT_ID

# Re-deploy the previous version from Git
git checkout <previous-working-tag>
firebase deploy --only functions

# Verify the function is healthy
firebase functions:log --only <functionName> --tail
```

### 2.3 Package version rollback
If a bad npm package update caused the issue:
```bash
git revert <commit-hash>   # revert the package.json / lock change
npx jest --no-coverage      # confirm tests pass
firebase deploy --only functions,hosting
```

---

## 3. Data Rollback — Bad Migration Run

Use the `migrationRunId` stamped on all documents created by `runZaraMigration`.

### 3.1 Steps

```bash
# 1. Identify the bad runId from the MigrationSummary log.
#    e.g. runId = "run-2025-12-01-001"
RUNID="run-2025-12-01-001"
TENANT_ID="tenant-zara"

# 2. Run the rollback script (requires Firebase Admin SDK):
node scripts/rollbackMigration.js --runId="$RUNID" --tenantId="$TENANT_ID"
```

> See [BACKUP_RESTORE.md](./BACKUP_RESTORE.md) Section 6 for full collection list.

### 3.2 Rollback script (reference template)
```js
// scripts/rollbackMigration.js (reference — review before running in production)
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

const runId = process.argv.find(a => a.startsWith('--runId=')).split('=')[1];
const tenantId = process.argv.find(a => a.startsWith('--tenantId=')).split('=')[1];

async function deleteWhere(col, field, val) {
  const snap = await db.collection(col).where(field, '==', val).get();
  const batch = db.batch();
  snap.docs.forEach(d => batch.delete(d.ref));
  await batch.commit();
  console.log(`Deleted ${snap.size} docs from ${col}`);
}

(async () => {
  await deleteWhere('tenantUsers', 'migrationRunId', runId);
  await deleteWhere('bookings', 'migrationRunId', runId);
  await deleteWhere(`tenants/${tenantId}/loyaltyTransactions`, 'migrationRunId', runId);
  await deleteWhere(`tenants/${tenantId}/loyaltyStates`, 'migrationRunId', runId);
  // Delete tenant and location last (only if they were created in this run)
  await db.doc(`tenants/${tenantId}`).delete();
  await db.doc(`locations/${tenantId}-hq`).delete();  // adjust locationId
  console.log('Rollback complete');
})();
```

### 3.3 Verify rollback
- Check Firestore Console → each collection → confirm no docs with the rolled-back `runId`.
- Re-run baseline health checks (see [HEALTH_CHECKS.md](./HEALTH_CHECKS.md)).

---

## 4. Rules Rollback — Bad Firestore Rules Deploy

If a bad `firestore.rules` deploy breaks read/write access:

```bash
# Check current rules in Firebase Console → Firestore → Rules
# Or inspect Git history:
git log -- firestore.rules

# Restore the last known-good rules:
git checkout <last-good-commit> -- firestore.rules
firebase deploy --only firestore:rules

# Verify rules are live (takes ~30 s to propagate):
firebase firestore:rules
```

---

## 5. Staged Rollout / Feature Flags (future)

Once feature flags are implemented (planned Week 16), feature-specific rollbacks will be possible without a full deploy:
- Toggle feature flag for affected tenant(s) to disable the broken feature.
- Fix the bug, re-enable for a single pilot tenant first.
- Gradual re-enable across tenants.

---

## 6. Rollback Checklist

- [ ] Identify scope: code / data / rules
- [ ] Notify stakeholders (P0/P1 per INCIDENT_RESPONSE.md)
- [ ] Execute rollback steps above
- [ ] Run smoke tests after rollback (HEALTH_CHECKS.md — App Smoke Tests)
- [ ] Confirm affected users' functionality is restored
- [ ] Document what was rolled back and why in the incident log
- [ ] Add a prevention item to the sprint backlog
