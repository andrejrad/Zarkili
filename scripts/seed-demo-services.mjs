#!/usr/bin/env node
/**
 * Demo service seed — 5 London locations × 2-3 services each.
 *
 * Every service document includes the full denorm field set required by
 * getServiceCards() so that the Explore and Home tabs show real cards.
 *
 * Default fallback coords in getExploreFeed/getHomeFeed: { lat: 51.505, lng: -0.09 }
 * All demo locations are within 10 km of that point.
 *
 * Prices are in dollars.  $35 → 35.
 *
 * Usage:
 *   dotenv -e .env.development -- node scripts/seed-demo-services.mjs
 *
 * Flags (via env):
 *   DRY_RUN=true    — print what would be written, do not touch Firestore
 *   CLEAR_SEED=true — delete all demo docs matching the seed IDs before re-seeding
 */

import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const admin = require(path.join(__dirname, "../functions/node_modules/firebase-admin"));
const { geohashForLocation } = require(
  path.join(__dirname, "../functions/node_modules/geofire-common"),
);

const PROJECT_ID =
  process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? "zarkili-dev-a1b1c";
const DRY_RUN   = process.env.DRY_RUN   === "true";
const CLEAR_SEED = process.env.CLEAR_SEED === "true";

console.log(`Project : ${PROJECT_ID}`);
console.log(`DRY_RUN : ${DRY_RUN}`);
console.log(`CLEAR_SEED: ${CLEAR_SEED}`);
console.log("---");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: PROJECT_ID,
  });
}
const db = admin.firestore();

// ---------------------------------------------------------------------------
// Demo data
// ---------------------------------------------------------------------------
const DEMO_LOCATIONS = [
  {
    tenantId: "demo-tenant-luna",
    locationId: "demo-loc-luna-shoreditch",
    tenantName: "Luna Studio",
    locationName: "Shoreditch",
    locationDisplayName: "Luna Studio · Shoreditch",
    locationCity: "London",
    locationPhone: "+44 20 7555 0101",
    lat: 51.522,
    lng: -0.074,
    averageRating: 4.9,
    reviewCount: 128,
    isBookableOnline: true,
    coverImageUrl: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1200&auto=format&fit=crop",
    services: [
      {
        id: "demo-svc-luna-gloss",
        name: "Gloss treatment + blowdry",
        categoryId: "hair",
        categoryName: "Hair",
        priceFrom: 45,
        popularity: 0.82,
        reviewCount: 128,
        avgRating: 4.9,
        description: "Restore shine and smoothness with our signature gloss treatment followed by a professional blowdry.",
        imageUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop",
      },
      {
        id: "demo-svc-luna-balayage",
        name: "Balayage highlights",
        categoryId: "hair",
        categoryName: "Hair",
        priceFrom: 115,
        popularity: 0.74,
        reviewCount: 96,
        avgRating: 4.8,
        description: "Sun-kissed, natural-looking highlights blended by hand for a seamless result.",
        imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop",
      },
      {
        id: "demo-svc-luna-brows",
        name: "Brow lamination + tint",
        categoryId: "brows",
        categoryName: "Brows",
        priceFrom: 35,
        reviewCount: 64,
        avgRating: 4.7,
        description: "Define and set your brows with a professional lamination and tint combo.",
        imageUrl: "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=800&auto=format&fit=crop",
      },
    ],
  },
  {
    tenantId: "demo-tenant-atelier",
    locationId: "demo-loc-atelier-soho",
    tenantName: "Atelier Glow",
    locationName: "Soho",
    locationDisplayName: "Atelier Glow · Soho",
    locationCity: "London",
    locationPhone: "+44 20 7555 0202",
    lat: 51.513,
    lng: -0.131,
    averageRating: 4.8,
    reviewCount: 96,
    isBookableOnline: true,
    coverImageUrl: "https://images.unsplash.com/photo-1559599101-f09722fb4948?w=1200&auto=format&fit=crop",
    services: [
      {
        id: "demo-svc-glow-facial",
        name: "Hydrating facial",
        categoryId: "skin",
        categoryName: "Skin",
        priceFrom: 55,
        reviewCount: 96,
        avgRating: 4.8,
        description: "Deep hydration facial using hyaluronic acid serums and a relaxing face massage.",
        imageUrl: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&auto=format&fit=crop",
      },
      {
        id: "demo-svc-glow-led",
        name: "LED light therapy",
        categoryId: "skin",
        categoryName: "Skin",
        priceFrom: 65,
        reviewCount: 54,
        avgRating: 4.7,
        description: "Non-invasive LED panel treatment to reduce inflammation and stimulate collagen.",
        imageUrl: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=800&auto=format&fit=crop",
      },
      {
        id: "demo-svc-glow-microderm",
        name: "Microdermabrasion",
        categoryId: "skin",
        categoryName: "Skin",
        priceFrom: 75,
        reviewCount: 41,
        avgRating: 4.6,
        description: "Crystal-free microdermabrasion to resurface skin and improve texture.",
        imageUrl: "https://images.unsplash.com/photo-1505944270255-72b8c68c6a70?w=800&auto=format&fit=crop",
      },
    ],
  },
  {
    tenantId: "demo-tenant-polish",
    locationId: "demo-loc-polish-camden",
    tenantName: "The Polish Room",
    locationName: "Camden",
    locationDisplayName: "The Polish Room · Camden",
    locationCity: "London",
    locationPhone: "+44 20 7555 0303",
    lat: 51.539,
    lng: -0.143,
    averageRating: 4.7,
    reviewCount: 83,
    isBookableOnline: false, // "Call to book" demo
    coverImageUrl: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=1200&auto=format&fit=crop",
    services: [
      {
        id: "demo-svc-polish-gel",
        name: "Signature gel manicure",
        categoryId: "nails",
        categoryName: "Nails",
        priceFrom: 35,
        reviewCount: 83,
        avgRating: 4.7,
        description: "Long-lasting gel colour with a relaxing cuticle massage and hand treatment.",
        imageUrl: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&auto=format&fit=crop",
      },
      {
        id: "demo-svc-polish-gelx",
        name: "Gel-X nail extensions",
        categoryId: "nails",
        categoryName: "Nails",
        priceFrom: 55,
        reviewCount: 67,
        avgRating: 4.8,
        description: "Full-coverage soft gel extensions for length and strength with no damage.",
        imageUrl: "https://images.unsplash.com/photo-1604902396830-aca29e19b067?w=800&auto=format&fit=crop",
      },
      {
        id: "demo-svc-polish-pedi",
        name: "Luxury pedicure",
        categoryId: "nails",
        categoryName: "Nails",
        priceFrom: 40,
        reviewCount: 45,
        avgRating: 4.6,
        description: "Soak, exfoliate, and polish with a relaxing lower-leg massage.",
        imageUrl: "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=800&auto=format&fit=crop",
      },
    ],
  },
  {
    tenantId: "demo-tenant-zen",
    locationId: "demo-loc-zen-notting-hill",
    tenantName: "Zen Massage Studio",
    locationName: "Notting Hill",
    locationDisplayName: "Zen Massage Studio · Notting Hill",
    locationCity: "London",
    locationPhone: "+44 20 7555 0404",
    lat: 51.512,
    lng: -0.197,
    averageRating: 4.7,
    reviewCount: 193,
    isBookableOnline: true,
    coverImageUrl: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200&auto=format&fit=crop",
    services: [
      {
        id: "demo-svc-zen-deep60",
        name: "Deep tissue 60 min",
        categoryId: "massage",
        categoryName: "Massage",
        priceFrom: 75,
        reviewCount: 193,
        avgRating: 4.7,
        description: "Targeted deep tissue massage to release chronic muscle tension.",
        imageUrl: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&auto=format&fit=crop",
      },
      {
        id: "demo-svc-zen-stone",
        name: "Hot stone full body",
        categoryId: "massage",
        categoryName: "Massage",
        priceFrom: 95,
        reviewCount: 112,
        avgRating: 4.8,
        description: "Heated basalt stones melt away tension during this deeply relaxing full-body treatment.",
        imageUrl: "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=800&auto=format&fit=crop",
      },
    ],
  },
  {
    tenantId: "demo-tenant-lash",
    locationId: "demo-loc-lash-marylebone",
    tenantName: "Lash Suite Mia",
    locationName: "Marylebone",
    locationDisplayName: "Lash Suite Mia · Marylebone",
    locationCity: "London",
    locationPhone: "+44 20 7555 0505",
    lat: 51.521,
    lng: -0.155,
    averageRating: 5.0,
    reviewCount: 87,
    isBookableOnline: true,
    coverImageUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1200&auto=format&fit=crop",
    services: [
      {
        id: "demo-svc-lash-classic",
        name: "Classic lash set",
        categoryId: "lashes",
        categoryName: "Lashes",
        priceFrom: 55,
        reviewCount: 87,
        avgRating: 5.0,
        description: "One extension per natural lash for a timeless, fluttery look.",
        imageUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&auto=format&fit=crop",
      },
      {
        id: "demo-svc-lash-lift",
        name: "Lash lift + tint",
        categoryId: "lashes",
        categoryName: "Lashes",
        priceFrom: 45,
        reviewCount: 73,
        avgRating: 4.9,
        description: "Curl and tint your natural lashes for up to 8 weeks of mascara-free lift.",
        imageUrl: "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?w=800&auto=format&fit=crop",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Demo detail data: variants, addons, staff, reviews per service
// ---------------------------------------------------------------------------

/** variantCount on the service doc should match the number of entries here */
const SERVICE_VARIANTS = {
  "demo-svc-luna-gloss":      [{ id: "v1", name: "Short hair",  durationMinutes: 60,  price: 45, isDefault: true },
                                { id: "v2", name: "Medium hair", durationMinutes: 75,  price: 55 },
                                { id: "v3", name: "Long hair",   durationMinutes: 90,  price: 65 }],
  "demo-svc-luna-balayage":   [{ id: "v1", name: "Short / bob",  durationMinutes: 150, price: 115, isDefault: true },
                                { id: "v2", name: "Medium",       durationMinutes: 180, price: 135 },
                                { id: "v3", name: "Long / thick", durationMinutes: 210, price: 165 }],
  "demo-svc-luna-brows":      [{ id: "v1", name: "Brow lamination + tint", durationMinutes: 60, price: 35, isDefault: true }],
  "demo-svc-glow-facial":     [{ id: "v1", name: "45 min",  durationMinutes: 45, price: 45, isDefault: true },
                                { id: "v2", name: "60 min",  durationMinutes: 60, price: 55 },
                                { id: "v3", name: "90 min",  durationMinutes: 90, price: 75 }],
  "demo-svc-glow-led":        [{ id: "v1", name: "Single session", durationMinutes: 45, price: 65, isDefault: true },
                                { id: "v2", name: "Course of 3",    durationMinutes: 45, price: 170 }],
  "demo-svc-glow-microderm":  [{ id: "v1", name: "Express",    durationMinutes: 30, price: 55, isDefault: true },
                                { id: "v2", name: "Full",       durationMinutes: 50, price: 75 }],
  "demo-svc-polish-gel":      [{ id: "v1", name: "Hands only",       durationMinutes: 60, price: 35, isDefault: true },
                                { id: "v2", name: "Hands + gel soak-off", durationMinutes: 75, price: 45 }],
  "demo-svc-polish-gelx":     [{ id: "v1", name: "Short (up to 2mm)",  durationMinutes: 90,  price: 55, isDefault: true },
                                { id: "v2", name: "Medium (3–5mm)",     durationMinutes: 100, price: 65 },
                                { id: "v3", name: "Long (6mm+)",        durationMinutes: 120, price: 75 }],
  "demo-svc-polish-pedi":     [{ id: "v1", name: "Standard pedicure", durationMinutes: 45, price: 35, isDefault: true },
                                { id: "v2", name: "Luxury pedicure",   durationMinutes: 60, price: 40 }],
  "demo-svc-zen-deep60":      [{ id: "v1", name: "60 min",  durationMinutes: 60,  price: 75, isDefault: true },
                                { id: "v2", name: "90 min",  durationMinutes: 90,  price: 95 }],
  "demo-svc-zen-stone":       [{ id: "v1", name: "60 min",  durationMinutes: 60,  price: 80, isDefault: true },
                                { id: "v2", name: "90 min",  durationMinutes: 90,  price: 95 }],
  "demo-svc-lash-classic":    [{ id: "v1", name: "Classic full set",  durationMinutes: 90,  price: 55, isDefault: true },
                                { id: "v2", name: "Classic infill",    durationMinutes: 60,  price: 35 }],
  "demo-svc-lash-lift":       [{ id: "v1", name: "Lift + tint",        durationMinutes: 60,  price: 45, isDefault: true }],
};

const SERVICE_ADDONS = {
  "demo-svc-luna-gloss":     [{ id: "a1", name: "Olaplex treatment",  price: 15, durationMinutes: 10 }],
  "demo-svc-luna-balayage":  [{ id: "a1", name: "Olaplex treatment",  price: 15, durationMinutes: 10 },
                               { id: "a2", name: "Toner",              price: 10, durationMinutes: 15 }],
  "demo-svc-glow-facial":    [{ id: "a1", name: "Eye contour mask",   price: 12, durationMinutes: 10 },
                               { id: "a2", name: "Lip treatment",      price: 8,  durationMinutes: 5  }],
  "demo-svc-glow-led":       [{ id: "a1", name: "Hydrating serum",    price: 15, durationMinutes: 5  }],
  "demo-svc-polish-gel":     [{ id: "a1", name: "Nail art (2 nails)", price: 5,  durationMinutes: 10 },
                               { id: "a2", name: "Cuticle oil treatment", price: 3, durationMinutes: 5 }],
  "demo-svc-polish-gelx":    [{ id: "a1", name: "Nail art (per nail)", price: 3, durationMinutes: 5  },
                               { id: "a2", name: "Chrome powder",       price: 6,  durationMinutes: 5  }],
  "demo-svc-zen-deep60":     [{ id: "a1", name: "Hot towel wrap",     price: 10, durationMinutes: 10 },
                               { id: "a2", name: "Aromatherapy oils",  price: 8,  durationMinutes: 0  }],
  "demo-svc-zen-stone":      [{ id: "a1", name: "Scalp massage",      price: 12, durationMinutes: 10 }],
  "demo-svc-lash-classic":   [{ id: "a1", name: "Lash map upgrade",   price: 10, durationMinutes: 0  }],
};

// Shared demo staff across tenants (one per location for simplicity)
const DEMO_STAFF = {
  "demo-tenant-luna":     [{ id: "demo-staff-luna-anya",   displayName: "Anya B.",   specialtyTags: ["Balayage", "Glossing", "Brow Styling"],  avgRating: 4.9, reviewCount: 74,  bio: "Senior colour artist specialising in lived-in balayage and brow shaping. 8 years experience across London's leading salons — always a natural finish.", photoUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&facepad=3&faces=1" },
                            { id: "demo-staff-luna-sara",   displayName: "Sara K.",   specialtyTags: ["Blowdry", "Colour"],                      avgRating: 4.8, reviewCount: 54,  bio: "Blowdry specialist and colour expert. Known for her precision cuts and soft, bouncy finishes that last all week.", photoUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&auto=format&fit=crop&facepad=3&faces=1" }],
  "demo-tenant-atelier":  [{ id: "demo-staff-glow-priya",  displayName: "Priya M.",  specialtyTags: ["Facial", "LED", "Microdermabrasion"],      avgRating: 4.8, reviewCount: 61,  bio: "Certified aesthetician with a science-backed approach to skin health. Priya customises every facial around your skin's current state, not a fixed menu.", photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&facepad=3&faces=1" },
                            { id: "demo-staff-glow-chloe",  displayName: "Chloe R.",  specialtyTags: ["Hydration", "Anti-ageing"],               avgRating: 4.7, reviewCount: 35,  bio: "Skin therapist focused on deep hydration and gentle anti-ageing protocols. Clients describe her touch as the most relaxing in the city.", photoUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&facepad=3&faces=1" }],
  "demo-tenant-polish":   [{ id: "demo-staff-polish-jess", displayName: "Jess T.",   specialtyTags: ["Gel-X", "Nail Art", "Gel Colour"],        avgRating: 4.9, reviewCount: 55,  bio: "Nail artist with an eye for detail. Jess trained in Seoul and brings Korean nail-art precision to every set — from minimalist to maximalist.", photoUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&facepad=3&faces=1" },
                            { id: "demo-staff-polish-nina", displayName: "Nina F.",   specialtyTags: ["Pedicure", "Classic Manicure"],            avgRating: 4.6, reviewCount: 28,  bio: "Pedicure and classic manicure specialist. Nina's attention to nail health and cuticle care keeps clients coming back every three weeks.", photoUrl: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&auto=format&fit=crop&facepad=3&faces=1" }],
  "demo-tenant-zen":      [{ id: "demo-staff-zen-tom",     displayName: "Tom H.",    specialtyTags: ["Deep Tissue", "Sports Massage"],           avgRating: 4.8, reviewCount: 103, bio: "Sports massage therapist and deep-tissue specialist. Tom worked with professional athletes before joining Zen Studio and has a gift for locating tension nobody else finds.", photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&facepad=3&faces=1" },
                            { id: "demo-staff-zen-lisa",    displayName: "Lisa W.",   specialtyTags: ["Hot Stone", "Relaxation"],                 avgRating: 4.7, reviewCount: 90,  bio: "Holistic therapist specialising in hot-stone and full-body relaxation massage. Lisa creates a calming ritual from the moment you walk in.", photoUrl: "https://images.unsplash.com/photo-1499952127939-9bbf5af6c51c?w=400&auto=format&fit=crop&facepad=3&faces=1" }],
  "demo-tenant-lash":     [{ id: "demo-staff-lash-mia",    displayName: "Mia D.",    specialtyTags: ["Classic Lashes", "Lash Lift", "Brow Tint"], avgRating: 5.0, reviewCount: 87,  bio: "Lash artist and founder of Lash Suite Mia. Mia has 6 years of precision lash application experience with a loyal client list and zero retention complaints.", photoUrl: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&auto=format&fit=crop&facepad=3&faces=1" }],
};

// A handful of reviews per service (subset — good enough for UI testing)
const SERVICE_REVIEWS = {
  "demo-svc-polish-gel": [
    { reviewerName: "Sophie L.",   rating: 5, body: "Best gel manicure I've ever had — lasted 3 weeks with zero chips!", createdAt: new Date(Date.now() - 3 * 864e5) },
    { reviewerName: "Rachel M.",   rating: 5, body: "Jess is an absolute artist. The cuticle massage alone is worth it.", createdAt: new Date(Date.now() - 7 * 864e5) },
    { reviewerName: "Hannah T.",   rating: 4, body: "Really pleased with the result. Took a little longer than expected but totally worth it.", createdAt: new Date(Date.now() - 14 * 864e5) },
  ],
  "demo-svc-luna-gloss": [
    { reviewerName: "Isabelle C.", rating: 5, body: "Hair looks incredible — so shiny and healthy. Anya really understood what I wanted.", createdAt: new Date(Date.now() - 2 * 864e5) },
    { reviewerName: "Priya S.",    rating: 5, body: "The gloss treatment transformed my colour-damaged hair. Already booked for next month.", createdAt: new Date(Date.now() - 10 * 864e5) },
  ],
  "demo-svc-luna-balayage": [
    { reviewerName: "Emma D.",     rating: 5, body: "Sara did exactly what I showed her on Pinterest — sun-kissed, natural, perfect.", createdAt: new Date(Date.now() - 5 * 864e5) },
    { reviewerName: "Olivia K.",   rating: 5, body: "Worth every penny. My hair looks like I've been on holiday.", createdAt: new Date(Date.now() - 20 * 864e5) },
    { reviewerName: "Zara H.",     rating: 4, body: "Really happy overall. The colour is beautiful, took slightly longer than the estimate.", createdAt: new Date(Date.now() - 30 * 864e5) },
  ],
  "demo-svc-glow-facial": [
    { reviewerName: "Alice P.",    rating: 5, body: "My skin was glowing for over a week. Priya is incredibly knowledgeable.", createdAt: new Date(Date.now() - 4 * 864e5) },
    { reviewerName: "Jessica N.",  rating: 5, body: "Relaxing and effective — the best facial I've had in London.", createdAt: new Date(Date.now() - 12 * 864e5) },
  ],
  "demo-svc-zen-deep60": [
    { reviewerName: "Daniel R.",   rating: 5, body: "Tom sorted out the knot in my shoulder that a physio couldn't fix. Absolute legend.", createdAt: new Date(Date.now() - 1 * 864e5) },
    { reviewerName: "Mark S.",     rating: 5, body: "Exactly the right pressure. Left feeling like a new person.", createdAt: new Date(Date.now() - 8 * 864e5) },
    { reviewerName: "Claire B.",   rating: 4, body: "Very good deep tissue massage. Slightly on the firm side for my taste but effective.", createdAt: new Date(Date.now() - 18 * 864e5) },
  ],
  "demo-svc-lash-classic": [
    { reviewerName: "Natasha E.",  rating: 5, body: "Mia is a lash wizard. Retention was still 90% after 3 weeks.", createdAt: new Date(Date.now() - 6 * 864e5) },
    { reviewerName: "Amy F.",      rating: 5, body: "So natural-looking and light. No discomfort at all during application.", createdAt: new Date(Date.now() - 15 * 864e5) },
  ],
};

// ---------------------------------------------------------------------------
// Collect all IDs for CLEAR_SEED
// ---------------------------------------------------------------------------
const ALL_TENANT_IDS   = DEMO_LOCATIONS.map((l) => l.tenantId);
const ALL_LOCATION_IDS = DEMO_LOCATIONS.map((l) => l.locationId);
const ALL_SERVICE_IDS  = DEMO_LOCATIONS.flatMap((l) => l.services.map((s) => s.id));
const ALL_STAFF_IDS    = Object.values(DEMO_STAFF).flat().map((s) => s.id);
const ALL_SCHEDULE_IDS = DEMO_LOCATIONS.flatMap((l) =>
  (DEMO_STAFF[l.tenantId] ?? []).map((s) => `${l.tenantId}_${s.id}_${l.locationId}`)
);
const ALL_REVIEW_IDS   = Object.entries(SERVICE_REVIEWS).flatMap(([svcId, reviews]) =>
  reviews.map((_, i) => `demo-review-${svcId}-${i + 1}`)
);

// ---------------------------------------------------------------------------
// Batch helpers (same pattern as seed-qa-firestore.mjs)
// ---------------------------------------------------------------------------
let currentBatch = db.batch();
let batchOps = 0;
const BATCH_LIMIT = 490;

async function flushBatches() {
  if (batchOps === 0) return;
  if (!DRY_RUN) await currentBatch.commit();
  console.log(`  ↳ flushed ${batchOps} ops${DRY_RUN ? " (DRY_RUN)" : ""}`);
  currentBatch = db.batch();
  batchOps = 0;
}

async function write(ref, data) {
  if (DRY_RUN) {
    console.log("  [DRY_RUN] set", ref.path);
    return;
  }
  currentBatch.set(ref, data, { merge: false });
  batchOps++;
  if (batchOps >= BATCH_LIMIT) await flushBatches();
}

async function deleteRef(ref) {
  if (DRY_RUN) {
    console.log("  [DRY_RUN] delete", ref.path);
    return;
  }
  currentBatch.delete(ref);
  batchOps++;
  if (batchOps >= BATCH_LIMIT) await flushBatches();
}

// ---------------------------------------------------------------------------
// CLEAR_SEED
// ---------------------------------------------------------------------------
if (CLEAR_SEED) {
  console.log("CLEAR_SEED: removing existing demo docs…");
  for (const id of ALL_SERVICE_IDS) {
    await deleteRef(db.doc(`services/${id}`));
    // subcollections
    for (const sub of ["variants", "addons", "photos"]) {
      const snap = await db.collection(`services/${id}/${sub}`).listDocuments();
      for (const ref of snap) await deleteRef(ref);
    }
  }
  for (const id of ALL_LOCATION_IDS)  await deleteRef(db.doc(`locations/${id}`));
  for (const id of ALL_TENANT_IDS)    await deleteRef(db.doc(`tenants/${id}`));
  for (const id of ALL_STAFF_IDS)     await deleteRef(db.doc(`staff/${id}`));
  for (const id of ALL_SCHEDULE_IDS)  await deleteRef(db.doc(`staffSchedules/${id}`));
  for (const id of ALL_REVIEW_IDS)    await deleteRef(db.doc(`reviews/${id}`));
  await flushBatches();
  console.log("CLEAR_SEED: done.");
  console.log("---");
}

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------
const now = admin.firestore.Timestamp.now();
const tomorrow = admin.firestore.Timestamp.fromDate(new Date(Date.now() + 86_400_000));

for (const loc of DEMO_LOCATIONS) {
  console.log(`\n[${loc.tenantName} — ${loc.locationName}]`);

  // ── tenant ──
  await write(db.doc(`tenants/${loc.tenantId}`), {
    tenantId: loc.tenantId,
    name: loc.tenantName,
    slug: loc.tenantName.toLowerCase().replace(/\s+/g, "-"),
    active: true,
    createdAt: now,
    updatedAt: now,
  });

  // ── location ──
  await write(db.doc(`locations/${loc.locationId}`), {
    locationId: loc.locationId,
    tenantId: loc.tenantId,
    name: loc.locationName,
    displayName: loc.locationDisplayName,
    phone: loc.locationPhone,
    lat: loc.lat,
    lng: loc.lng,
    geohash: geohashForLocation([loc.lat, loc.lng], 9),
    averageRating: loc.averageRating,
    reviewCount: loc.reviewCount,
    isBookableOnline: loc.isBookableOnline,
    coverImageUrl: loc.coverImageUrl ?? null,
    status: "active",
    active: true,
    createdAt: now,
    updatedAt: now,
  });

  // ── services ──
  for (let idx = 0; idx < loc.services.length; idx++) {
    const svc = loc.services[idx];
    console.log(`  service: ${svc.id} — ${svc.name}`);
    const svcVariants = SERVICE_VARIANTS[svc.id] ?? [];
    const defaultVariant = svcVariants.find((v) => v.isDefault) ?? svcVariants[0];
    const baseDurationMinutes = defaultVariant?.durationMinutes ?? 60;
    await write(db.doc(`services/${svc.id}`), {
      serviceId: svc.id,
      tenantId: loc.tenantId,
      locationId: loc.locationId,

      name: svc.name,
      description: svc.description,
      categoryId: svc.categoryId,
      tags: [],
      technicianIds: [],

      baseDurationMinutes,
      baseBufferMinutes: 10,
      basePrice: svc.priceFrom,
      baseCurrency: "GBP",

      active: true,
      sortOrder: idx + 1,
      popularityScore: svc.popularity ?? null,
      averageRating: svc.reviewCount >= 5 ? svc.avgRating : null,
      reviewCount: svc.reviewCount,
      ratingSum: svc.reviewCount >= 5 ? Math.round(svc.avgRating * svc.reviewCount) : 0,

      nextAvailableAt: tomorrow,
      isFullyBooked: false,
      photoUrl: svc.imageUrl ?? null,

      // ── 14 denorm fields required by getServiceCards() ──
      geohash: geohashForLocation([loc.lat, loc.lng], 9),
      locationLat: loc.lat,
      locationLng: loc.lng,
      locationDisplayName: loc.locationDisplayName,
      locationCity: loc.locationCity,
      locationAverageRating: loc.averageRating,
      locationReviewCount: loc.reviewCount,
      variantCount: 1,
      categoryName: svc.categoryName,
      isBookableOnline: loc.isBookableOnline,
      locationPhone: loc.locationPhone,
      priceFrom: svc.priceFrom,
      durationFrom: baseDurationMinutes,
      primaryPhotoUrl: svc.imageUrl ?? null,
      primaryPhotoSource: svc.imageUrl ? "salon" : null,

      createdAt: now,
      updatedAt: now,
    });

    // ── variants ──
    const variants = svcVariants.length > 0 ? svcVariants : [
      { id: "v1", name: svc.name, durationMinutes: baseDurationMinutes, price: svc.priceFrom, isDefault: true },
    ];
    for (const v of variants) {
      await write(db.doc(`services/${svc.id}/variants/${v.id}`), {
        name: v.name,
        durationMinutes: v.durationMinutes,
        price: v.price,
        currency: "GBP",
        isDefault: v.isDefault ?? false,
        active: true,
        sortOrder: variants.indexOf(v) + 1,
      });
    }

    // ── addons ──
    const addons = SERVICE_ADDONS[svc.id] ?? [];
    for (const a of addons) {
      await write(db.doc(`services/${svc.id}/addons/${a.id}`), {
        name: a.name,
        price: a.price,
        currency: "GBP",
        durationMinutes: a.durationMinutes,
        active: true,
      });
    }

    // update variantCount on service doc to match actual variants
    if (!DRY_RUN && variants.length > 1) {
      currentBatch.update(db.doc(`services/${svc.id}`), { variantCount: variants.length });
      batchOps++;
    }
  }

  // ── staff + schedules ──
  const staffList = DEMO_STAFF[loc.tenantId] ?? [];
  for (const s of staffList) {
    console.log(`  staff: ${s.id} — ${s.displayName}`);
    // link every service in this location to this staff member
    const serviceIds = loc.services.map((sv) => sv.id);
    await write(db.doc(`staff/${s.id}`), {
      staffId: s.id,
      tenantId: loc.tenantId,
      locationId: loc.locationId,
      locationIds: [loc.locationId],
      displayName: s.displayName,
      status: "active",
      serviceIds,
      specialtyTags: s.specialtyTags,
      averageRating: s.reviewCount >= 3 ? s.avgRating : null,
      reviewCount: s.reviewCount,
      photoUrl: s.photoUrl ?? null,
      bio: s.bio ?? null,
      createdAt: now,
      updatedAt: now,
    });

    // ── staff schedule: Mon–Sat 09:00–18:00 ──
    const scheduleId = `${loc.tenantId}_${s.id}_${loc.locationId}`;
    console.log(`  schedule: ${scheduleId}`);
    await write(db.doc(`staffSchedules/${scheduleId}`), {
      scheduleId,
      tenantId: loc.tenantId,
      staffId: s.id,
      locationId: loc.locationId,
      weekTemplate: {
        mon: [{ start: "09:00", end: "18:00" }],
        tue: [{ start: "09:00", end: "18:00" }],
        wed: [{ start: "09:00", end: "18:00" }],
        thu: [{ start: "09:00", end: "18:00" }],
        fri: [{ start: "09:00", end: "18:00" }],
        sat: [{ start: "10:00", end: "16:00" }],
      },
      exceptions: [],
      updatedAt: now,
    });
  }
}

// ── reviews ──
console.log("\n[Reviews]");
for (const [svcId, reviewList] of Object.entries(SERVICE_REVIEWS)) {
  const loc = DEMO_LOCATIONS.find((l) => l.services.some((s) => s.id === svcId));
  if (!loc) continue;
  for (let i = 0; i < reviewList.length; i++) {
    const r = reviewList[i];
    const reviewId = `demo-review-${svcId}-${i + 1}`;
    console.log(`  review: ${reviewId}`);
    await write(db.doc(`reviews/${reviewId}`), {
      reviewId,
      serviceId: svcId,
      tenantId: loc.tenantId,
      locationId: loc.locationId,
      reviewerName: r.reviewerName,
      rating: r.rating,
      body: r.body,
      photoUrls: [],
      technicianComment: null,
      createdAt: admin.firestore.Timestamp.fromDate(r.createdAt),
    });
  }
}

await flushBatches();
console.log("\nSeed complete.");
