#!/usr/bin/env node
/**
 * inspect-old-zara.js
 *
 * Inspects the structure of the OLD Zara Firestore project.
 * Prints field names and types only — NO personal data values are printed.
 *
 * Purpose:
 *   Produces a schema report that is used to build the migration extraction
 *   script (run-zara-migration.js). Run this once, paste the output to Copilot.
 *
 * Prerequisites:
 *   1. Download a service account key from the OLD (source) Firebase project:
 *      Firebase Console → Project Settings → Service accounts → Generate new private key
 *   2. Save the JSON file somewhere safe (NOT inside this repo).
 *
 * Usage (run from the repo root):
 *   node scripts/inspect-old-zara.js /path/to/old-serviceAccount.json
 *
 * Or from the functions/ directory (where firebase-admin is installed):
 *   node ../scripts/inspect-old-zara.js /path/to/old-serviceAccount.json
 */

'use strict';

const path = require('path');
const fs   = require('fs');

// ------------------------------------------------------------------
// Resolve firebase-admin from functions/node_modules
// ------------------------------------------------------------------
const adminPath = path.resolve(__dirname, '../functions/node_modules/firebase-admin');
let admin;
try {
  admin = require(adminPath);
} catch {
  // Fallback: try global install
  try {
    admin = require('firebase-admin');
  } catch {
    console.error(
      'firebase-admin not found. Run this script from the repo root:\n' +
      '  node scripts/inspect-old-zara.js /path/to/serviceAccount.json'
    );
    process.exit(1);
  }
}

// ------------------------------------------------------------------
// Load service account
// ------------------------------------------------------------------
const serviceAccountPath = process.argv[2];
if (!serviceAccountPath) {
  console.error(
    'Usage: node scripts/inspect-old-zara.js <path-to-serviceAccount.json>\n' +
    'Download the key from: Firebase Console → Project Settings → Service accounts'
  );
  process.exit(1);
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(fs.readFileSync(path.resolve(serviceAccountPath), 'utf8'));
} catch (err) {
  console.error(`Could not read service account file: ${err.message}`);
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

/**
 * Returns the "type label" of a Firestore field value.
 * Does NOT return the actual value.
 */
function typeOf(value) {
  if (value === null || value === undefined)                   return 'null';
  if (value && typeof value.toDate === 'function')            return 'Timestamp';
  if (value && value._firestore)                              return 'DocumentReference';
  if (Array.isArray(value)) {
    const sample = value[0];
    const itemType = sample === undefined ? 'unknown' : typeOf(sample);
    return `Array[${value.length}] of ${itemType}`;
  }
  if (typeof value === 'object') {
    const keys = Object.keys(value).join(', ');
    return `Object { ${keys} }`;
  }
  return typeof value; // string | number | boolean
}

/**
 * Converts a Firestore document snapshot to a { id, schema } object.
 */
function schemaOf(doc) {
  const data = doc.data();
  if (!data) return { id: doc.id, schema: {} };
  const schema = {};
  for (const [key, value] of Object.entries(data)) {
    schema[key] = typeOf(value);
  }
  return { id: doc.id, schema };
}

/**
 * Prints the schema for up to `limit` documents in a collection.
 */
async function inspectCollection(colName, limit = 3) {
  const SEP = '─'.repeat(56);
  console.log(`\n┌${SEP}┐`);
  console.log(`│  Collection: ${colName.padEnd(42)}│`);
  console.log(`└${SEP}┘`);

  try {
    const snapshot = await db.collection(colName).limit(limit).get();
    if (snapshot.empty) {
      console.log('  (empty or does not exist)');
      return 0;
    }

    let count = 0;
    snapshot.forEach((doc) => {
      count++;
      const { id, schema } = schemaOf(doc);
      console.log(`\n  ── Document ${count} (id: ${id}) ──`);
      const maxKey = Math.max(...Object.keys(schema).map(k => k.length), 12);
      for (const [field, type] of Object.entries(schema)) {
        console.log(`    ${field.padEnd(maxKey + 2)} ${type}`);
      }
    });

    // Approximate count
    const countSnap = await db.collection(colName).count().get();
    console.log(`\n  Total documents: ${countSnap.data().count}`);
    return count;

  } catch (err) {
    console.log(`  ERROR: ${err.message}`);
    return 0;
  }
}

/**
 * For collections that may contain role/loyalty info as subcollections,
 * inspect the first subcollection found.
 */
async function inspectSubcollections(parentCol, limit = 1) {
  try {
    const snap = await db.collection(parentCol).limit(1).get();
    if (snap.empty) return;

    const parentDoc = snap.docs[0];
    const subcols = await parentDoc.ref.listCollections();
    if (subcols.length === 0) {
      console.log(`\n  (no subcollections under ${parentCol}/${parentDoc.id})`);
      return;
    }

    for (const subcolRef of subcols) {
      const subSnap = await subcolRef.limit(2).get();
      console.log(`\n  Subcollection: ${parentCol}/${parentDoc.id}/${subcolRef.id}`);
      subSnap.forEach((doc) => {
        const { schema } = schemaOf(doc);
        const maxKey = Math.max(...Object.keys(schema).map(k => k.length), 12);
        console.log(`    ── doc id: ${doc.id}`);
        for (const [field, type] of Object.entries(schema)) {
          console.log(`      ${field.padEnd(maxKey + 2)} ${type}`);
        }
      });
    }
  } catch (err) {
    console.log(`  Subcollection inspection error: ${err.message}`);
  }
}

// ------------------------------------------------------------------
// Main
// ------------------------------------------------------------------
async function main() {
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║        Zara Old Firestore — Structure Report         ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log(`Project ID : ${serviceAccount.project_id}`);
  console.log(`Run at     : ${new Date().toISOString()}`);
  console.log('NOTE: Only field names and types are shown. No personal data.');

  // Core collections to inspect
  const collections = [
    'users',
    'bookings',
    'loyaltySettings',
    'settings',
    'services',
    'availability',
    'waitingList',
  ];

  for (const col of collections) {
    await inspectCollection(col, 2);
  }

  // Check for subcollections under users (loyalty transactions, etc.)
  console.log('\n\n── Checking subcollections under users/ ──');
  await inspectSubcollections('users', 1);

  // Check for subcollections under bookings
  console.log('\n── Checking subcollections under bookings/ ──');
  await inspectSubcollections('bookings', 1);

  console.log('\n\n══════════════════════════════════════════════════════');
  console.log('Inspection complete. Copy everything above this line');
  console.log('and paste it to GitHub Copilot to build the extractor.');
  console.log('══════════════════════════════════════════════════════\n');

  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
