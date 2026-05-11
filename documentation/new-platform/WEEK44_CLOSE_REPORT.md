# Week 44 Close Report — Client / CRM Admin

**Date closed:** 2026-05-10  
**Jest baseline at start of week:** 3007 tests / 167 suites (all passing)  
**Jest at close:** 3139 tests / 168 suites — all passing  
**TypeScript:** `tsc --noEmit` clean

---

## 1. Scope

W44 delivered the **Client / CRM** cluster (Phase 3 Batch R), per [PHASE3_ADMIN_UI_PLAN_WEEKS_38_TO_49.md](../PHASE3_ADMIN_UI_PLAN_WEEKS_38_TO_49.md) §Week 44.

The program goal was: _client list with search/filter/saved views, client detail profile (7-tab admin view), client merge, client block/unblock, GDPR data export, client delete, segment builder, and targeted messaging._

All UI surfaces are in place. `clientCrmService` repository adapters are stubs returning `{ ok: false, message: "X repository not configured." }` and are tracked as W44-DEBT-1. Real Firestore adapters land in a future Firebase integration pass.

---

## 2. What Was Built

### 2.1 Domain model — `src/domains/clients/clientCrmModel.ts`

| Type | Description |
|------|-------------|
| `ClientStatus` | `"active" \| "blocked" \| "deleted"` |
| `ClientFilter` | `"all" \| "active" \| "blocked" \| "vip"` |
| `ClientSavedView` | `"myClients" \| "noShowRisk" \| "churned"` |
| `ClientListEntry` | List row — clientId, name, phone, email, status, isVip, tier, totalBookings, totalSpendCents, lastVisitDate, avatarUrl |
| `ClientDetailAdmin` | Full admin profile — sinceDate, tierPoints, loyaltyBalance, notes, allergies[], photoUrls[], consents[], bookingHistory[] |
| `ClientDetailTab` | `"history" \| "preferences" \| "loyalty" \| "notes" \| "allergies" \| "gallery" \| "consents"` |
| `AllergyEntry` | allergyId, name, severity, notes |
| `ConsentRecord` | consentId, type, grantedAt, revokedAt?, version |
| `ClientBookingHistoryEntry` | bookingId, date, serviceName, staffName, amountCents, status |
| `MergeCandidateSummary` | clientId, name, phone, email, totalBookings |
| `MergeInput` | primaryClientId, duplicateClientId, reason |
| `BlockClientInput` / `UnblockClientInput` | clientId, tenantId, reason, durationDays, performedBy |
| `BlockClientReason` | `"no_show" \| "harassment" \| "payment" \| "other"` |
| `GdprExportType` | `"full" \| "bookings" \| "loyalty"` |
| `GdprExportFormat` | `"json" \| "csv"` |
| `GdprExportStatus` | `"pending" \| "ready" \| "failed"` |
| `GdprExportRequest` | requestId, clientId, type, format, status, requestedAt, downloadUrl? |
| `GdprExportInput` | clientId, tenantId, type, format, requestedBy |
| `DeleteClientInput` | clientId, tenantId, reason, performedBy |
| `SegmentFilter` | filterId (stable client-side key), field, operator, value |
| `SegmentFilterField` | `"status" \| "tier" \| "totalBookings" \| "totalSpendCents" \| "lastVisitDaysAgo" \| "isVip"` |
| `SegmentFilterOperator` | `"eq" \| "neq" \| "gt" \| "lt"` |
| `SegmentBuilderInput` | name, filters[] |
| `SegmentPreview` | estimatedCount, sampleClients[] |
| `SavedSegment` | segmentId, name, filters[], createdAt |
| `TargetedMessageChannel` | `"push" \| "sms" \| "email"` |
| `TargetedMessageInput` | segmentId, segmentName, channel, subject?, body, scheduledAt?, sentBy |
| `TargetedMessageResult` | messageId, recipientCount, channel, scheduledAt? |
| `ClientCrmResult<T>` | `{ ok: true; data: T } \| { ok: false; message: string }` |

### 2.2 `src/app/admin/clientCrmService.ts`

Factory `createClientCrmService(clientListRepo?, clientDetailRepo?, clientWriteRepo?, gdprRepo?, segmentRepo?, campaignSendRepo?)` with 6 optional repository port injections. All async methods return `ClientCrmResult<T>`.

| Method | Repository | Validation |
|--------|-----------|------------|
| `listClients(tenantId, filter, savedView, search)` | `ClientListRepository` | — |
| `loadClientDetail(clientId, tenantId)` | `ClientDetailRepository` | — |
| `loadMergeCandidates(clientId, tenantId)` | `ClientDetailRepository` | — |
| `mergeClients(input)` | `ClientWriteRepository` | non-empty reason |
| `blockClient(input)` | `ClientWriteRepository` | — |
| `unblockClient(input)` | `ClientWriteRepository` | — |
| `deleteClient(input)` | `ClientWriteRepository` | non-empty reason |
| `requestGdprExport(input)` | `GdprRepository` | — |
| `loadGdprRequests(clientId, tenantId)` | `GdprRepository` | — |
| `buildSegmentPreview(input)` | `SegmentBuilderRepository` | — |
| `saveSegment(input)` | `SegmentBuilderRepository` | non-empty name |
| `sendToSegment(input)` | `CampaignSendRepository` | non-empty body; email channel requires subject |

**Repository port types exported:** `ClientListRepository`, `ClientDetailRepository`, `ClientWriteRepository`, `GdprRepository`, `SegmentBuilderRepository`, `CampaignSendRepository`

**Type alias exported:** `ClientCrmService = ReturnType<typeof createClientCrmService>`

### 2.3 Eight new screen files

| File | testID root | Key props |
|------|-------------|-----------|
| `ClientListAdminScreen.tsx` | `client-list-screen` | `clients: ClientListEntry[]`, `filter`, `savedView`, `search`, `selectedIds`, `loading`, `error`, `onFilter`, `onSavedView`, `onSearch`, `onSelectClient`, `onLongPress`, `onBulkMessage`, `onBulkExport`, `onBulkBlock` |
| `ClientDetailAdminScreen.tsx` | `client-detail-admin-screen` | `client: ClientDetailAdmin \| null`, `activeTab`, `notesEditing`, `notesText`, `loading`, `error`, `onTabChange`, `onNotesChange`, `onSaveNotes`, `onMerge`, `onBlock`, `onGdpr`, `onDelete` |
| `MergeClientsScreen.tsx` | `merge-clients-screen` | `primaryClient`, `duplicateClient`, `reason`, `submitting`, `error`, `success`, `loadError`, `onReasonChange`, `onConfirm`, `onBack` |
| `BlockClientScreen.tsx` | `block-client-screen` | `clientName`, `reason`, `durationDays`, `submitting`, `error`, `success`, `onReasonChange`, `onDurationChange`, `onBlock`, `onBack` |
| `GdprExportScreen.tsx` | `gdpr-export-screen` | `clientName`, `exportType`, `format`, `previousRequests`, `submitting`, `submitError`, `submitSuccess`, `loading`, `loadError`, `onExportTypeChange`, `onFormatChange`, `onRequestExport`, `onDeleteClient`, `onBack` |
| `DeleteClientScreen.tsx` | `delete-client-screen` | `clientName`, `reason`, `submitting`, `error`, `success`, `onReasonChange`, `onDelete`, `onBack` — internal `confirmed` checkbox state |
| `SegmentBuilderScreen.tsx` | `segment-builder-screen` | `name`, `filters`, `preview`, `previewing`, `saving`, `error`, `onNameChange`, `onAddFilter`, `onUpdateFilter`, `onRemoveFilter`, `onPreview`, `onSave`, `onBack` |
| `TargetedMessageScreen.tsx` | `targeted-message-screen` | `segmentId`, `segmentName`, `recipientCount`, `channel`, `subject`, `body`, `scheduledAt`, `sending`, `error`, `success`, `onChannelChange`, `onSubjectChange`, `onBodyChange`, `onScheduleToggle`, `onSend`, `onBack` |

### 2.4 `src/app/navigation/routes.ts` — 8 new routes

```
ClientListAdmin     /owner/clients            owner  authenticated
ClientDetailAdmin   /owner/clients/detail     owner  authenticated
MergeClients        /owner/clients/merge      owner  authenticated
BlockClient         /owner/clients/block      owner  authenticated
GdprExport          /owner/clients/gdpr       owner  authenticated
DeleteClient        /owner/clients/delete     owner  authenticated
SegmentBuilder      /owner/segments/new       owner  authenticated
TargetedMessage     /owner/segments/message   owner  authenticated
```

### 2.5 `AppNavigatorShell.tsx` — shell wiring

- **Imports:** all 8 screens, `createClientCrmService`, 14 domain type imports from `clientCrmModel`
- **State:** ~80 `useState` lines covering clientList, clientDetail, merge, block, GDPR, delete, segment builder, and targeted message surfaces
- **Service:** `clientCrmService = useMemo(() => createClientCrmService(), [])` (no real adapter injected — W44-DEBT-1)
- **Route handlers:** 8 `if (activeRoute.name === X)` blocks inserted after `RescheduleAdmin` handler

---

## 3. Test Coverage

**File:** `__tests__/w44ClientCrmExtras.test.tsx`  
**Tests added:** 132  
**Suite total:** 3139 / 168 suites

| Describe block | Count |
|---------------|-------|
| `clientCrmService.listClients` | 4 |
| `clientCrmService.loadClientDetail` | 3 |
| `clientCrmService.mergeClients` | 5 |
| `clientCrmService.blockClient` | 3 |
| `clientCrmService.unblockClient` | 2 |
| `clientCrmService.requestGdprExport` | 3 |
| `clientCrmService.loadGdprRequests` | 3 |
| `clientCrmService.deleteClient` | 4 |
| `clientCrmService.buildSegmentPreview` | 3 |
| `clientCrmService.saveSegment` | 4 |
| `clientCrmService.sendToSegment` | 5 |
| `clientCrmService.loadMergeCandidates` | 2 |
| `ClientListAdminScreen` | 12 |
| `ClientDetailAdminScreen` | 11 |
| `MergeClientsScreen` | 8 |
| `BlockClientScreen` | 7 |
| `GdprExportScreen` | 8 |
| `DeleteClientScreen` | 8 |
| `SegmentBuilderScreen` | 8 |
| `TargetedMessageScreen` | 8 |
| `routes.ts — W44 routes` | 24 |
| **Total** | **132** |

---

## 4. Carry-in Debt from W43

The following W43 items were targeted at W44 but were **not resolved** — they depend on the booking-ops repository adapters (W43-DEBT-1) which are a dedicated Firestore integration pass. They remain open and are re-targeted to W45.

| ID | Description | Severity | Prior Target | New Target | Status |
|----|-------------|----------|-------------|------------|--------|
| W43-DEBT-1 | Booking-ops repository adapters (all 5 repo ports are stubs) | High | W44 | W45 | open |
| W43-DEBT-2 | Drag-to-reschedule gesture (screen-based reschedule only) | Medium | W44 | W46 | open |
| W43-DEBT-3 | Staff options not yet populated in booking-ops route handlers | Low | W44 | W45 | open |

---

## 5. Debt Register — New Items This Week

| ID | Description | Severity | Target | Status |
|----|-------------|----------|--------|--------|
| W44-DEBT-1 | CRM repository adapters (all 6 repo ports are stubs) | High | W45 | open |

Full debt entries in [DEBT_REGISTER.md](DEBT_REGISTER.md) §Week 44.

---

## 6. Files Touched

| File | Action |
|------|--------|
| `src/domains/clients/clientCrmModel.ts` | created |
| `src/app/admin/clientCrmService.ts` | created |
| `src/app/admin/ClientListAdminScreen.tsx` | created |
| `src/app/admin/ClientDetailAdminScreen.tsx` | created |
| `src/app/admin/MergeClientsScreen.tsx` | created |
| `src/app/admin/BlockClientScreen.tsx` | created |
| `src/app/admin/GdprExportScreen.tsx` | created |
| `src/app/admin/DeleteClientScreen.tsx` | created |
| `src/app/admin/SegmentBuilderScreen.tsx` | created |
| `src/app/admin/TargetedMessageScreen.tsx` | created |
| `src/app/navigation/routes.ts` | updated — 8 new routes |
| `src/app/navigation/AppNavigatorShell.tsx` | updated — imports, state, service, 8 route handlers |
| `__tests__/w44ClientCrmExtras.test.tsx` | created |
