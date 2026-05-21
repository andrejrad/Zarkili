/**
 * functions/src/receipts.ts  (W24-DEBT-3)
 *
 * `receiptsGeneratePdf` — onCall callable that:
 *   1. Reads the charge + booking + service + location + payment method docs
 *      using the Admin SDK (same read chain as the client-side receiptDataService).
 *   2. Generates a compact PDF receipt using pdfkit.
 *   3. Uploads the PDF to Firebase Storage at receipts/{userId}/{bookingId}.pdf.
 *   4. Returns a signed download URL (1 hour expiry).
 *
 * Security: caller must own the booking (uid === userId).
 *
 * Storage path: receipts/{userId}/{bookingId}.pdf
 */

import PDFDocument from "pdfkit";
import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { HttpsError, onCall } from "firebase-functions/v2/https";

if (getApps().length === 0) {
  initializeApp();
}

// ---------------------------------------------------------------------------
// Internal document shapes (mirrors receiptDataService on the client)
// ---------------------------------------------------------------------------

type ChargeDoc = {
  chargeId: string;
  bookingId: string;
  userId: string;
  paymentMethodId: string;
  amount: {
    subtotalMinor: number;
    discountMinor: number;
    tipMinor: number;
    taxMinor: number;
    totalMinor: number;
    currency: string;
  };
  createdAt?: { seconds?: number } | null;
};

type BookingDoc = {
  serviceId: string;
  locationId: string;
  date: string;
  startTime: string;
};

type ServiceDoc = { name?: string };
type LocationDoc = {
  name?: string;
  address?: {
    line1?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  };
};
type PaymentMethodDoc = { brand?: string; last4?: string };

// ---------------------------------------------------------------------------
// PDF builder
// ---------------------------------------------------------------------------

type ReceiptPdfData = {
  salonName: string;
  salonAddress: string;
  occurredAtLabel: string;
  serviceName: string;
  subtotalUsd: number;
  taxUsd: number;
  tipUsd: number;
  totalUsd: number;
  currency: string;
  paymentMethodLabel: string;
};

function buildPdfBuffer(data: ReceiptPdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A5", margin: 40, info: { Title: "Receipt" } });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const currency = (data.currency ?? "usd").toUpperCase();
    const fmt = (n: number) => `${currency} ${n.toFixed(2)}`;

    // --- Header ---
    doc.fontSize(16).font("Helvetica-Bold").text(data.salonName, { align: "center" });
    if (data.salonAddress) {
      doc.fontSize(9).font("Helvetica").text(data.salonAddress, { align: "center" });
    }
    doc.moveDown(0.5);
    doc.fontSize(9).text(data.occurredAtLabel, { align: "center" });
    doc.moveDown(1);

    // --- Divider ---
    doc
      .moveTo(doc.page.margins.left, doc.y)
      .lineTo(doc.page.width - doc.page.margins.right, doc.y)
      .stroke();
    doc.moveDown(0.5);

    // --- Line items ---
    doc.fontSize(11).font("Helvetica").text(data.serviceName, { continued: true });
    doc.text(fmt(data.subtotalUsd), { align: "right" });

    if (data.taxUsd > 0) {
      doc.fontSize(10).text("Tax", { continued: true });
      doc.text(fmt(data.taxUsd), { align: "right" });
    }
    if (data.tipUsd > 0) {
      doc.fontSize(10).text("Tip", { continued: true });
      doc.text(fmt(data.tipUsd), { align: "right" });
    }

    doc.moveDown(0.5);
    doc
      .moveTo(doc.page.margins.left, doc.y)
      .lineTo(doc.page.width - doc.page.margins.right, doc.y)
      .stroke();
    doc.moveDown(0.5);

    // --- Total ---
    doc.fontSize(13).font("Helvetica-Bold").text("Total", { continued: true });
    doc.text(fmt(data.totalUsd), { align: "right" });

    doc.moveDown(0.8);

    // --- Payment method ---
    doc.fontSize(9).font("Helvetica").fillColor("#555555");
    doc.text(`Paid with: ${data.paymentMethodLabel}`, { align: "center" });

    doc.end();
  });
}

// ---------------------------------------------------------------------------
// Cloud Function
// ---------------------------------------------------------------------------

type GeneratePdfInput = {
  tenantId: string;
  bookingId: string;
  userId: string;
};

export const receiptsGeneratePdf = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication is required");
  }

  const input = request.data as GeneratePdfInput;
  if (!input?.tenantId || typeof input.tenantId !== "string") {
    throw new HttpsError("invalid-argument", "tenantId is required");
  }
  if (!input?.bookingId || typeof input.bookingId !== "string") {
    throw new HttpsError("invalid-argument", "bookingId is required");
  }
  if (!input?.userId || typeof input.userId !== "string") {
    throw new HttpsError("invalid-argument", "userId is required");
  }
  if (request.auth.uid !== input.userId) {
    throw new HttpsError("permission-denied", "You may only generate receipts for your own bookings");
  }

  const { tenantId, bookingId, userId } = input;
  const db = getFirestore();

  // 1. Find the charge for this booking.
  const chargesSnap = await db
    .collection(`tenants/${tenantId}/charges`)
    .where("bookingId", "==", bookingId)
    .where("userId", "==", userId)
    .limit(1)
    .get();

  if (chargesSnap.empty) {
    throw new HttpsError("not-found", "No charge found for this booking");
  }

  const chargeDoc = chargesSnap.docs[0].data() as ChargeDoc;
  const { amount, paymentMethodId } = chargeDoc;

  // Derive display timestamp.
  let occurredAtLabel = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  if (chargeDoc.createdAt?.seconds) {
    occurredAtLabel = new Date(chargeDoc.createdAt.seconds * 1000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  // 2. Booking doc for serviceId / locationId.
  const bookingSnap = await db.doc(`bookings/${bookingId}`).get();
  const booking: BookingDoc = bookingSnap.exists
    ? (bookingSnap.data() as BookingDoc)
    : { serviceId: "", locationId: "", date: "", startTime: "" };

  // 3. Service name.
  let serviceName = "Service";
  if (booking.serviceId && booking.locationId) {
    const serviceSnap = await db
      .collection("brands").doc(tenantId)
      .collection("locations").doc(booking.locationId)
      .collection("service_types").doc(booking.serviceId)
      .get();
    if (serviceSnap.exists) {
      serviceName = (serviceSnap.data() as ServiceDoc).name ?? "Service";
    }
  }

  // 4. Location name + address.
  let salonName = "Salon";
  let salonAddress = "";
  if (booking.locationId) {
    const locationSnap = await db.doc(`locations/${booking.locationId}`).get();
    if (locationSnap.exists) {
      const loc = locationSnap.data() as LocationDoc;
      salonName = loc.name ?? "Salon";
      if (loc.address) {
        const a = loc.address;
        salonAddress = [a.line1, a.city, a.postalCode].filter(Boolean).join(", ");
      }
    }
  }

  // 5. Payment method label.
  let paymentMethodLabel = "Card on file";
  if (paymentMethodId) {
    const pmSnap = await db.doc(`clients/${userId}/paymentMethods/${paymentMethodId}`).get();
    if (pmSnap.exists) {
      const pm = pmSnap.data() as PaymentMethodDoc;
      const brand = pm.brand
        ? pm.brand.charAt(0).toUpperCase() + pm.brand.slice(1)
        : "Card";
      paymentMethodLabel = pm.last4 ? `${brand} ending ${pm.last4}` : brand;
    }
  }

  // 6. Build PDF buffer.
  const pdfBuffer = await buildPdfBuffer({
    salonName,
    salonAddress,
    occurredAtLabel,
    serviceName,
    subtotalUsd: (amount.subtotalMinor ?? 0) / 100,
    taxUsd: (amount.taxMinor ?? 0) / 100,
    tipUsd: (amount.tipMinor ?? 0) / 100,
    totalUsd: (amount.totalMinor ?? 0) / 100,
    currency: amount.currency ?? "usd",
    paymentMethodLabel,
  });

  // 7. Upload to Firebase Storage.
  const bucket = getStorage().bucket();
  const storagePath = `receipts/${userId}/${bookingId}.pdf`;
  const file = bucket.file(storagePath);
  await file.save(pdfBuffer, {
    contentType: "application/pdf",
    metadata: { cacheControl: "private, max-age=3600" },
  });

  // 8. Return a 1-hour signed URL.
  const [downloadUrl] = await file.getSignedUrl({
    action: "read",
    expires: Date.now() + 3600 * 1000,
  });

  return { downloadUrl };
});
