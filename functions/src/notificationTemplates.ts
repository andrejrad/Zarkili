/**
 * notificationTemplates.ts
 *
 * Cloud Function: previewNotificationTemplate
 *
 * An `onCall` endpoint that renders a notification template for a given
 * tenant + event type + locale so admin staff can QA templates before delivery.
 *
 * Input (PreviewTemplateInput)
 * ────────────────────────────
 *   tenantId   string               Required
 *   eventType  NotificationEventType Required
 *   locale     SupportedLanguage    Optional — falls back to tenant defaultLanguage → "en"
 *   sampleVars Record<string,string> Optional — custom replacement values for preview
 *
 * Output (PreviewTemplateOutput)
 * ──────────────────────────────
 *   subject        string
 *   body           string
 *   resolvedLocale SupportedLanguage
 *   source         "tenant_override" | "built_in"
 *
 * NOTE ON SELF-CONTAINMENT
 * ────────────────────────
 * This file intentionally mirrors the pure (non-Firebase) types and logic from
 * src/domains/notifications/ so the functions package can compile and deploy
 * without depending on the client-side firebase/firestore SDK.
 */

import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";

if (getApps().length === 0) {
  initializeApp();
}

// ---------------------------------------------------------------------------
// Mirrored pure types (no firebase/firestore dependency)
// ---------------------------------------------------------------------------

type NotificationEventType =
  | "booking_created"
  | "booking_confirmed"
  | "booking_rejected"
  | "booking_cancelled"
  | "booking_rescheduled"
  | "reminder_due";

const ALL_NOTIFICATION_EVENT_TYPES: NotificationEventType[] = [
  "booking_created",
  "booking_confirmed",
  "booking_rejected",
  "booking_cancelled",
  "booking_rescheduled",
  "reminder_due",
];

type SupportedLanguage = "en" | "hr" | "es";
const SUPPORTED_LANGUAGES: SupportedLanguage[] = ["en", "hr", "es"];
const FALLBACK_LANGUAGE: SupportedLanguage = "en";

type TemplateBody = { subject: string; body: string };
type TemplateVariables = Record<string, string>;
type TemplatesByLocale = Partial<Record<SupportedLanguage, TemplateBody>>;

// ---------------------------------------------------------------------------
// Built-in template defaults (mirrored from notificationTemplateModel.ts)
// ---------------------------------------------------------------------------

const BUILT_IN_TEMPLATES: Record<NotificationEventType, TemplatesByLocale> = {
  booking_created: {
    en: { subject: "Booking request received — {{tenantName}}", body: "Hi {{customerName}},\n\nYour booking request for {{serviceName}} with {{staffName}} on {{date}} at {{time}} has been received.\n\nWe will confirm it shortly.\n\n— {{tenantName}}" },
    hr: { subject: "Zahtjev za rezervaciju primljen — {{tenantName}}", body: "Pozdrav {{customerName}},\n\nVaš zahtjev za rezervaciju usluge {{serviceName}} s {{staffName}} dana {{date}} u {{time}} je primljen.\n\nUskoro ćemo vas potvrditi.\n\n— {{tenantName}}" },
    es: { subject: "Solicitud de reserva recibida — {{tenantName}}", body: "Hola {{customerName}},\n\nHemos recibido tu solicitud para {{serviceName}} con {{staffName}} el {{date}} a las {{time}}.\n\nTe confirmaremos pronto.\n\n— {{tenantName}}" },
  },
  booking_confirmed: {
    en: { subject: "Booking confirmed — {{serviceName}} on {{date}}", body: "Hi {{customerName}},\n\nYour booking is confirmed!\n\nService:  {{serviceName}}\nWith:     {{staffName}}\nDate:     {{date}}\nTime:     {{time}}\n\nSee you soon!\n— {{tenantName}}" },
    hr: { subject: "Rezervacija potvrđena — {{serviceName}} na {{date}}", body: "Pozdrav {{customerName}},\n\nVaša rezervacija je potvrđena!\n\nUsluga:  {{serviceName}}\nS:       {{staffName}}\nDatum:   {{date}}\nVrijeme: {{time}}\n\nVidimo se uskoro!\n— {{tenantName}}" },
    es: { subject: "Reserva confirmada — {{serviceName}} el {{date}}", body: "Hola {{customerName}},\n\n¡Tu reserva está confirmada!\n\nServicio: {{serviceName}}\nCon:      {{staffName}}\nFecha:    {{date}}\nHora:     {{time}}\n\n¡Hasta pronto!\n— {{tenantName}}" },
  },
  booking_rejected: {
    en: { subject: "Booking request declined — {{tenantName}}", body: "Hi {{customerName}},\n\nUnfortunately your booking request for {{serviceName}} on {{date}} at {{time}} could not be accepted.\n\nReason: {{reason}}\n\nPlease contact us to reschedule.\n— {{tenantName}}" },
    hr: { subject: "Zahtjev za rezervaciju odbijen — {{tenantName}}", body: "Pozdrav {{customerName}},\n\nNažalost, vaš zahtjev za rezervaciju usluge {{serviceName}} dana {{date}} u {{time}} nije prihvaćen.\n\nRazlog: {{reason}}\n\nKontaktirajte nas za novi termin.\n— {{tenantName}}" },
    es: { subject: "Solicitud de reserva rechazada — {{tenantName}}", body: "Hola {{customerName}},\n\nLamentablemente tu solicitud para {{serviceName}} el {{date}} a las {{time}} no pudo ser aceptada.\n\nMotivo: {{reason}}\n\nContáctanos para reprogramar.\n— {{tenantName}}" },
  },
  booking_cancelled: {
    en: { subject: "Booking cancelled — {{serviceName}} on {{date}}", body: "Hi {{customerName}},\n\nYour booking for {{serviceName}} with {{staffName}} on {{date}} at {{time}} has been cancelled.\n\nReason: {{reason}}\n\nWe hope to see you again soon.\n— {{tenantName}}" },
    hr: { subject: "Rezervacija otkazana — {{serviceName}} na {{date}}", body: "Pozdrav {{customerName}},\n\nVaša rezervacija za uslugu {{serviceName}} s {{staffName}} dana {{date}} u {{time}} je otkazana.\n\nRazlog: {{reason}}\n\nNadamo se da ćemo vas vidjeti uskoro.\n— {{tenantName}}" },
    es: { subject: "Reserva cancelada — {{serviceName}} el {{date}}", body: "Hola {{customerName}},\n\nTu reserva de {{serviceName}} con {{staffName}} el {{date}} a las {{time}} ha sido cancelada.\n\nMotivo: {{reason}}\n\nEsperamos verte pronto.\n— {{tenantName}}" },
  },
  booking_rescheduled: {
    en: { subject: "Booking rescheduled — {{serviceName}}", body: "Hi {{customerName}},\n\nYour booking for {{serviceName}} has been rescheduled.\n\nPrevious: {{previousDate}} at {{previousTime}}\nNew:      {{date}} at {{time}}\nWith:     {{staffName}}\n\n— {{tenantName}}" },
    hr: { subject: "Rezervacija preplanirana — {{serviceName}}", body: "Pozdrav {{customerName}},\n\nVaša rezervacija za uslugu {{serviceName}} je preplanirana.\n\nPrije:   {{previousDate}} u {{previousTime}}\nNovo:    {{date}} u {{time}}\nS:       {{staffName}}\n\n— {{tenantName}}" },
    es: { subject: "Reserva reprogramada — {{serviceName}}", body: "Hola {{customerName}},\n\nTu reserva de {{serviceName}} ha sido reprogramada.\n\nAnterior: {{previousDate}} a las {{previousTime}}\nNueva:    {{date}} a las {{time}}\nCon:      {{staffName}}\n\n— {{tenantName}}" },
  },
  reminder_due: {
    en: { subject: "Reminder: {{serviceName}} tomorrow with {{staffName}}", body: "Hi {{customerName}},\n\nJust a friendly reminder about your upcoming appointment:\n\nService: {{serviceName}}\nWith:    {{staffName}}\nDate:    {{date}}\nTime:    {{time}}\n\nSee you soon!\n— {{tenantName}}" },
    hr: { subject: "Podsjetnik: {{serviceName}} sutra s {{staffName}}", body: "Pozdrav {{customerName}},\n\nPodsjećamo vas na vaš nadolazeći termin:\n\nUsluga:  {{serviceName}}\nS:       {{staffName}}\nDatum:   {{date}}\nVrijeme: {{time}}\n\nVidimo se uskoro!\n— {{tenantName}}" },
    es: { subject: "Recordatorio: {{serviceName}} mañana con {{staffName}}", body: "Hola {{customerName}},\n\nTe recordamos tu próxima cita:\n\nServicio: {{serviceName}}\nCon:      {{staffName}}\nFecha:    {{date}}\nHora:     {{time}}\n\n¡Hasta pronto!\n— {{tenantName}}" },
  },
};

// ---------------------------------------------------------------------------
// Pure renderer helpers (mirrored from templateRenderer.ts)
// ---------------------------------------------------------------------------

function renderTemplate(
  template: TemplateBody,
  variables: TemplateVariables,
): { subject: string; body: string } {
  const interpolate = (text: string) =>
    text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => variables[key] ?? "");
  return { subject: interpolate(template.subject), body: interpolate(template.body) };
}

function resolveLocaleChain(
  userLang: SupportedLanguage | undefined,
  tenantLang: SupportedLanguage | undefined,
): SupportedLanguage[] {
  const chain: SupportedLanguage[] = [];
  const push = (l: SupportedLanguage | undefined) => {
    if (l && SUPPORTED_LANGUAGES.includes(l) && !chain.includes(l)) chain.push(l);
  };
  push(userLang);
  push(tenantLang);
  push(FALLBACK_LANGUAGE);
  return chain;
}

function resolveAndRender(
  eventType: NotificationEventType,
  tenantTranslations: TemplatesByLocale | null,
  variables: TemplateVariables,
  localeChain: SupportedLanguage[],
): { subject: string; body: string; resolvedLocale: SupportedLanguage; source: "tenant_override" | "built_in" } {
  const builtIn = BUILT_IN_TEMPLATES[eventType];

  for (const locale of localeChain) {
    const tenantBody = tenantTranslations?.[locale];
    if (tenantBody) {
      return { ...renderTemplate(tenantBody, variables), resolvedLocale: locale, source: "tenant_override" };
    }
    const builtInBody = builtIn[locale];
    if (builtInBody) {
      return { ...renderTemplate(builtInBody, variables), resolvedLocale: locale, source: "built_in" };
    }
  }

  // Ultimate fallback
  const fallback = builtIn[FALLBACK_LANGUAGE] ?? { subject: "", body: "" };
  return { ...renderTemplate(fallback, variables), resolvedLocale: FALLBACK_LANGUAGE, source: "built_in" };
}

// ---------------------------------------------------------------------------
// Sample variables used when the caller provides no sampleVars
// ---------------------------------------------------------------------------

const DEFAULT_SAMPLE_VARS: TemplateVariables = {
  customerName: "Jane Smith",
  serviceName: "Haircut & Style",
  staffName: "Ana K.",
  date: "Mon, 15 Sep 2025",
  time: "09:00",
  tenantName: "My Salon",
  reason: "Staff unavailable",
  previousDate: "Fri, 12 Sep 2025",
  previousTime: "14:00",
  appointmentAt: "2025-09-15T09:00:00.000Z",
};

// ---------------------------------------------------------------------------
// Input / Output types
// ---------------------------------------------------------------------------

type PreviewTemplateInput = {
  tenantId: string;
  eventType: string;
  locale?: string;
  sampleVars?: Record<string, string>;
};

type PreviewTemplateOutput = {
  subject: string;
  body: string;
  resolvedLocale: SupportedLanguage;
  source: "tenant_override" | "built_in";
};

type TenantDoc = { defaultLanguage?: string; tenantId?: string };
type TemplateDoc = { translations?: TemplatesByLocale };

// ---------------------------------------------------------------------------
// Pure preview logic (exported for unit testing)
// ---------------------------------------------------------------------------

export async function runPreview(
  input: PreviewTemplateInput,
  db: FirebaseFirestore.Firestore,
): Promise<PreviewTemplateOutput> {
  // ── Validation ────────────────────────────────────────────────────────────

  if (!input.tenantId?.trim()) {
    throw new HttpsError("invalid-argument", "tenantId is required");
  }
  if (!ALL_NOTIFICATION_EVENT_TYPES.includes(input.eventType as NotificationEventType)) {
    throw new HttpsError(
      "invalid-argument",
      `eventType must be one of: ${ALL_NOTIFICATION_EVENT_TYPES.join(", ")}`,
    );
  }
  if (input.locale !== undefined && !SUPPORTED_LANGUAGES.includes(input.locale as SupportedLanguage)) {
    throw new HttpsError(
      "invalid-argument",
      `locale must be one of: ${SUPPORTED_LANGUAGES.join(", ")}`,
    );
  }

  const eventType = input.eventType as NotificationEventType;
  const userLocale = input.locale as SupportedLanguage | undefined;

  // ── Fetch tenant + template in parallel ───────────────────────────────────

  const templateId = `${input.tenantId}_${eventType}`;
  const [tenantSnap, templateSnap] = await Promise.all([
    db.collection("tenants").doc(input.tenantId).get(),
    db.collection("tenantNotificationTemplates").doc(templateId).get(),
  ]);

  if (!tenantSnap.exists) {
    throw new HttpsError("not-found", `Tenant ${input.tenantId} not found`);
  }

  const tenant = tenantSnap.data() as TenantDoc;
  const tenantLanguage = tenant.defaultLanguage as SupportedLanguage | undefined;
  const tenantTranslations = templateSnap.exists
    ? ((templateSnap.data() as TemplateDoc).translations ?? null)
    : null;

  // ── Resolve locale chain and render ──────────────────────────────────────

  const localeChain = resolveLocaleChain(userLocale, tenantLanguage);
  const vars: TemplateVariables = { ...DEFAULT_SAMPLE_VARS, ...(input.sampleVars ?? {}) };

  return resolveAndRender(eventType, tenantTranslations, vars, localeChain);
}

// ---------------------------------------------------------------------------
// Cloud Function export
// ---------------------------------------------------------------------------

export const previewNotificationTemplate = onCall<PreviewTemplateInput>(
  async (request) => {
    const db = getFirestore();
    return runPreview(request.data, db);
  },
);
