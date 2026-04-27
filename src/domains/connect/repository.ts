/**
 * Connect repository
 *
 * Collection layout (all tenant-scoped):
 *   tenants/{tenantId}/connect/account                    — singleton ConnectAccount
 *   tenants/{tenantId}/connectWebhookIdempotency/{eventId} — applied Stripe Connect event ids
 */

import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  writeBatch,
  type Firestore,
} from "firebase/firestore";

import type { ConnectAccount } from "./model";

const connectCol = (tenantId: string) => `tenants/${tenantId}/connect`;
const idempCol = (tenantId: string) => `tenants/${tenantId}/connectWebhookIdempotency`;
const ACCOUNT_DOC = "account";

export type ConnectRepository = {
  getAccount(tenantId: string): Promise<ConnectAccount | null>;
  saveAccountWithIdempotency(account: ConnectAccount, eventId: string): Promise<void>;
  /** Save without an associated webhook event (used by initial onboardAccount). */
  saveAccount(account: ConnectAccount): Promise<void>;
  hasProcessedEvent(tenantId: string, eventId: string): Promise<boolean>;
  recordProcessedEvent(tenantId: string, eventId: string): Promise<void>;
};

export function createConnectRepository(db: Firestore): ConnectRepository {
  async function getAccount(tenantId: string): Promise<ConnectAccount | null> {
    const ref = doc(db, connectCol(tenantId), ACCOUNT_DOC);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return snap.data() as ConnectAccount;
  }

  async function saveAccountWithIdempotency(
    account: ConnectAccount,
    eventId: string,
  ): Promise<void> {
    const accountRef = doc(db, connectCol(account.tenantId), ACCOUNT_DOC);
    const idempRef = doc(db, idempCol(account.tenantId), eventId);
    const now = serverTimestamp();
    const batch = writeBatch(db);
    batch.set(accountRef, { ...account, updatedAt: now });
    batch.set(idempRef, { eventId, appliedAt: now });
    await batch.commit();
  }

  async function saveAccount(account: ConnectAccount): Promise<void> {
    const ref = doc(db, connectCol(account.tenantId), ACCOUNT_DOC);
    await setDoc(ref, { ...account, updatedAt: serverTimestamp() });
  }

  async function hasProcessedEvent(tenantId: string, eventId: string): Promise<boolean> {
    const ref = doc(db, idempCol(tenantId), eventId);
    const snap = await getDoc(ref);
    return snap.exists();
  }

  async function recordProcessedEvent(tenantId: string, eventId: string): Promise<void> {
    const ref = doc(db, idempCol(tenantId), eventId);
    await setDoc(ref, { eventId, appliedAt: serverTimestamp() });
  }

  return {
    getAccount,
    saveAccountWithIdempotency,
    saveAccount,
    hasProcessedEvent,
    recordProcessedEvent,
  };
}
