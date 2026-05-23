#!/usr/bin/env node
// IMPORTANT: This script writes service documents to the canonical Firestore path:
//   brands/{tenantId}/locations/{locationId}/service_types/{serviceId}
//
// The app's discovery feed uses collectionGroup("service_types") to query these
// documents. Do NOT change the collection segment to "services" — it will break
// getServiceCards(). See NEW-DEBT-R close report.
/**
 * W49.5 QA Sprint — Full Firestore Seed Script
 *
 * Creates ~2000 documents covering every scenario in the QA sprint plan:
 *   • 15 active salons + 1 suspended, across US regions
 *   • 3 multi-location tenants
 *   • 10 test consumer accounts (varied states)
 *   • All booking statuses; charges, refunds, disputes
 *   • Loyalty configs, states, transactions, activities, campaigns
 *   • Messaging threads + messages
 *   • Platform super-admin data
 *   • Notification prefs, waitlist, reviews, promo codes
 *
 * Usage:
 *   # Run against dev project (reads EXPO_PUBLIC_FIREBASE_PROJECT_ID from env)
 *   dotenv -e .env.development -- node scripts/seed-qa-firestore.mjs
 *
 *   # Dry-run (prints counts, no writes)
 *   DRY_RUN=true dotenv -e .env.development -- node scripts/seed-qa-firestore.mjs
 *
 *   # Wipe existing seed data first, then re-seed
 *   CLEAR_SEED=true dotenv -e .env.development -- node scripts/seed-qa-firestore.mjs
 *
 * Prerequisites:
 *   gcloud auth application-default login   ← or set GOOGLE_APPLICATION_CREDENTIALS
 *   functions/node_modules/firebase-admin   ← already installed at functions/
 */

import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load firebase-admin from the functions sub-project
const require = createRequire(import.meta.url);
const admin = require(
  path.join(__dirname, "../functions/node_modules/firebase-admin")
);

// Load geofire-common for geohash computation
const { geohashForLocation } = require(
  path.join(__dirname, "../functions/node_modules/geofire-common")
);

// ─── Config ─────────────────────────────────────────────────────────────────

const PROJECT_ID =
  process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? "zarkili-dev-a1b1c";
const DRY_RUN = process.env.DRY_RUN === "true";
const CLEAR_SEED = process.env.CLEAR_SEED === "true";
const BATCH_SIZE = 400; // stay well under Firestore 500-op limit

log(`🔧 Project: ${PROJECT_ID}`);
log(`🔧 Dry-run: ${DRY_RUN}`);
log(`🔧 Clear first: ${CLEAR_SEED}`);

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: PROJECT_ID,
});

const db = admin.firestore();
const auth = admin.auth();

// ─── Helpers ─────────────────────────────────────────────────────────────────

function log(...args) { console.log("[seed]", ...args); }
function ts(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return admin.firestore.Timestamp.fromDate(d);
}
function dateStr(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}
function isoStr(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString();
}
function _rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function _pick(arr, n) { return [...arr].sort(() => Math.random() - .5).slice(0, n); }

let totalWrites = 0;
const batch = { ops: [] };

function write(ref, data, merge = false) {
  batch.ops.push({ ref, data, merge });
}

async function flushBatches() {
  if (DRY_RUN) {
    log(`🌵 DRY RUN — would write ${batch.ops.length} documents`);
    totalWrites += batch.ops.length;
    batch.ops = [];
    return;
  }
  const chunks = [];
  for (let i = 0; i < batch.ops.length; i += BATCH_SIZE)
    chunks.push(batch.ops.slice(i, i + BATCH_SIZE));
  for (const chunk of chunks) {
    const b = db.batch();
    for (const { ref, data, merge } of chunk)
      merge ? b.set(ref, data, { merge: true }) : b.set(ref, data);
    await b.commit();
    totalWrites += chunk.length;
    log(`  ✓ flushed ${chunk.length} docs (total ${totalWrites})`);
  }
  batch.ops = [];
}

async function createAuthUser(uid, email, displayName, password = "Test@1234!") {
  if (DRY_RUN) { log(`  🌵 DRY auth create: ${email}`); return; }
  try {
    await auth.createUser({ uid, email, displayName, password, emailVerified: true });
    log(`  ✓ auth created: ${email}`);
  } catch (e) {
    if (e.code === "auth/uid-already-exists" || e.code === "auth/email-already-exists") {
      await auth.updateUser(uid, { displayName, emailVerified: true });
      log(`  ~ auth updated: ${email}`);
    } else throw e;
  }
}

// ─── IDs ─────────────────────────────────────────────────────────────────────

// Platform admin
const PLATFORM_ADMIN_UID = "qa-platform-admin-00000";

// Test consumers
const CONSUMERS = [
  { uid: "qa-consumer-alice-00001", email: "qa-alice@zarkili.dev",  name: "Alice Martin",   stripeCustomerId: "cus_test_alice001", tier: "gold",   points: 1250, lifetimePoints: 3100 },
  { uid: "qa-consumer-bob-00002",   email: "qa-bob@zarkili.dev",    name: "Bob Chen",       stripeCustomerId: "cus_test_bob002",   tier: "platinum", points: 3200, lifetimePoints: 8400 },
  { uid: "qa-consumer-carol-00003", email: "qa-carol@zarkili.dev",  name: "Carol Davis",    stripeCustomerId: "cus_test_carol003", tier: null,     points: 0,    lifetimePoints: 0 },
  { uid: "qa-consumer-dave-00004",  email: "qa-dave@zarkili.dev",   name: "Dave Wilson",    stripeCustomerId: "cus_test_dave004",  tier: "silver", points: 320,  lifetimePoints: 640 },
  { uid: "qa-consumer-emma-00005",  email: "qa-emma@zarkili.dev",   name: "Emma Garcia",    stripeCustomerId: "cus_test_emma005",  tier: "silver", points: 450,  lifetimePoints: 900 },
  { uid: "qa-consumer-frank-00006", email: "qa-frank@zarkili.dev",  name: "Frank Johnson",  stripeCustomerId: "cus_test_frank006", tier: null,     points: 80,   lifetimePoints: 80 },
  { uid: "qa-consumer-grace-00007", email: "qa-grace@zarkili.dev",  name: "Grace Kim",      stripeCustomerId: "cus_test_grace007", tier: "gold",   points: 940,  lifetimePoints: 2100 },
  { uid: "qa-consumer-henry-00008", email: "qa-henry@zarkili.dev",  name: "Henry Brown",    stripeCustomerId: "cus_test_henry008", tier: "bronze", points: 130,  lifetimePoints: 280 },
  { uid: "qa-consumer-iris-00009",  email: "qa-iris@zarkili.dev",   name: "Iris Taylor",    stripeCustomerId: null,                tier: null,     points: 0,    lifetimePoints: 0 },
  { uid: "qa-consumer-jack-00010",  email: "qa-jack@zarkili.dev",   name: "Jack Martinez",  stripeCustomerId: "cus_test_jack010",  tier: "silver", points: 550,  lifetimePoints: 1100 },
];

// Tenant definitions — 15 active + 1 suspended
const TENANTS = [
  {
    id: "tenant-velvet-bloom",
    name: "Velvet & Bloom",
    slug: "velvet-bloom",
    ownerSuffix: "vb",
    plan: "professional",
    stripeSubscriptionId: "sub_test_vb001",
    stripeConnectId: "acct_test_vb001",
    specialty: ["hair", "color", "highlights", "balayage"],
    city: "New York", state: "NY", region: "Northeast",
    multiLocation: true,
    locations: [
      { id: "loc-vb-ues",     name: "Upper East Side", address: "1025 Lexington Ave", city: "New York", state: "NY", zip: "10021", lat: 40.7757, lng: -73.9600, phone: "+12125550101" },
      { id: "loc-vb-midtown", name: "Midtown",         address: "245 W 55th St",     city: "New York", state: "NY", zip: "10019", lat: 40.7638, lng: -73.9860, phone: "+12125550102" },
    ],
  },
  {
    id: "tenant-crown-republic",
    name: "Crown Republic",
    slug: "crown-republic",
    ownerSuffix: "cr",
    plan: "starter",
    stripeSubscriptionId: "sub_test_cr001",
    stripeConnectId: "acct_test_cr001",
    specialty: ["haircut", "skin fade", "beard trim", "hot towel shave"],
    city: "Brooklyn", state: "NY", region: "Northeast",
    multiLocation: false,
    locations: [
      { id: "loc-cr-brooklyn", name: "Williamsburg", address: "312 Bedford Ave", city: "Brooklyn", state: "NY", zip: "11211", lat: 40.7143, lng: -73.9614, phone: "+17185550201" },
    ],
  },
  {
    id: "tenant-glow-district",
    name: "Glow District",
    slug: "glow-district",
    ownerSuffix: "gd",
    plan: "professional",
    stripeSubscriptionId: "sub_test_gd001",
    stripeConnectId: "acct_test_gd001",
    specialty: ["facial", "skin", "lashes", "microdermabrasion", "chemical peel"],
    city: "West Hollywood", state: "CA", region: "West Coast",
    multiLocation: false,
    locations: [
      { id: "loc-gd-weho", name: "West Hollywood", address: "8730 Sunset Blvd", city: "West Hollywood", state: "CA", zip: "90069", lat: 34.0899, lng: -118.3759, phone: "+13235550301" },
    ],
  },
  {
    id: "tenant-botanika",
    name: "Botanika Beauty",
    slug: "botanika-beauty",
    ownerSuffix: "bb",
    plan: "enterprise",
    stripeSubscriptionId: "sub_test_bb001",
    stripeConnectId: "acct_test_bb001",
    specialty: ["organic facial", "aromatherapy", "scalp treatment", "herbal wrap"],
    city: "Los Angeles", state: "CA", region: "West Coast",
    multiLocation: false,
    locations: [
      { id: "loc-bb-silverlake", name: "Silver Lake", address: "2150 Sunset Blvd", city: "Los Angeles", state: "CA", zip: "90026", lat: 34.0744, lng: -118.2700, phone: "+13235550401" },
    ],
  },
  {
    id: "tenant-studio-nico",
    name: "Studio Nico",
    slug: "studio-nico",
    ownerSuffix: "sn",
    plan: "enterprise",
    stripeSubscriptionId: "sub_test_sn001",
    stripeConnectId: "acct_test_sn001",
    specialty: ["haircut", "balayage", "keratin", "highlights", "blowout"],
    city: "Chicago", state: "IL", region: "Midwest",
    multiLocation: true,
    locations: [
      { id: "loc-sn-lp",  name: "Lincoln Park",  address: "2140 N Halsted St", city: "Chicago", state: "IL", zip: "60614", lat: 41.9222, lng: -87.6489, phone: "+13125550501" },
      { id: "loc-sn-gc",  name: "Gold Coast",    address: "120 E Oak St",      city: "Chicago", state: "IL", zip: "60611", lat: 41.9018, lng: -87.6280, phone: "+13125550502" },
    ],
  },
  {
    id: "tenant-chop-shop",
    name: "The Chop Shop",
    slug: "the-chop-shop",
    ownerSuffix: "cs",
    plan: "starter",
    stripeSubscriptionId: "sub_test_cs001",
    stripeConnectId: "acct_test_cs001",
    specialty: ["haircut", "shave", "beard trim", "skin fade"],
    city: "Chicago", state: "IL", region: "Midwest",
    multiLocation: false,
    locations: [
      { id: "loc-cs-wp", name: "Wicker Park", address: "1630 N Milwaukee Ave", city: "Chicago", state: "IL", zip: "60622", lat: 41.9122, lng: -87.6681, phone: "+17735550601" },
    ],
  },
  {
    id: "tenant-aqua-salon",
    name: "Aqua Salon & Spa",
    slug: "aqua-salon-spa",
    ownerSuffix: "as",
    plan: "enterprise",
    stripeSubscriptionId: "sub_test_as001",
    stripeConnectId: "acct_test_as001",
    specialty: ["haircut", "color", "manicure", "pedicure", "facial", "massage"],
    city: "Miami", state: "FL", region: "Southeast",
    multiLocation: true,
    locations: [
      { id: "loc-as-brickell",  name: "Brickell",     address: "801 Brickell Ave",   city: "Miami",         state: "FL", zip: "33131", lat: 25.7617, lng: -80.1918, phone: "+13055550701" },
      { id: "loc-as-coral",     name: "Coral Gables", address: "2699 Salzedo St",    city: "Coral Gables",  state: "FL", zip: "33134", lat: 25.7492, lng: -80.2610, phone: "+13055550702" },
    ],
  },
  {
    id: "tenant-pigment-studio",
    name: "Pigment Studio",
    slug: "pigment-studio",
    ownerSuffix: "ps",
    plan: "professional",
    stripeSubscriptionId: "sub_test_ps001",
    stripeConnectId: "acct_test_ps001",
    specialty: ["fantasy color", "extensions", "color correction", "vivid color"],
    city: "Miami", state: "FL", region: "Southeast",
    multiLocation: false,
    locations: [
      { id: "loc-ps-wynwood", name: "Wynwood", address: "2222 NW 2nd Ave", city: "Miami", state: "FL", zip: "33127", lat: 25.7997, lng: -80.1989, phone: "+13055550801" },
    ],
  },
  {
    id: "tenant-bloom-branch",
    name: "Bloom & Branch",
    slug: "bloom-branch",
    ownerSuffix: "blb",
    plan: "professional",
    stripeSubscriptionId: "sub_test_blb001",
    stripeConnectId: "acct_test_blb001",
    specialty: ["waxing", "brow shaping", "threading", "lash lift", "tinting"],
    city: "Austin", state: "TX", region: "South Central",
    multiLocation: false,
    locations: [
      { id: "loc-blb-soco", name: "South Congress", address: "1701 S Congress Ave", city: "Austin", state: "TX", zip: "78704", lat: 30.2440, lng: -97.7500, phone: "+15125550901" },
    ],
  },
  {
    id: "tenant-iron-oak",
    name: "Iron & Oak",
    slug: "iron-oak",
    ownerSuffix: "io",
    plan: "starter",
    stripeSubscriptionId: "sub_test_io001",
    stripeConnectId: "acct_test_io001",
    specialty: ["classic cut", "fade", "beard shaping", "scalp treatment"],
    city: "Austin", state: "TX", region: "South Central",
    multiLocation: false,
    locations: [
      { id: "loc-io-east", name: "East Austin", address: "2200 E 6th St", city: "Austin", state: "TX", zip: "78702", lat: 30.2620, lng: -97.7190, phone: "+15125551001" },
    ],
  },
  {
    id: "tenant-mist-moss",
    name: "Mist & Moss",
    slug: "mist-moss",
    ownerSuffix: "mm",
    plan: "professional",
    stripeSubscriptionId: "sub_test_mm001",
    stripeConnectId: "acct_test_mm001",
    specialty: ["scalp treatment", "hair ritual", "nordic massage", "deep conditioning"],
    city: "Seattle", state: "WA", region: "Pacific Northwest",
    multiLocation: false,
    locations: [
      { id: "loc-mm-cap", name: "Capitol Hill", address: "400 E Pine St", city: "Seattle", state: "WA", zip: "98122", lat: 47.6135, lng: -122.3207, phone: "+12065551101" },
    ],
  },
  {
    id: "tenant-parlor-nash",
    name: "The Parlor Nashville",
    slug: "parlor-nashville",
    ownerSuffix: "pn",
    plan: "professional",
    stripeSubscriptionId: "sub_test_pn001",
    stripeConnectId: "acct_test_pn001",
    specialty: ["blowout", "updo", "bridal styling", "event prep"],
    city: "Nashville", state: "TN", region: "Southeast",
    multiLocation: false,
    locations: [
      { id: "loc-pn-east", name: "East Nashville", address: "1104 Fatherland St", city: "Nashville", state: "TN", zip: "37206", lat: 36.1735, lng: -86.7523, phone: "+16155551201" },
    ],
  },
  {
    id: "tenant-allure-atl",
    name: "Allure Studio ATL",
    slug: "allure-studio-atl",
    ownerSuffix: "aa",
    plan: "enterprise",
    stripeSubscriptionId: "sub_test_aa001",
    stripeConnectId: "acct_test_aa001",
    specialty: ["haircut", "color", "facial", "waxing", "nails", "massage"],
    city: "Atlanta", state: "GA", region: "Southeast",
    multiLocation: false,
    locations: [
      { id: "loc-aa-buck", name: "Buckhead", address: "3035 Peachtree Rd NE", city: "Atlanta", state: "GA", zip: "30305", lat: 33.8412, lng: -84.3827, phone: "+14045551301" },
    ],
  },
  {
    id: "tenant-summit-style",
    name: "Summit Style",
    slug: "summit-style",
    ownerSuffix: "ss",
    plan: "professional",
    stripeSubscriptionId: "sub_test_ss001",
    stripeConnectId: "acct_test_ss001",
    specialty: ["haircut", "color", "highlights", "wellness rinse"],
    city: "Denver", state: "CO", region: "Mountain West",
    multiLocation: false,
    locations: [
      { id: "loc-ss-lodo", name: "LoDo", address: "1515 Wynkoop St", city: "Denver", state: "CO", zip: "80202", lat: 39.7553, lng: -104.9998, phone: "+17205551401" },
    ],
  },
  {
    id: "tenant-beacon-mane",
    name: "Beacon Mane",
    slug: "beacon-mane",
    ownerSuffix: "bm",
    plan: "professional",
    stripeSubscriptionId: "sub_test_bm001",
    stripeConnectId: "acct_test_bm001",
    specialty: ["precision cut", "color", "corporate grooming", "beard design"],
    city: "Boston", state: "MA", region: "Northeast",
    multiLocation: false,
    locations: [
      { id: "loc-bm-bb", name: "Back Bay", address: "207 Newbury St", city: "Boston", state: "MA", zip: "02116", lat: 42.3499, lng: -71.0870, phone: "+16175551501" },
    ],
  },
  // Suspended tenant — to test SADM-005
  {
    id: "tenant-suspended-test",
    name: "Suspended Test Salon",
    slug: "suspended-test",
    ownerSuffix: "st",   
    plan: "starter",
    status: "suspended",
    stripeSubscriptionId: "sub_test_st001",
    stripeConnectId: null,
    specialty: ["haircut"],
    city: "Phoenix", state: "AZ", region: "Southwest",
    multiLocation: false,
    locations: [
      { id: "loc-st-phx", name: "Phoenix", address: "1 E Washington St", city: "Phoenix", state: "AZ", zip: "85004", lat: 33.4484, lng: -112.0740, phone: "+16025551601" },
    ],
  },
];

// Service templates by specialty category
const SERVICE_TEMPLATES = {
  hair: [
    { name: "Women's Haircut & Style", category: "Haircut", durationMinutes: 60,  bufferMinutes: 10, price: 95,  sortOrder: 1 },
    { name: "Men's Haircut",           category: "Haircut", durationMinutes: 45,  bufferMinutes: 5,  price: 55,  sortOrder: 2 },
    { name: "Blowout",                 category: "Styling", durationMinutes: 45,  bufferMinutes: 5,  price: 65,  sortOrder: 3 },
    { name: "Full Color",              category: "Color",   durationMinutes: 120, bufferMinutes: 10, price: 145, sortOrder: 4 },
    { name: "Balayage",                category: "Color",   durationMinutes: 180, bufferMinutes: 15, price: 225, sortOrder: 5 },
    { name: "Highlights",              category: "Color",   durationMinutes: 120, bufferMinutes: 10, price: 175, sortOrder: 6 },
    { name: "Keratin Treatment",       category: "Treatment", durationMinutes: 180, bufferMinutes: 15, price: 350, sortOrder: 7 },
    { name: "Deep Conditioning",       category: "Treatment", durationMinutes: 45, bufferMinutes: 5,  price: 55,  sortOrder: 8 },
    { name: "Color Correction",        category: "Color",   durationMinutes: 240, bufferMinutes: 20, price: 350, sortOrder: 9 },
    { name: "Gloss + Blowout",         category: "Color",   durationMinutes: 90,  bufferMinutes: 10, price: 110, sortOrder: 10 },
  ],
  barbershop: [
    { name: "Classic Haircut",    category: "Haircut", durationMinutes: 30, bufferMinutes: 5, price: 40,  sortOrder: 1 },
    { name: "Skin Fade",          category: "Haircut", durationMinutes: 45, bufferMinutes: 5, price: 50,  sortOrder: 2 },
    { name: "Beard Trim",         category: "Beard",   durationMinutes: 20, bufferMinutes: 5, price: 25,  sortOrder: 3 },
    { name: "Hot Towel Shave",    category: "Shave",   durationMinutes: 40, bufferMinutes: 5, price: 55,  sortOrder: 4 },
    { name: "Cut + Beard Combo",  category: "Combo",   durationMinutes: 60, bufferMinutes: 5, price: 70,  sortOrder: 5 },
    { name: "Haircut + Shave",    category: "Combo",   durationMinutes: 60, bufferMinutes: 5, price: 80,  sortOrder: 6 },
    { name: "Scalp Treatment",    category: "Treatment", durationMinutes: 30, bufferMinutes: 5, price: 40, sortOrder: 7 },
    { name: "Kids Haircut",       category: "Haircut", durationMinutes: 20, bufferMinutes: 5, price: 28,  sortOrder: 8 },
  ],
  skin: [
    { name: "Signature Facial",    category: "Facial",    durationMinutes: 60,  bufferMinutes: 10, price: 125, sortOrder: 1 },
    { name: "Hydrating Facial",    category: "Facial",    durationMinutes: 60,  bufferMinutes: 10, price: 115, sortOrder: 2 },
    { name: "Chemical Peel",       category: "Treatment", durationMinutes: 45,  bufferMinutes: 10, price: 150, sortOrder: 3 },
    { name: "Microdermabrasion",   category: "Treatment", durationMinutes: 45,  bufferMinutes: 10, price: 140, sortOrder: 4 },
    { name: "Classic Lash Set",    category: "Lashes",    durationMinutes: 90,  bufferMinutes: 10, price: 180, sortOrder: 5 },
    { name: "Lash Fill",           category: "Lashes",    durationMinutes: 60,  bufferMinutes: 10, price: 90,  sortOrder: 6 },
    { name: "Brow Lamination",     category: "Brows",     durationMinutes: 60,  bufferMinutes: 5,  price: 95,  sortOrder: 7 },
    { name: "LED Light Therapy",   category: "Treatment", durationMinutes: 30,  bufferMinutes: 5,  price: 75,  sortOrder: 8 },
    { name: "Dermaplaning",        category: "Treatment", durationMinutes: 45,  bufferMinutes: 10, price: 110, sortOrder: 9 },
    { name: "Anti-Aging Facial",   category: "Facial",    durationMinutes: 75,  bufferMinutes: 10, price: 145, sortOrder: 10 },
  ],
  wellness: [
    { name: "Organic Facial",        category: "Facial",    durationMinutes: 75,  bufferMinutes: 10, price: 135, sortOrder: 1 },
    { name: "Scalp Ritual",          category: "Treatment", durationMinutes: 60,  bufferMinutes: 10, price: 110, sortOrder: 2 },
    { name: "Aromatherapy Massage",  category: "Massage",   durationMinutes: 60,  bufferMinutes: 10, price: 120, sortOrder: 3 },
    { name: "Deep Tissue Massage",   category: "Massage",   durationMinutes: 60,  bufferMinutes: 10, price: 130, sortOrder: 4 },
    { name: "Herbal Body Wrap",      category: "Body",      durationMinutes: 90,  bufferMinutes: 15, price: 160, sortOrder: 5 },
    { name: "Nordic Hair Ritual",    category: "Treatment", durationMinutes: 90,  bufferMinutes: 15, price: 175, sortOrder: 6 },
    { name: "Ayurvedic Head Massage",category: "Massage",   durationMinutes: 45,  bufferMinutes: 10, price: 95,  sortOrder: 7 },
    { name: "Full Body Exfoliation", category: "Body",      durationMinutes: 60,  bufferMinutes: 10, price: 115, sortOrder: 8 },
  ],
  waxing: [
    { name: "Full Leg Wax",      category: "Waxing",  durationMinutes: 45, bufferMinutes: 5, price: 85,  sortOrder: 1 },
    { name: "Brazilian Wax",     category: "Waxing",  durationMinutes: 30, bufferMinutes: 5, price: 75,  sortOrder: 2 },
    { name: "Brow Wax & Shape",  category: "Brows",   durationMinutes: 20, bufferMinutes: 5, price: 30,  sortOrder: 3 },
    { name: "Brow Threading",    category: "Brows",   durationMinutes: 15, bufferMinutes: 5, price: 20,  sortOrder: 4 },
    { name: "Lash Lift & Tint",  category: "Lashes",  durationMinutes: 60, bufferMinutes: 10, price: 120, sortOrder: 5 },
    { name: "Upper Lip Wax",     category: "Waxing",  durationMinutes: 10, bufferMinutes: 5, price: 15,  sortOrder: 6 },
    { name: "Full Body Wax",     category: "Waxing",  durationMinutes: 90, bufferMinutes: 10, price: 195, sortOrder: 7 },
    { name: "Underarm Wax",      category: "Waxing",  durationMinutes: 15, bufferMinutes: 5, price: 22,  sortOrder: 8 },
  ],
  fullService: [
    { name: "Haircut & Style",    category: "Hair",      durationMinutes: 60,  bufferMinutes: 10, price: 90,  sortOrder: 1 },
    { name: "Full Color",         category: "Hair",      durationMinutes: 120, bufferMinutes: 10, price: 145, sortOrder: 2 },
    { name: "Gel Manicure",       category: "Nails",     durationMinutes: 60,  bufferMinutes: 5,  price: 55,  sortOrder: 3 },
    { name: "Acrylic Full Set",   category: "Nails",     durationMinutes: 90,  bufferMinutes: 5,  price: 85,  sortOrder: 4 },
    { name: "Classic Pedicure",   category: "Nails",     durationMinutes: 60,  bufferMinutes: 5,  price: 55,  sortOrder: 5 },
    { name: "Signature Facial",   category: "Skin",      durationMinutes: 60,  bufferMinutes: 10, price: 115, sortOrder: 6 },
    { name: "Swedish Massage",    category: "Massage",   durationMinutes: 60,  bufferMinutes: 10, price: 110, sortOrder: 7 },
    { name: "Brow Wax & Shape",   category: "Brows",     durationMinutes: 20,  bufferMinutes: 5,  price: 30,  sortOrder: 8 },
    { name: "Blowout",            category: "Hair",      durationMinutes: 45,  bufferMinutes: 5,  price: 65,  sortOrder: 9 },
    { name: "Paraffin Treatment", category: "Treatment", durationMinutes: 30,  bufferMinutes: 5,  price: 40,  sortOrder: 10 },
    { name: "Lash Lift",          category: "Lashes",    durationMinutes: 60,  bufferMinutes: 10, price: 120, sortOrder: 11 },
    { name: "Hot Stone Massage",  category: "Massage",   durationMinutes: 90,  bufferMinutes: 10, price: 145, sortOrder: 12 },
  ],
};

// Map old template category labels to platform service_category IDs
function toCategoryId(category) {
  const c = category.toLowerCase();
  if (c.includes("nail") || c.includes("manicure") || c.includes("pedicure") || c.includes("acrylic") || c.includes("gel")) return "nails";
  if (c.includes("lash") || c.includes("brow") || c.includes("thread") || c.includes("lamination") || c.includes("tint")) return "lash_brow";
  if (c.includes("massage") || c.includes("body") || c.includes("wrap") || c.includes("exfoliation") || c.includes("shiatsu")) return "massage";
  if (c.includes("facial") || c.includes("skin") || c.includes("peel") || c.includes("microderm") || c.includes("dermaplaning") || c.includes("treatment") || c.includes("led") || c.includes("anti-aging")) return "skin";
  return "hair";
}

// Map tenant specialty arrays to service templates
function tenantServiceTemplates(t) {
  const s = t.specialty.join(" ").toLowerCase();
  if (t.id === "tenant-aqua-salon" || t.id === "tenant-allure-atl") return SERVICE_TEMPLATES.fullService;
  if (s.includes("fade") || s.includes("beard") || s.includes("shave")) return SERVICE_TEMPLATES.barbershop;
  if (s.includes("wax") || s.includes("thread") || s.includes("lash lift")) return SERVICE_TEMPLATES.waxing;
  if (s.includes("facial") && s.includes("massage")) return SERVICE_TEMPLATES.wellness;
  if (s.includes("facial") || s.includes("microderm") || s.includes("peel")) return SERVICE_TEMPLATES.skin;
  if (s.includes("organic") || s.includes("nordic") || s.includes("aromatherapy")) return SERVICE_TEMPLATES.wellness;
  return SERVICE_TEMPLATES.hair;
}

// Staff template per tenant type
function tenantStaff(tenantId, ownerUid, locationIds) {
  const allLocs = locationIds;
  const firstLoc = [locationIds[0]];
  const basePeople = [
    { suffix: "s1", displayName: "Jordan Blake",  role: "owner",      skills: ["styling", "coloring"],  specialtyTags: ["Color specialist", "Balayage"],       locationIds: allLocs },
    { suffix: "s2", displayName: "Morgan Lee",    role: "technician", skills: ["styling"],               specialtyTags: ["Precision cut", "Blowout"],           locationIds: firstLoc },
    { suffix: "s3", displayName: "Casey Kim",     role: "technician", skills: ["coloring", "treatment"], specialtyTags: ["Highlights", "Keratin"],              locationIds: allLocs },
    { suffix: "s4", displayName: "Riley Monroe",  role: "assistant",  skills: ["styling"],               specialtyTags: ["Blowout"],                            locationIds: firstLoc },
  ];
  if (allLocs.length > 1) basePeople.push(
    { suffix: "s5", displayName: "Alex Rivera",   role: "manager",    skills: ["styling", "management"], specialtyTags: ["Color", "Extensions"],               locationIds: allLocs },
    { suffix: "s6", displayName: "Sam Park",      role: "technician", skills: ["coloring"],              specialtyTags: ["Balayage", "Gloss"],                  locationIds: [locationIds[1]] },
  );
  return basePeople.map((p, i) => ({
    staffId: `${tenantId}-${p.suffix}`,
    userId: i === 0 ? ownerUid : `${tenantId}-user-${p.suffix}`,
    photoUrl: null,
    ...p,
  }));
}

// Operating hours template (Mon–Sat 9am–7pm, Sun 10am–5pm)
const DEFAULT_HOURS = {
  mon: [{ start: "09:00", end: "19:00" }],
  tue: [{ start: "09:00", end: "19:00" }],
  wed: [{ start: "09:00", end: "19:00" }],
  thu: [{ start: "09:00", end: "19:00" }],
  fri: [{ start: "09:00", end: "20:00" }],
  sat: [{ start: "09:00", end: "18:00" }],
  sun: [{ start: "10:00", end: "17:00" }],
};

// Loyalty tier definitions (shared across all tenants)
const LOYALTY_TIERS = [
  { tierId: "tier-bronze",   name: "Bronze",   minPoints: 0,    maxPoints: 499,  benefits: ["Early access to promos", "Birthday bonus"] },
  { tierId: "tier-silver",   name: "Silver",   minPoints: 500,  maxPoints: 1499, benefits: ["5% discount on products", "Priority booking"] },
  { tierId: "tier-gold",     name: "Gold",     minPoints: 1500, maxPoints: 3499, benefits: ["10% off all services", "1 free product per quarter", "VIP access"] },
  { tierId: "tier-platinum", name: "Platinum", minPoints: 3500, maxPoints: null, benefits: ["15% off all services", "Complimentary add-ons", "Dedicated stylist"] },
];

function tierIdForPoints(lifetimePoints) {
  if (lifetimePoints >= 3500) return "tier-platinum";
  if (lifetimePoints >= 1500) return "tier-gold";
  if (lifetimePoints >= 500)  return "tier-silver";
  if (lifetimePoints > 0)     return "tier-bronze";
  return null;
}

// ─── Seed function ────────────────────────────────────────────────────────────

async function seed() {

  // ── 1. Firebase Auth users ─────────────────────────────────────────────────
  log("\n═══ Step 1: Firebase Auth users");

  await createAuthUser(PLATFORM_ADMIN_UID, "qa-platform-admin@zarkili.dev", "Platform Admin", "QaAdmin@Zarkili2026!");

  for (const c of CONSUMERS) {
    await createAuthUser(c.uid, c.email, c.name, "QaTest@2026!");
  }

  // Tenant owner accounts
  for (const t of TENANTS) {
    const uid = `qa-owner-${t.ownerSuffix}`;
    await createAuthUser(uid, `qa-owner-${t.ownerSuffix}@zarkili.dev`, `${t.name} Owner`, "QaOwner@2026!");
  }

  // Staff sub-accounts (skip owner, already created above)
  for (const t of TENANTS) {
    const locationIds = t.locations.map(l => l.id);
    const ownerUid = `qa-owner-${t.ownerSuffix}`;
    const staff = tenantStaff(t.id, ownerUid, locationIds);
    for (const s of staff.filter(s => s.userId !== ownerUid)) {
      await createAuthUser(s.userId, `${s.userId}@zarkili.dev`, s.displayName, "QaStaff@2026!");
    }
  }
  log("  ✓ Auth users created/updated");

  // ── 2. Platform config ─────────────────────────────────────────────────────
  log("\n═══ Step 2: Platform config");

  write(db.doc("platform/config"), {
    version: "1.0",
    defaultCurrency: "USD",
    supportedLanguages: ["en", "es", "fr"],
    features: { marketplace: true, loyalty: true, aiEnabled: true },
    maintenanceMode: false,
    createdAt: ts(-180),
    updatedAt: ts(-1),
  });

  write(db.doc(`userProfiles/${PLATFORM_ADMIN_UID}`), {
    userId: PLATFORM_ADMIN_UID,
    email: "qa-platform-admin@zarkili.dev",
    firstName: "Platform",
    lastName: "Admin",
    role: "platform_admin",
    createdAt: ts(-180),
    updatedAt: ts(-1),
  });

  // ── 3. Service categories (platform taxonomy) ─────────────────────────────
  log("\n═══ Step 3: Service categories");

  const SERVICE_CATEGORIES = [
    { id: "nails",     name: "Nails",       displayOrder: 1, iconName: "ti-sparkles" },
    { id: "hair",      name: "Hair",        displayOrder: 2, iconName: "ti-scissors" },
    { id: "skin",      name: "Skin",        displayOrder: 3, iconName: "ti-plant" },
    { id: "lash_brow", name: "Lash & Brow", displayOrder: 4, iconName: "ti-eye" },
    { id: "massage",   name: "Massage",     displayOrder: 5, iconName: "ti-heart" },
  ];
  for (const cat of SERVICE_CATEGORIES) {
    write(db.doc(`service_categories/${cat.id}`), cat);
  }

  // ── 4. Consumer user profiles & Stripe customers ───────────────────────────
  log("\n═══ Step 4: Consumer profiles & payment methods");

  for (const c of CONSUMERS) {
    const [firstName, ...restParts] = c.name.split(" ");
    const lastName = restParts.join(" ");

    write(db.doc(`userProfiles/${c.uid}`), {
      userId: c.uid,
      email: c.email,
      firstName,
      lastName,
      createdAt: ts(-90),
      updatedAt: ts(-1),
    });

    if (c.stripeCustomerId) {
      write(db.doc(`clients/${c.uid}`), {
        stripeCustomerId: c.stripeCustomerId,
        createdAt: ts(-90),
      });
    }

    // Notification prefs
    write(db.doc(`clients/${c.uid}/notificationPrefs/prefs`), {
      email: true,
      sms: c.uid !== "qa-consumer-iris-00009",
      push: true,
      bookingConfirmations: true,
      reminders: true,
      promotions: c.uid !== "qa-consumer-henry-00008",
      loyalty: true,
      quietHoursStart: "22:00",
      quietHoursEnd: "08:00",
      quietDays: ["sun"],
      updatedAt: ts(-30),
    });

    // Sample notifications
    const notifCategories = ["booking", "loyalty", "promo", "system", "message"];
    for (let i = 0; i < 3; i++) {
      write(db.doc(`clients/${c.uid}/notifications/notif-${c.uid}-${i}`), {
        notificationId: `notif-${c.uid}-${i}`,
        category: notifCategories[i % notifCategories.length],
        title: ["Your booking is confirmed", "You earned 50 points!", "New deal near you"][i],
        body: ["See you Tuesday at 2pm.", "Keep it up — only 50 more to silver!", "20% off your first visit at Studio Nico."][i],
        isRead: i < 2,
        data: { bookingId: `booking-${c.uid}-0` },
        createdAt: ts(-i * 3),
      });
    }
  }

  // Payment methods (Alice, Bob, Dave, Emma, Grace, Jack have saved cards)
  const pmConsumers = ["qa-consumer-alice-00001", "qa-consumer-bob-00002",
    "qa-consumer-dave-00004", "qa-consumer-emma-00005",
    "qa-consumer-grace-00007", "qa-consumer-jack-00010"];

  const pmData = [
    { brand: "visa",       last4: "4242", expiry: "12/27" },
    { brand: "mastercard", last4: "5555", expiry: "09/26" },
    { brand: "amex",       last4: "3782", expiry: "03/28" },
  ];

  for (const uid of pmConsumers) {
    write(db.doc(`clients/${uid}/paymentMethods/pm-${uid}-0`), {
      ...pmData[0], createdAt: ts(-60),
    });
    if (uid === "qa-consumer-bob-00002" || uid === "qa-consumer-grace-00007") {
      write(db.doc(`clients/${uid}/paymentMethods/pm-${uid}-1`), {
        ...pmData[1], createdAt: ts(-30),
      });
    }
  }

  await flushBatches();

  // ── 5. Tenants, locations, services, staff ─────────────────────────────────
  log("\n═══ Step 5: Tenants, locations, services, staff");

  for (const t of TENANTS) {
    const ownerUid = `qa-owner-${t.ownerSuffix}`;
    const locationIds = t.locations.map(l => l.id);
    const status = t.status ?? "active";
    const plan = t.plan;
    const createdAt = ts(-120);

    // Tenant doc
    write(db.doc(`tenants/${t.id}`), {
      tenantId: t.id,
      name: t.name,
      slug: t.slug,
      status,
      ownerUserId: ownerUid,
      plan,
      country: "US",
      defaultLanguage: "en",
      defaultCurrency: "USD",
      timezone: regionTimezone(t.region),
      branding: {
        logoUrl: null,
        primary: tenantColor(t.id),
        secondary: "#F5F5F0",
        accent: "#D4AF37",
        fontHeading: "Manrope",
        fontBody: "Manrope",
        radius: 8,
      },
      settings: {
        bookingLeadHours: t.id === "tenant-aqua-salon" ? 2 : 1,
        bookingMaxDays: 60,
        cancellationWindowHours: 24,
        allowGuestBooking: true,
        requireDeposit: false,
      },
      createdAt,
      updatedAt: ts(-1),
    });

    // Owner profile
    const [fn, ...ln] = t.name.split(" ");
    write(db.doc(`userProfiles/${ownerUid}`), {
      userId: ownerUid,
      email: `qa-owner-${t.ownerSuffix}@zarkili.dev`,
      firstName: fn,
      lastName: ln.join(" ") + " (Owner)",
      createdAt,
      updatedAt: ts(-1),
    });

    // TenantUser for owner
    write(db.doc(`tenantUsers/${t.id}_${ownerUid}`), {
      membershipId: `${t.id}_${ownerUid}`,
      tenantId: t.id,
      userId: ownerUid,
      role: "tenant_owner",
      permissions: ["all"],
      status: "active",
      subscription: {
        tier: plan === "free_trial" ? "starter" : plan,
        status: status === "suspended" ? "suspended" : "active",
        billingCycle: "monthly",
        startDate: ts(-120),
        trialEndsAt: plan === "free_trial" ? ts(14) : null,
        nextBillingDate: ts(10),
        suspendedAt: status === "suspended" ? ts(-5) : null,
        suspensionReason: status === "suspended" ? "QA test suspension" : null,
      },
      createdAt,
      updatedAt: ts(-1),
    });

    // Pre-compute staff so service technicianIds can reference them
    const staffList = tenantStaff(t.id, ownerUid, locationIds);

    // Locations + Services (one service doc per service × location)
    const templates = tenantServiceTemplates(t);
    const serviceIds = [];
    for (const loc of t.locations) {
      // ── Location (flat path, v3 fields) ──
      const displayName = t.locations.length > 1
        ? `${t.name} · ${loc.name}`
        : t.name;
      const geohash = geohashForLocation([loc.lat, loc.lng], 9);
      const locTechnicianIds = staffList
        .filter(s => s.locationIds.includes(loc.id))
        .map(s => s.staffId);

      write(db.doc(`locations/${loc.id}`), {
        locationId: loc.id,
        tenantId: t.id,
        name: loc.name,
        displayName,
        code: loc.id.slice(-4).toUpperCase(),
        status: "active",
        timezone: regionTimezone(t.region),
        phone: loc.phone,
        email: `${t.slug}@example.com`,
        geohash,
        averageRating: null,
        reviewCount: 0,
        ratingSum: 0,
        address: {
          line1: loc.address,
          city: loc.city,
          state: loc.state,
          country: "US",
          postalCode: loc.zip,
          lat: loc.lat,
          lng: loc.lng,
        },
        operatingHours: DEFAULT_HOURS,
        createdAt,
        updatedAt: ts(-1),
      });

      // ── Services for this location ──
      for (const svc of templates) {
        const svcId = `svc-${t.id}-${loc.id}-${svc.sortOrder}`;
        serviceIds.push(svcId);
        const catId = toCategoryId(svc.category);

        write(db.doc(`brands/${t.id}/locations/${loc.id}/service_types/${svcId}`), {
          serviceId: svcId,
          tenantId: t.id,
          locationId: loc.id,
          name: svc.name,
          categoryId: catId,
          categoryName: svc.category,
          description: "",
          tags: [],
          technicianIds: locTechnicianIds,
          photoUrl: null,
          baseDurationMinutes: svc.durationMinutes,
          baseBufferMinutes: svc.bufferMinutes,
          basePrice: svc.price,
          baseCurrency: "USD",
          active: true,
          sortOrder: svc.sortOrder,
          popularityScore: 0.5,
          averageRating: null,
          reviewCount: 0,
          ratingSum: 0,
          nextAvailableAt: isoStr(1),
          isFullyBooked: false,
          // denorm fields required by getServiceCards()
          geohash,
          locationLat: loc.lat,
          locationLng: loc.lng,
          locationDisplayName: displayName,
          locationCity: loc.city,
          locationAverageRating: null,
          locationReviewCount: 0,
          variantCount: 1,
          priceFrom: svc.price,
          durationFrom: svc.durationMinutes,
          primaryPhotoUrl: null,
          primaryPhotoSource: null,
          isBookableOnline: true,
          createdAt,
          updatedAt: ts(-1),
        });

        // Default variant
        const variantId = `var-${svcId}-standard`;
        write(db.doc(`brands/${t.id}/locations/${loc.id}/service_types/${svcId}/variants/${variantId}`), {
          variantId,
          serviceId: svcId,
          tenantId: t.id,
          locationId: loc.id,
          name: "Standard",
          price: svc.price,
          durationMinutes: svc.durationMinutes,
          bufferMinutes: svc.bufferMinutes,
          isDefault: true,
          displayOrder: 1,
          active: true,
          createdAt,
          updatedAt: ts(-1),
        });

        // Addon (every 3rd service by sortOrder)
        if (svc.sortOrder % 3 === 0) {
          const addonId = `addon-${svcId}-extra`;
          write(db.doc(`brands/${t.id}/locations/${loc.id}/service_types/${svcId}/addons/${addonId}`), {
            addonId,
            serviceId: svcId,
            tenantId: t.id,
            locationId: loc.id,
            name: "Conditioning Treatment",
            price: 25,
            currency: "USD",
            durationMinutes: 15,
            active: true,
            createdAt,
            updatedAt: ts(-1),
          });
        }

        // Photo placeholder
        const photoId = `photo-${svcId}-1`;
        write(db.doc(`brands/${t.id}/locations/${loc.id}/service_types/${svcId}/photos/${photoId}`), {
          photoId,
          serviceId: svcId,
          url: null,
          altText: svc.name,
          sortOrder: 1,
          createdAt,
        });
      }
    }

    // Staff (flat path, v3 fields)
    for (const s of staffList) {
      // Collect all service IDs across this staff member's locations
      const allSvcIds = [];
      for (const svc of templates) {
        for (const locId of s.locationIds) {
          allSvcIds.push(`svc-${t.id}-${locId}-${svc.sortOrder}`);
        }
      }
      const svcIds = (s.role === "owner" || s.role === "manager")
        ? allSvcIds
        : allSvcIds.slice(0, Math.min(5, allSvcIds.length));

      write(db.doc(`staff/${s.staffId}`), {
        staffId: s.staffId,
        tenantId: t.id,
        locationIds: s.locationIds,
        userId: s.userId,
        displayName: s.displayName,
        photoUrl: s.photoUrl,
        role: s.role,
        status: "active",
        skills: s.skills,
        specialtyTags: s.specialtyTags,
        serviceIds: svcIds,
        constraints: [],
        averageRating: null,
        reviewCount: 0,
        ratingSum: 0,
        createdAt,
        updatedAt: ts(-1),
      });

      // TenantUser membership for non-owner staff
      if (s.userId !== ownerUid) {
        write(db.doc(`tenants/${t.id}/staff/${s.staffId}/tenantUsers/${t.id}_${s.userId}`), {
          membershipId: `${t.id}_${s.userId}`,
          tenantId: t.id,
          userId: s.userId,
          role: s.role === "manager" ? "location_manager" : "technician",
          permissions: s.role === "manager" ? ["manage_bookings", "view_analytics"] : ["view_schedule"],
          status: "active",
          subscription: { tier: plan, status: "active", billingCycle: "monthly", startDate: ts(-90), trialEndsAt: null, nextBillingDate: ts(10), suspendedAt: null, suspensionReason: null },
          createdAt,
          updatedAt: ts(-1),
        });
      }

      // Staff schedule (Mon-Fri 9-18, Sat 9-15)
      for (const locId of s.locationIds) {
        const schedId = `${t.id}_${s.staffId}_${locId}`;
        write(db.doc(`tenants/${t.id}/staffSchedules/${schedId}`), {
          tenantId: t.id,
          staffId: s.staffId,
          locationId: locId,
          scheduleId: schedId,
          weeklyTemplate: {
            mon: [{ start: "09:00", end: "18:00" }],
            tue: [{ start: "09:00", end: "18:00" }],
            wed: [{ start: "09:00", end: "18:00" }],
            thu: [{ start: "09:00", end: "18:00" }],
            fri: [{ start: "09:00", end: "18:00" }],
            sat: [{ start: "09:00", end: "15:00" }],
            sun: [],
          },
          effectiveFrom: dateStr(-90),
          createdAt,
          updatedAt: ts(-1),
        });
      }
    }

    // Billing & Connect
    write(db.doc(`tenants/${t.id}/billing/subscription`), {
      subscriptionStatus: status === "suspended" ? "suspended" : "active",
      stripeSubscriptionId: t.stripeSubscriptionId,
      currentPeriodStart: ts(-30),
      currentPeriodEnd: ts(0),
      trialEndsAt: null,
      nextBillingDate: ts(1),
    });

    if (t.stripeConnectId) {
      write(db.doc(`tenants/${t.id}/connect/account`), {
        stripeConnectAccountId: t.stripeConnectId,
        status: "verified",
        accountType: "express",
        payoutDelay: 2,
        payoutCurrency: "USD",
      });
    }

    // Auto-reply config
    write(db.doc(`tenants/${t.id}/autoReplyConfig/config`), {
      enabled: true,
      message: `Thanks for reaching out to ${t.name}! We'll get back to you within a few hours during business hours.`,
      escalationDelay: 60,
    });

    // Waitlist policy
    write(db.doc(`tenants/${t.id}/waitlistPolicy/policy`), {
      tenantId: t.id,
      maxWaitDays: 14,
      autoCancelDays: 7,
      notifyLeadHours: 24,
      maxEntriesPerService: 10,
      notifyOnOpen: true,
      requireConfirmation: true,
      allowMultipleEntries: false,
      createdAt,
    });

    // Canned replies (3 per tenant)
    const cannedReplies = [
      { title: "Available soon", body: "We have availability opening up soon! Would you like us to let you know?" },
      { title: "Booking confirmation", body: "Your appointment is confirmed. See you soon!" },
      { title: "Rescheduling", body: "No problem! We can reschedule. What times work for you?" },
    ];
    for (let i = 0; i < cannedReplies.length; i++) {
      write(db.doc(`tenants/${t.id}/cannedReplies/cr-${t.id}-${i}`), {
        cannedId: `cr-${t.id}-${i}`,
        tenantId: t.id,
        ...cannedReplies[i],
        tags: ["general"],
        createdBy: ownerUid,
        createdAt: isoStr(-60),
      });
    }

    // Promo codes
    write(db.doc(`tenants/${t.id}/promoCodes/promo-welcome20`), {
      codeId: `promo-welcome20`,
      tenantId: t.id,
      code: "WELCOME20",
      type: "percent",
      value: 20,
      status: "active",
      validFrom: dateStr(-30),
      validUntil: dateStr(60),
      maxUses: 100,
      usesCount: 7,
      createdAt: ts(-30),
    });
    write(db.doc(`tenants/${t.id}/promoCodes/promo-flat15`), {
      codeId: `promo-flat15`,
      tenantId: t.id,
      code: "SAVE15",
      type: "fixed",
      value: 15,
      status: "active",
      validFrom: dateStr(-14),
      validUntil: dateStr(30),
      maxUses: 50,
      usesCount: 3,
      createdAt: ts(-14),
    });

    await flushBatches();
  }

  // ── 5. Loyalty — config, states, transactions ─────────────────────────────-
  log("\n═══ Step 6: Loyalty configs, states, transactions");

  for (const t of TENANTS) {
    const createdAt = ts(-120);
    const redemptions = [
      // Free services
      { optionId: "opt-1",  name: "Free Blowout",            pointsCost: 500, valueDescription: "Complimentary blowout service",             type: "free_service", imageAlt: "Blowout styling" },
      { optionId: "opt-5",  name: "Free Gel Manicure",       pointsCost: 400, valueDescription: "Complimentary gel manicure",                type: "free_service", imageAlt: "Gel manicure" },
      { optionId: "opt-6",  name: "Brow Wax On Us",          pointsCost: 250, valueDescription: "Complimentary eyebrow wax & tint",          type: "free_service", imageAlt: "Eyebrow wax" },
      { optionId: "opt-7",  name: "Deep Condition Treatment", pointsCost: 300, valueDescription: "Professional deep-conditioning hair mask", type: "free_service", imageAlt: "Hair treatment" },
      { optionId: "opt-8",  name: "Head Massage Add-on",     pointsCost: 150, valueDescription: "15-min scalp massage added to any service", type: "free_service", imageAlt: "Scalp massage" },
      // Discounts
      { optionId: "opt-10", name: "$5 Off Next Visit",       pointsCost:  80, valueDescription: "$5 discount on your next visit",           type: "discount",     imageAlt: "$5 reward" },
      { optionId: "opt-2",  name: "$15 Off",                 pointsCost: 300, valueDescription: "$15 discount on any service",               type: "discount",     imageAlt: "$15 reward" },
      { optionId: "opt-3",  name: "$30 Off",                 pointsCost: 550, valueDescription: "$30 discount on any service",               type: "discount",     imageAlt: "$30 reward" },
      // Partner products
      { optionId: "opt-9",  name: "Partner Skincare Kit",    pointsCost: 800, valueDescription: "Curated travel skincare kit (partner gift)", type: "product",     imageAlt: "Skincare kit" },
      { optionId: "opt-11", name: "Olaplex No. 3 Treatment", pointsCost: 350, valueDescription: "Take-home Olaplex No. 3 repair treatment",  type: "product",     imageAlt: "Olaplex treatment" },
    ];
    write(db.doc(`tenants/${t.id}/loyaltyConfig/default`), {
      tenantId: t.id,
      enabled: true,
      pointsPerCurrencyUnit: 10,
      tiers: LOYALTY_TIERS,
      redemptionOptions: redemptions,
      pointsExpiryDays: 365,
      createdAt,
      updatedAt: ts(-1),
    });

    // Loyalty states for enrolled consumers
    for (const c of CONSUMERS) {
      if (c.lifetimePoints === 0) continue; // Carol is fresh, no loyalty state yet
      const currentTierId = tierIdForPoints(c.lifetimePoints);
      write(db.doc(`tenants/${t.id}/loyaltyStates/${c.uid}`), {
        userId: c.uid,
        tenantId: t.id,
        points: c.points,
        lifetimePoints: c.lifetimePoints,
        currentTierId,
        enrolledAt: ts(-90),
        updatedAt: ts(-7),
      });

      // 3 loyalty transactions per enrolled user per (first 5) tenants
      const firstFive = TENANTS.slice(0, 5).map(x => x.id);
      if (!firstFive.includes(t.id)) continue;
      const TX_SEED = [
        { type: "credit",  points: 150, reason: "booking_completed", eventData: { serviceName: "Haircut & style", locationName: t.locations?.[0]?.name ?? "Main branch" } },
        { type: "credit",  points: 200, reason: "referral_bonus",    eventData: {} },
        { type: "debit",   points: 100, reason: "reward_redemption", eventData: { rewardName: "Free Blowout" } },
      ];
      for (let i = 0; i < TX_SEED.length; i++) {
        const tx = TX_SEED[i];
        write(db.doc(`tenants/${t.id}/loyaltyTransactions/ltx-${t.id}-${c.uid}-${i}`), {
          txId: `ltx-${t.id}-${c.uid}-${i}`,
          userId: c.uid,
          tenantId: t.id,
          type: tx.type,
          points: tx.points,
          reason: tx.reason,
          eventData: tx.eventData,
          referenceId: `booking-${c.uid}-${i}`,
          idempotencyKey: `ltx-key-${t.id}-${c.uid}-${i}`,
          createdAt: ts(-30 + i * 10),
        });
      }
    }
  }

  await flushBatches();

  // ── 6. Activities & Campaigns ──────────────────────────────────────────────
  log("\n═══ Step 7: Activities & campaigns");

  for (const t of TENANTS.slice(0, 8)) { // First 8 tenants have activities
    const createdAt = ts(-60);

    // Activity 1: visit streak
    write(db.doc(`tenants/${t.id}/activities/act-${t.id}-streak`), {
      activityId: `act-${t.id}-streak`,
      tenantId: t.id,
      name: "Visit 3 Times This Month",
      description: "Book and complete 3 appointments this month to earn bonus points.",
      type: "visit_streak",
      status: "active",
      rule: { type: "visit_streak", targetValue: 3 },
      reward: { type: "points", value: 150 },
      startDate: ts(-7),
      endDate: ts(23),
      createdAt,
      updatedAt: ts(-1),
    });

    // Activity 2: spend goal
    write(db.doc(`tenants/${t.id}/activities/act-${t.id}-spend`), {
      activityId: `act-${t.id}-spend`,
      tenantId: t.id,
      name: "Spend $200 This Quarter",
      description: "Reach $200 in bookings this quarter and earn a bonus.",
      type: "spend_goal",
      status: "active",
      rule: { type: "spend_goal", targetValue: 200 },
      reward: { type: "points", value: 200 },
      startDate: ts(-30),
      endDate: ts(60),
      createdAt,
      updatedAt: ts(-1),
    });

    // Participations for Alice and Bob
    for (const uid of ["qa-consumer-alice-00001", "qa-consumer-bob-00002"]) {
      write(db.doc(`tenants/${t.id}/activityParticipations/ap-${t.id}-${uid}-streak`), {
        participationId: `ap-${t.id}-${uid}-streak`,
        activityId: `act-${t.id}-streak`,
        tenantId: t.id,
        userId: uid,
        status: uid === "qa-consumer-bob-00002" ? "completed" : "active",
        progress: uid === "qa-consumer-bob-00002" ? 100 : 66,
        joinedAt: ts(-14),
        completedAt: uid === "qa-consumer-bob-00002" ? ts(-3) : null,
      });
    }

    // Campaign
    write(db.doc(`tenants/${t.id}/campaigns/camp-${t.id}-spring`), {
      campaignId: `camp-${t.id}-spring`,
      tenantId: t.id,
      name: "Spring Booking Push",
      channel: "email",
      segmentId: `seg-${t.id}-active`,
      segmentName: "Active Clients",
      subject: `Spring refresh at ${t.name} — Book now`,
      body: `It's the perfect time for a spring refresh! Book your appointment at ${t.name} and earn double points this week.`,
      status: "sent",
      scheduledAt: isoStr(-7),
      metrics: { sent: 142, delivered: 138, opened: 62, clicked: 28 },
      createdAt: ts(-10),
    });
  }

  await flushBatches();

  // ── 7. Bookings ────────────────────────────────────────────────────────────
  log("\n═══ Step 8: Bookings (all statuses)");

  // We create bookings across first 8 tenants for all consumers
  // Covering all statuses: confirmed, completed, cancelled, no_show, rescheduled, reschedule_pending, pending
  const bookingScenarios = [
    // [tenantIdx, consumerIdx, serviceOffset, staffOffset, daysFromNow, status, chargeMinor]
    // Future offsets are 30-90 days so seed data stays valid for ≥3 months after seeding.
    [0, 0, 0, 1,  60, "confirmed",            9500],  // Alice — upcoming appointment
    [0, 0, 1, 2,  -7, "completed",            6500],
    [0, 1, 2, 0, -14, "completed",            14500],
    [0, 1, 0, 1,  -3, "cancelled",            0],
    [0, 2, 1, 2,  45, "confirmed",            9500],
    [1, 0, 0, 1,  -2, "no_show",              0],
    [1, 3, 0, 0, -10, "completed",            4000],
    [1, 4, 1, 1,  30, "confirmed",            5000],
    [1, 5, 0, 0,  35, "pending",              0],
    [2, 0, 0, 0,  -5, "completed",           12500],
    [2, 6, 1, 1,  -2, "completed",           11500],
    [2, 7, 0, 2,  28, "reschedule_pending",  9500],
    [3, 1, 0, 1, -21, "completed",           13500],
    [3, 2, 1, 0,  -8, "completed",           11000],
    [3, 4, 0, 1,  40, "confirmed",           13500],
    [4, 0, 2, 0,  -4, "completed",           17500],
    [4, 1, 0, 1,  50, "confirmed",            9500],  // Bob — upcoming appointment
    [4, 9, 1, 2, -12, "completed",           22500],
    [5, 2, 0, 0,  -9, "completed",            4000],
    [5, 3, 1, 1,  -1, "no_show",               0],
    [6, 0, 0, 1, -15, "completed",            9000],
    [6, 0, 5, 0, -30, "rescheduled",         11000],
    [6, 1, 2, 2,  -6, "completed",            5500],
    [6, 9, 0, 1,  55, "confirmed",            9000],
    [7, 4, 0, 0, -20, "completed",            3000],
    [7, 5, 1, 1, -11, "completed",            2200],
    [7, 6, 0, 2,  33, "confirmed",            8500],
    [7, 2, 1, 0,  -3, "cancelled",            0],
  ];

  for (let bi = 0; bi < bookingScenarios.length; bi++) {
    const [tIdx, cIdx, svcOff, staffOff, dayOff, status] = bookingScenarios[bi];
    const t = TENANTS[tIdx];
    const c = CONSUMERS[cIdx];
    const loc = t.locations[0];
    const services = tenantServiceTemplates(t);
    const svc = services[svcOff % services.length];
    const svcId = `svc-${t.id}-${loc.id}-${svc.sortOrder}`;
    const variantId = `var-${svcId}-standard`;
    const staff = tenantStaff(t.id, `qa-owner-${t.ownerSuffix}`, t.locations.map(l => l.id));
    const staffMember = staff[staffOff % staff.length];
    const bookingId = `booking-${bi}-${t.id}-${c.uid}`;
    const chargeMinor = Math.round(svc.price * 100);
    const startMin = 9 * 60 + (bi % 8) * 60;
    const endMin = startMin + svc.durationMinutes;
    const dDate = dateStr(dayOff);

    const lifecycleEvents = [
      { status: "pending",   actor: "client",    reason: null, occurredAt: ts(dayOff - 1) },
      { status: "confirmed", actor: "system",    reason: null, occurredAt: ts(dayOff - 1) },
    ];
    if (status === "completed")           lifecycleEvents.push({ status: "completed",           actor: "system", reason: null,              occurredAt: ts(dayOff) });
    if (status === "cancelled")           lifecycleEvents.push({ status: "cancelled",           actor: "client", reason: "Changed plans",    occurredAt: ts(dayOff - 1) });
    if (status === "no_show")             lifecycleEvents.push({ status: "no_show",             actor: "tenant_admin", reason: "Client did not appear", occurredAt: ts(dayOff) });
    if (status === "reschedule_pending")  lifecycleEvents.push({ status: "reschedule_pending",  actor: "client", reason: "Need to reschedule", occurredAt: ts(dayOff - 2) });
    if (status === "rescheduled")         lifecycleEvents.push({ status: "rescheduled",         actor: "client", reason: null,              occurredAt: ts(dayOff - 5) }, { status: "completed", actor: "system", reason: null, occurredAt: ts(dayOff) });

    write(db.doc(`bookings/${bookingId}`), {
      bookingId,
      tenantId: t.id,
      locationId: loc.id,
      staffId: staffMember.staffId,
      serviceId: svcId,
      variantId,
      addonIds: [],
      customerUserId: c.uid,
      customerName: c.name,
      date: dDate,
      startMinutes: startMin,
      endMinutes: endMin,
      startTime: minsToTime(startMin),
      endTime: minsToTime(endMin),
      durationMinutes: svc.durationMinutes,
      bufferMinutes: svc.bufferMinutes,
      priceSnapshot: svc.price,
      durationSnapshot: svc.durationMinutes,
      variantNameSnapshot: "Standard",
      addonsSnapshot: [],
      serviceNameSnapshot: svc.name,
      locationNameSnapshot: loc.name,
      technicianNameSnapshot: staffMember.displayName,
      status,
      version: 1,
      notes: bi % 4 === 0 ? "Client prefers light pressure for massage." : null,
      lifecycleEvents,
      channel: bi % 5 === 0 ? "phone" : "online",
      createdAt: ts(dayOff - 1),
      updatedAt: ts(dayOff),
    });

    // Charge for completed / confirmed
    if (["completed", "confirmed", "rescheduled"].includes(status)) {
      const tipMinor = Math.round(chargeMinor * (bi % 3 === 0 ? 0.15 : 0));
      write(db.doc(`tenants/${t.id}/charges/ch-${bookingId}`), {
        chargeId: `ch-${bookingId}`,
        bookingId,
        userId: c.uid,
        paymentMethodId: `pm-${c.uid}-0`,
        amount: {
          subtotalMinor: chargeMinor,
          discountMinor: 0,
          tipMinor,
          taxMinor: Math.round(chargeMinor * 0.08),
          totalMinor: chargeMinor + tipMinor + Math.round(chargeMinor * 0.08),
          currency: "USD",
        },
        stripePaymentIntentId: `pi_test_${bookingId.replace(/-/g, "")}`,
        status: "succeeded",
        createdAt: ts(dayOff - 1),
      });
    }

    // Refund for some cancellations
    if (status === "cancelled" && bi % 2 === 0) {
      write(db.doc(`tenants/${t.id}/refunds/ref-${bookingId}`), {
        refundId: `ref-${bookingId}`,
        bookingId,
        status: "issued",
        amountUsd: svc.price,
        reason: "Client requested cancellation",
        requestedAt: ts(dayOff - 1),
        completedAt: ts(dayOff),
      });
    }

    // Review for completed bookings (not all — covers various review states)
    if (status === "completed") {
      const reviewStatuses = ["published", "published", "pending_moderation", "published"];
      const rating = 3 + (bi % 3);
      write(db.doc(`tenants/${t.id}/reviews/rev-${bookingId}`), {
        reviewId: `rev-${bookingId}`,
        tenantId: t.id,
        locationId: loc.id,
        staffId: staffMember.staffId,
        serviceId: svcId,
        bookingId,
        customerId: c.uid,
        rating,
        technicianRating: rating >= 4 ? rating : null,
        technicianComment: null,
        comment: ["Amazing service, will come back!", null, "Good experience overall.", "Loved the atmosphere and results!"][bi % 4],
        status: reviewStatuses[bi % reviewStatuses.length],
        aspectRatings: { Service: rating, Cleanliness: 5, Value: 4, Atmosphere: 5 },
        createdAt: ts(dayOff + 1),
        updatedAt: ts(dayOff + 1),
      });
    }
  }

  await flushBatches();

  // ── 8. Consumer tenantUser memberships (for booking + loyalty access) ──────
  log("\n═══ Step 9: Consumer tenant memberships");

  // Add consumers as 'client' role members of tenants they've booked with
  const consumerTenantPairs = bookingScenarios.map(([tIdx, cIdx]) => [TENANTS[tIdx].id, CONSUMERS[cIdx].uid]);
  const uniquePairs = [...new Map(consumerTenantPairs.map(p => [p[0] + p[1], p])).values()];

  for (const [tenantId, userId] of uniquePairs) {
    write(db.doc(`tenantUsers/${tenantId}_${userId}`), {
      membershipId: `${tenantId}_${userId}`,
      tenantId,
      userId,
      role: "client",
      permissions: [],
      status: "active",
      subscription: { tier: "starter", status: "active", billingCycle: "monthly", startDate: ts(-90), trialEndsAt: null, nextBillingDate: null, suspendedAt: null, suspensionReason: null },
      createdAt: ts(-90),
      updatedAt: ts(-1),
    });
    write(db.doc(`userTenantAccess/${userId}_${tenantId}`), {
      accessId: `${userId}_${tenantId}`,
      userId,
      tenantId,
      accessLevel: "client",
      subscriptionStatus: "active",
      subscribedAt: ts(-90),
      unreadMessageCount: 0,
      lastMessageAt: null,
      lastAccessedAt: ts(-7),
      nextAppointmentAt: null,
      nextAppointmentServiceName: null,
      status: "active",
      updatedAt: ts(-1),
    });
  }

  // Block Henry at one tenant (SA-CRM-006 scenario)
  write(db.doc(`tenants/${TENANTS[1].id}/blockedClients/${CONSUMERS[7].uid}`), {
    clientId: CONSUMERS[7].uid,
    tenantId: TENANTS[1].id,
    reason: "Repeated no-shows",
    blockedAt: ts(-5),
    blockedBy: `qa-owner-${TENANTS[1].ownerSuffix}`,
    expiresAt: ts(25),
  });

  await flushBatches();

  // ── 9. Messaging — threads & messages ─────────────────────────────────────-
  log("\n═══ Step 10: Messaging threads & messages");

  const threadPairs = [
    [0, 0], [0, 1],
    [1, 0], [2, 6], [3, 1],
    [4, 0], [6, 9], [7, 4],
  ];

  for (const [tIdx, cIdx] of threadPairs) {
    const t = TENANTS[tIdx];
    const c = CONSUMERS[cIdx];
    const threadId = `consumer_${t.id}_${[c.uid, t.id].sort().join("_")}`;

    // Global consumer thread
    write(db.doc(`threads/${threadId}`), {
      threadId,
      clientId: c.uid,
      salonId: t.id,
      salonName: t.name,
      lastMessage: "Looking forward to seeing you!",
      lastMessageAt: ts(-1),
      clientUnreadCount: 1,
      isArchived: false,
      isMuted: false,
      isBlocked: false,
    });

    const messages = [
      { sender: "user",  text: "Hi! I'd like to ask about your availability next week." },
      { sender: "salon", text: `Hello! Thanks for reaching out to ${t.name}. We'd love to help!` },
      { sender: "user",  text: "Great — is Tuesday afternoon possible?" },
      { sender: "salon", text: "Looking forward to seeing you!" },
    ];
    for (let m = 0; m < messages.length; m++) {
      write(db.doc(`threads/${threadId}/messages/msg-${threadId}-${m}`), {
        messageId: `msg-${threadId}-${m}`,
        threadId,
        senderType: messages[m].sender,
        senderId: messages[m].sender === "user" ? c.uid : t.id,
        text: messages[m].text,
        status: "read",
        sentAt: ts(-3 + m),
        createdAt: ts(-3 + m),
      });
    }

    // Admin (tenant-scoped) thread
    write(db.doc(`tenants/${t.id}/threads/${threadId}`), {
      threadId,
      tenantId: t.id,
      clientId: c.uid,
      clientName: c.name,
      assignedStaffId: null,
      subject: null,
      lastMessage: "Looking forward to seeing you!",
      lastMessageAt: isoStr(-1),
      unreadCount: 0,
      messageCount: messages.length,
      status: "open",
      isAutoReplied: false,
      tags: [],
    });

    // Admin thread messages
    for (let m = 0; m < messages.length; m++) {
      write(db.doc(`tenants/${t.id}/threads/${threadId}/messages/msg-${threadId}-${m}`), {
        messageId: `msg-${threadId}-${m}`,
        threadId,
        senderType: messages[m].sender,
        senderId: messages[m].sender === "user" ? c.uid : t.id,
        text: messages[m].text,
        status: "read",
        sentAt: ts(-3 + m),
        createdAt: ts(-3 + m),
      });
    }
  }

  await flushBatches();

  // ── 10. Waitlist entries ───────────────────────────────────────────────────
  log("\n═══ Step 11: Waitlist entries");

  // Emma and Frank are on waitlists
  const waitlistEntries = [
    { t: TENANTS[0], c: CONSUMERS[4], svcOff: 0, status: "active" },
    { t: TENANTS[2], c: CONSUMERS[5], svcOff: 1, status: "active" },
    { t: TENANTS[4], c: CONSUMERS[3], svcOff: 2, status: "matched" },
    { t: TENANTS[1], c: CONSUMERS[9], svcOff: 0, status: "expired" },
  ];

  for (const { t, c, svcOff, status } of waitlistEntries) {
    const templates = tenantServiceTemplates(t);
    const svcId = `svc-${t.id}-${(svcOff % templates.length) + 1}`;
    const entryId = `wl-${t.id}-${c.uid}`;
    write(db.doc(`tenants/${t.id}/waitlist/${entryId}`), {
      entryId,
      tenantId: t.id,
      locationId: t.locations[0].id,
      userId: c.uid,
      serviceId: svcId,
      staffId: null,
      dateFrom: dateStr(1),
      dateTo: dateStr(14),
      status,
      createdAt: ts(-3),
      updatedAt: ts(-1),
      matchedSlotId: status === "matched" ? `slot-${entryId}` : null,
      lastNotifiedAt: status === "matched" ? isoStr(-1) : null,
    });
  }

  await flushBatches();

  // ── 11. Featured salons (discovery carousel) ───────────────────────────────
  log("\n═══ Step 12: Discovery featured salons");

  const featured = TENANTS.filter(t => t.status !== "suspended").slice(0, 10);
  for (const t of featured) {
    const loc = t.locations[0];
    const svcs = tenantServiceTemplates(t);
    write(db.doc(`discoveryFeaturedSalons/${t.id}`), {
      tenantId: t.id,
      name: t.name,
      slug: t.slug,
      city: loc.city,
      state: loc.state,
      categories: t.specialty.slice(0, 3),
      rating: 4.4 + (featured.indexOf(t) * 0.1 % 0.6),
      reviewCount: 40 + featured.indexOf(t) * 12,
      priceFrom: svcs[0].price,
      currency: "USD",
      nextAvailableLabel: "Today 3:00 PM",
      featuredService: svcs[0].name,
      member: t.plan !== "starter",
      bookingEnabled: true,
      messageEnabled: true,
      address: { lat: loc.lat, lng: loc.lng },
      updatedAt: ts(-1),
    });
  }

  await flushBatches();

  // ── 12. Platform audit log ─────────────────────────────────────────────────
  log("\n═══ Step 13: Platform audit log");

  const auditEvents = [
    { eventType: "tenant_suspended",  actor: PLATFORM_ADMIN_UID, details: { tenantId: "tenant-suspended-test", reason: "QA test suspension" } },
    { eventType: "impersonation_start", actor: PLATFORM_ADMIN_UID, details: { targetTenantId: TENANTS[0].id, targetUserId: `qa-owner-${TENANTS[0].ownerSuffix}`, durationLimitMin: 30 } },
    { eventType: "ai_budget_updated",  actor: PLATFORM_ADMIN_UID, details: { tenantId: TENANTS[3].id, oldCap: 50000, newCap: 100000 } },
    { eventType: "feature_flag_toggle",actor: PLATFORM_ADMIN_UID, details: { tenantId: TENANTS[2].id, flag: "marketplace_posts", value: true } },
  ];
  for (let i = 0; i < auditEvents.length; i++) {
    write(db.doc(`platformAuditLogs/pal-${i}`), {
      ...auditEvents[i],
      createdAt: ts(-i * 2),
    });
  }

  // Security events
  const secEvents = [
    { type: "impersonation", severity: "low",  tenantId: TENANTS[0].id, resolved: true  },
    { type: "auth_abuse",    severity: "medium",tenantId: null,           resolved: false },
  ];
  for (let i = 0; i < secEvents.length; i++) {
    write(db.doc(`securityEvents/sec-${i}`), {
      ...secEvents[i],
      actor: PLATFORM_ADMIN_UID,
      occurredAt: ts(-i * 3),
    });
  }

  await flushBatches();

  // ── 13. Salon admin analytics seed (for SA-ANA-001 and SA-ANA-010) ─────────
  log("\n═══ Step 14: Popularity index (analytics base)");

  for (const t of TENANTS.slice(0, 6)) {
    const svcs = tenantServiceTemplates(t);
    for (let i = 0; i < Math.min(3, svcs.length); i++) {
      write(db.doc(`tenants/${t.id}/popularityIndex/svc-${t.id}-${i + 1}`), {
        serviceId: `svc-${t.id}-${i + 1}`,
        tenantId: t.id,
        bookingCount30d: 12 - i * 2,
        revenueMinor30d: (12 - i * 2) * svcs[i].price * 100,
        avgRating: 4.7 - i * 0.1,
        updatedAt: ts(-1),
      });
    }
  }

  await flushBatches();

  // ── 14. AI budget & feature flags ─────────────────────────────────────────
  log("\n═══ Step 15: AI toggles & feature flags");

  for (const t of TENANTS.slice(0, 4)) {
    write(db.doc(`tenants/${t.id}/aiToggles/config`), {
      tenantId: t.id,
      schedulingSuggestions: true,
      contentGeneration: true,
      supportRouting: false,
      usageMaxMonthlyTokens: 100000,
      usedThisMonth: 12400,
      resetAt: ts(1),
      updatedAt: ts(-1),
    });
    write(db.doc(`tenants/${t.id}/featureFlags/flags`), {
      tenantId: t.id,
      marketplace_posts: true,
      ai_scheduling: t.plan !== "starter",
      loyalty_v2: true,
      dispute_management: true,
      updatedAt: ts(-1),
    });
  }

  // GDPR export requests
  write(db.doc(`tenants/${TENANTS[0].id}/gdprExports/gdpr-req-1`), {
    requestId: "gdpr-req-1",
    userId: CONSUMERS[0].uid,
    tenantId: TENANTS[0].id,
    status: "pending",
    requestedAt: ts(-2),
  });

  await flushBatches();

  log(`\n✅ Done! Total documents written: ${totalWrites}`);
  log(`\n─── Quick-reference credentials ─────────────────────────────────────`);
  log(`Platform admin:  qa-platform-admin@zarkili.dev  /  QaAdmin@Zarkili2026!`);
  log(`Consumer Alice:  qa-alice@zarkili.dev  /  QaTest@2026!  (gold tier, cards on file)`);
  log(`Consumer Bob:    qa-bob@zarkili.dev    /  QaTest@2026!  (platinum tier, 2 cards)`);
  log(`Consumer Carol:  qa-carol@zarkili.dev  /  QaTest@2026!  (fresh, no history)`);
  log(`Consumer Dave:   qa-dave@zarkili.dev   /  QaTest@2026!  (cancelled booking w/ dispute)`);
  log(`Consumer Emma:   qa-emma@zarkili.dev   /  QaTest@2026!  (active on waitlists)`);
  log(`Consumer Iris:   qa-iris@zarkili.dev   /  QaTest@2026!  (no Stripe customer, no card)`);
  log(`Consumer Henry:  qa-henry@zarkili.dev  /  QaTest@2026!  (blocked at Crown Republic)`);
  log(`Tenant owner (Velvet & Bloom):  qa-owner-vb@zarkili.dev  /  QaOwner@2026!`);
  log(`Tenant owner (Crown Republic):  qa-owner-cr@zarkili.dev  /  QaOwner@2026!`);
  log(`Tenant owner (Glow District):   qa-owner-gd@zarkili.dev  /  QaOwner@2026!`);
  log(`... all owners follow pattern: qa-owner-{ownerSuffix}@zarkili.dev / QaOwner@2026!`);
  log(`─────────────────────────────────────────────────────────────────────`);
}

// ─── Util helpers ─────────────────────────────────────────────────────────────

function minsToTime(mins) {
  const h = String(Math.floor(mins / 60)).padStart(2, "0");
  const m = String(mins % 60).padStart(2, "0");
  return `${h}:${m}`;
}

function regionTimezone(region) {
  return {
    "Northeast":       "America/New_York",
    "Midwest":         "America/Chicago",
    "Southeast":       "America/New_York",
    "South Central":   "America/Chicago",
    "Mountain West":   "America/Denver",
    "West Coast":      "America/Los_Angeles",
    "Pacific Northwest":"America/Los_Angeles",
    "Southwest":       "America/Phoenix",
  }[region] ?? "America/New_York";
}

function tenantColor(tenantId) {
  const colors = {
    "tenant-velvet-bloom":    "#7B4F7C",
    "tenant-crown-republic":  "#2C3E50",
    "tenant-glow-district":   "#E8A598",
    "tenant-botanika":        "#4A7C59",
    "tenant-studio-nico":     "#1A1A2E",
    "tenant-chop-shop":       "#8B1A1A",
    "tenant-aqua-salon":      "#006D8F",
    "tenant-pigment-studio":  "#FF6B6B",
    "tenant-bloom-branch":    "#F7C59F",
    "tenant-iron-oak":        "#5C4033",
    "tenant-mist-moss":       "#3A7D6E",
    "tenant-parlor-nash":     "#C9963D",
    "tenant-allure-atl":      "#8E44AD",
    "tenant-summit-style":    "#2980B9",
    "tenant-beacon-mane":     "#2C2C2C",
    "tenant-suspended-test":  "#999999",
  };
  return colors[tenantId] ?? "#333333";
}

// ─── Run ────────────────────────────────────────────────────────────────────-

seed().catch(err => {
  console.error("[seed] FATAL:", err);
  process.exit(1);
});
