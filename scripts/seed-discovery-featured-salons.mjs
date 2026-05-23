#!/usr/bin/env node

import { execSync } from "node:child_process";

const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? "zarkili-dev-a1b1c";

const docs = [
  {
    id: "luna-studio",
    tenantId: "tenant-luna",
    name: "Luna Studio",
    city: "Zagreb",
    categories: ["hair", "brows"],
    rating: 4.9,
    reviewCount: 128,
    priceFrom: 28,
    currency: "EUR",
    nextAvailableLabel: "Today 4:30 PM",
    featuredService: "Gloss + blowout",
    member: true,
    bookingEnabled: true,
    messageEnabled: true,
    coverImageUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop",
  },
  {
    id: "atelier-glow",
    tenantId: "tenant-glow",
    name: "Atelier Glow",
    city: "Split",
    categories: ["skin", "spa"],
    rating: 4.8,
    reviewCount: 96,
    priceFrom: 42,
    currency: "EUR",
    nextAvailableLabel: "Tomorrow 10:00 AM",
    featuredService: "Hydrating facial",
    member: false,
    bookingEnabled: true,
    messageEnabled: true,
    coverImageUrl: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&auto=format&fit=crop",
  },
  {
    id: "the-polish-room",
    tenantId: "tenant-polish-room",
    name: "The Polish Room",
    city: "Rijeka",
    categories: ["nails", "wellness"],
    rating: 4.7,
    reviewCount: 83,
    priceFrom: 22,
    currency: "EUR",
    nextAvailableLabel: "Today 6:15 PM",
    featuredService: "Signature gel manicure",
    member: true,
    bookingEnabled: false,
    messageEnabled: false,
    coverImageUrl: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&auto=format&fit=crop",
  },
];

function getAccessToken() {
  return execSync("gcloud auth print-access-token", {
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
  }).trim();
}

function toFirestoreFields(doc) {
  return {
    tenantId: { stringValue: doc.tenantId },
    name: { stringValue: doc.name },
    city: { stringValue: doc.city },
    categories: {
      arrayValue: {
        values: doc.categories.map((value) => ({ stringValue: value })),
      },
    },
    rating: { doubleValue: doc.rating },
    reviewCount: { integerValue: String(doc.reviewCount) },
    priceFrom: { integerValue: String(doc.priceFrom) },
    currency: { stringValue: doc.currency },
    nextAvailableLabel: { stringValue: doc.nextAvailableLabel },
    featuredService: { stringValue: doc.featuredService },
    member: { booleanValue: doc.member },
    bookingEnabled: { booleanValue: doc.bookingEnabled },
    messageEnabled: { booleanValue: doc.messageEnabled },
    ...(doc.coverImageUrl ? { coverImageUrl: { stringValue: doc.coverImageUrl } } : {}),
  };
}

async function upsertDoc(accessToken, collection, docId, fields) {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}/${docId}`;

  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to seed ${collection}/${docId}: ${response.status} ${body}`);
  }
}

function toTenantFields(doc) {
  return {
    brandName: { stringValue: doc.name },
    city: { stringValue: doc.city },
    addressLine1: { stringValue: `${doc.city}, Croatia` },
    description: { stringValue: `${doc.name} — a premier beauty studio in ${doc.city}.` },
    rating: { doubleValue: doc.rating },
    reviewCount: { integerValue: String(doc.reviewCount) },
    status: { stringValue: "active" },
    bookingEnabled: { booleanValue: doc.bookingEnabled },
    ...(doc.coverImageUrl ? { coverImageUrl: { stringValue: doc.coverImageUrl } } : {}),
  };
}

const SERVICES_BY_TENANT = {
  "tenant-luna": [
    { id: "svc-luna-1", name: "Gloss + Blowout", durationMinutes: 60, priceCents: 4500, active: true, sortOrder: 1 },
    { id: "svc-luna-2", name: "Balayage", durationMinutes: 120, priceCents: 9800, active: true, sortOrder: 2 },
    { id: "svc-luna-3", name: "Eyebrow Shaping", durationMinutes: 30, priceCents: 2800, active: true, sortOrder: 3 },
  ],
  "tenant-glow": [
    { id: "svc-glow-1", name: "Hydrating Facial", durationMinutes: 60, priceCents: 6500, active: true, sortOrder: 1 },
    { id: "svc-glow-2", name: "Deep Cleanse", durationMinutes: 45, priceCents: 4200, active: true, sortOrder: 2 },
    { id: "svc-glow-3", name: "Relaxation Massage", durationMinutes: 90, priceCents: 8800, active: true, sortOrder: 3 },
  ],
  "tenant-polish-room": [
    { id: "svc-polish-1", name: "Signature Gel Manicure", durationMinutes: 60, priceCents: 3500, active: true, sortOrder: 1 },
    { id: "svc-polish-2", name: "Classic Pedicure", durationMinutes: 45, priceCents: 2800, active: true, sortOrder: 2 },
    { id: "svc-polish-3", name: "Nail Art Design", durationMinutes: 30, priceCents: 1500, active: true, sortOrder: 3 },
  ],
};

const STAFF_BY_TENANT = {
  "tenant-luna": [
    { id: "staff-luna-1", displayName: "Ana Horvat", role: "Senior Stylist", status: "active", rating: 4.9 },
    { id: "staff-luna-2", displayName: "Maja Kovačić", role: "Brow Specialist", status: "active", rating: 4.8 },
  ],
  "tenant-glow": [
    { id: "staff-glow-1", displayName: "Ivan Perić", role: "Lead Aesthetician", status: "active", rating: 4.9 },
    { id: "staff-glow-2", displayName: "Petra Jukić", role: "Massage Therapist", status: "active", rating: 4.7 },
  ],
  "tenant-polish-room": [
    { id: "staff-polish-1", displayName: "Lana Babić", role: "Nail Technician", status: "active", rating: 4.8 },
  ],
};

function toServiceFields(s) {
  return {
    name: { stringValue: s.name },
    durationMinutes: { integerValue: String(s.durationMinutes) },
    priceCents: { integerValue: String(s.priceCents) },
    active: { booleanValue: s.active },
    sortOrder: { integerValue: String(s.sortOrder) },
  };
}

function toStaffFields(s) {
  return {
    displayName: { stringValue: s.displayName },
    role: { stringValue: s.role },
    status: { stringValue: s.status },
    rating: { doubleValue: s.rating },
  };
}

async function run() {
  const accessToken = getAccessToken();

  for (const doc of docs) {
    await upsertDoc(accessToken, "discoveryFeaturedSalons", doc.id, toFirestoreFields(doc));
    console.log(`seeded discoveryFeaturedSalons:${doc.id}`);

    await upsertDoc(accessToken, "tenants", doc.tenantId, toTenantFields(doc));
    console.log(`seeded tenants:${doc.tenantId}`);

    for (const svc of SERVICES_BY_TENANT[doc.tenantId] ?? []) {
      await upsertDoc(accessToken, `tenants/${doc.tenantId}/services`, svc.id, toServiceFields(svc));
      console.log(`  seeded service:${svc.id}`);
    }

    for (const staff of STAFF_BY_TENANT[doc.tenantId] ?? []) {
      await upsertDoc(accessToken, `tenants/${doc.tenantId}/staff`, staff.id, toStaffFields(staff));
      console.log(`  seeded staff:${staff.id}`);
    }
  }

  console.log(`done: seeded ${docs.length} tenants + services + staff in ${projectId}`);
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
