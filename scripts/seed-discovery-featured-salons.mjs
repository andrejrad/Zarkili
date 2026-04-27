#!/usr/bin/env node

/* global fetch, console, process */

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
  };
}

async function upsertDoc(accessToken, doc) {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/discoveryFeaturedSalons/${doc.id}`;

  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields: toFirestoreFields(doc) }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to seed ${doc.id}: ${response.status} ${body}`);
  }
}

async function run() {
  const accessToken = getAccessToken();

  for (const doc of docs) {
    await upsertDoc(accessToken, doc);
    console.log(`seeded:${doc.id}`);
  }

  console.log(`done: seeded ${docs.length} discoveryFeaturedSalons docs in ${projectId}`);
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
