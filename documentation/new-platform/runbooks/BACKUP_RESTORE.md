# Backup and Restore Runbook

**Version**: 1.0 — Week 12  
**Owner**: Zarkili Engineering  
**Platform**: Firebase / Cloud Firestore (managed service, multi-region)

---

## 1. Firebase Built-in Data Protection

Firestore is a fully managed, geo-redundant database. Google guarantees:
- **Automatic replication** across 3+ zones (multi-region config).
- **99.999% availability** SLA for multi-region instances.
- **Point-in-time recovery (PITR)**: 7-day window via [Firestore PITR](https://cloud.google.com/firestore/docs/use-pitr).

> **Enable PITR before go-live**: Firebase Console → Firestore → Backups → Enable point-in-time recovery.

---

## 2. Scheduled Export Backups

Firestore managed exports run daily to a Cloud Storage bucket.

### Setup (one-time)
```bash
# Create a GCS bucket for backups
gcloud storage buckets create gs://zarkili-firestore-backups \
  --location=europe-west1 \
  --uniform-bucket-level-access

# Grant Firestore service account write access
gcloud storage buckets add-iam-policy-binding gs://zarkili-firestore-backups \
  --member=serviceAccount:service-PROJECT_NUMBER@gcp-sa-firestore.iam.gserviceaccount.com \
  --role=roles/storage.admin
```

### Daily export (Cloud Scheduler job)
```bash
# Create a Cloud Scheduler job to export daily at 02:00 UTC
gcloud scheduler jobs create http firestore-daily-backup \
  --schedule="0 2 * * *" \
  --uri="https://firestore.googleapis.com/v1/projects/PROJECT_ID/databases/(default):exportDocuments" \
  --message-body='{"outputUriPrefix": "gs://zarkili-firestore-backups/daily"}' \
  --oauth-service-account-email=PROJECT_NUMBER-compute@developer.gserviceaccount.com \
  --location=europe-west1
```

### Verify export
```bash
gcloud storage ls gs://zarkili-firestore-backups/daily/
# Should list timestamped folders e.g. 2025-12-01T02-00-00/
```

### Retention policy
- Daily exports: retain 30 days (set lifecycle rule on the GCS bucket).
- Weekly exports: retain 90 days (separate bucket or lifecycle rule for weekly Sunday exports).

```bash
# Add lifecycle rule (30-day delete for daily/)
cat > lifecycle.json << 'EOF'
{
  "rule": [{
    "action": {"type": "Delete"},
    "condition": {"age": 30, "matchesPrefix": ["daily/"]}
  }]
}
EOF
gcloud storage buckets update gs://zarkili-firestore-backups --lifecycle-file=lifecycle.json
```

---

## 3. Full Database Restore

> Use only for catastrophic data loss. This overwrites the current database.

### 3.1 Via Firebase Console (recommended)
1. Firebase Console → Firestore → Backups / Import.
2. Select the GCS bucket path for the backup you want.
3. Click **Import** and confirm. Firestore will merge documents (not delete existing).

### 3.2 Via CLI
```bash
# Replace TIMESTAMP with the folder name from the backup, e.g. 2025-12-01T02-00-00
gcloud firestore import gs://zarkili-firestore-backups/daily/TIMESTAMP/
```

> **Warning**: Imports merge data into existing collections. Deleted documents during the incident window will reappear. To restore a known-good state cleanly, purge the affected collections first (see Section 5).

---

## 4. Point-in-Time Recovery (PITR)

For accidental data corruption (wrong writes, bad migration), use PITR to restore a specific collection to a point in time.

```bash
# Restore a single collection to 6 hours ago
gcloud firestore databases restore \
  --destination-database="(default)" \
  --source-database="(default)" \
  --snapshot-time="$(date -u -d '6 hours ago' +%Y-%m-%dT%H:%M:%SZ)"
```

> PITR requires it to be enabled before the incident. Check: Firebase Console → Firestore → Backups → Point-in-time recovery.

---

## 5. Collection-Level Purge (pre-restore cleanup)

If a migration run wrote bad data to a collection, purge with:

```bash
# Install Firebase Admin Node.js SDK or use a one-off script
# Example: delete all documents with migrationRunId = "bad-run-001"
#
# In a one-off Node script (not to be run in production without review):
# const snapshot = await db.collection('tenantUsers')
#   .where('migrationRunId', '==', 'bad-run-001').get();
# const batch = db.batch();
# snapshot.docs.forEach(d => batch.delete(d.ref));
# await batch.commit();
```

---

## 6. Migration Rollback (zaraMigration.ts)

All documents written by `runZaraMigration` are stamped with `migrationRunId`. To roll back a migration run:

```
1. Identify the runId from the MigrationSummary (console log or saved record).
2. Query each affected collection for documents where migrationRunId == <runId>.
3. Delete in batches using the Admin SDK.
4. Verify loyalty, booking, and tenantUser counts return to pre-migration baseline.
```

Collections to check for rollback:
- `tenants/{tenantId}` — delete the tenant doc (if created == true in summary)
- `locations/{locationId}` — delete the location doc
- `tenantUsers/` where `migrationRunId == runId`
- `bookings/` where `migrationRunId == runId`
- `tenants/{tenantId}/loyaltyStates/` where `migrationRunId == runId`
- `tenants/{tenantId}/loyaltyTransactions/` where `migrationRunId == runId`
- `tenants/{tenantId}/loyaltyIdempotency/` where doc has `txId` referenced in a transaction with `migrationRunId == runId`

---

## 7. Backup Verification Schedule

| Check | Frequency | Owner |
|---|---|---|
| Verify daily export exists in GCS | Weekly (Monday) | On-call engineer |
| Test import of last export to staging | Monthly | Engineering lead |
| PITR enablement check | Monthly | Engineering lead |
| Restore drill (full) | Quarterly | Engineering lead |
