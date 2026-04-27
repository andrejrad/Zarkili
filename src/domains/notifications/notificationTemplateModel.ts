/**
 * notificationTemplateModel.ts
 *
 * Tenant-level notification template defaults, stored in Firestore under
 * `tenantNotificationTemplates/{tenantId}_{eventType}`.
 *
 * Each document holds per-language versions of a subject + body pair.
 * Placeholders use the `{{variableName}}` syntax and are interpolated at
 * send time by `templateRenderer.ts`.
 *
 * Available placeholder variables by event type
 * ──────────────────────────────────────────────
 * All booking events share:
 *   {{customerName}}  {{serviceName}}  {{staffName}}
 *   {{date}}          {{time}}         {{tenantName}}
 *
 * booking_rejected / booking_cancelled:
 *   {{reason}}
 *
 * booking_rescheduled:
 *   {{previousDate}}  {{previousTime}}
 *
 * reminder_due:
 *   {{appointmentAt}}  (ISO-8601 datetime)
 */

import { Timestamp } from "firebase/firestore";

import type { NotificationEventType } from "./notificationEventModel";
import type { SupportedLanguage } from "../../shared/i18n";

// ---------------------------------------------------------------------------
// Core template types
// ---------------------------------------------------------------------------

export type TemplateBody = {
  /** Used as the email subject and the in-app notification title */
  subject: string;
  /** Multi-line template text; placeholders in `{{variableName}}` format */
  body: string;
};

/**
 * Per-tenant, per-event-type template document.
 * `translations` is a partial map — missing locales fall back to the tenant's
 * defaultLanguage, then to the built-in English defaults.
 */
export type TenantNotificationTemplate = {
  /** `${tenantId}_${eventType}` */
  templateId: string;
  tenantId: string;
  eventType: NotificationEventType;
  translations: Partial<Record<SupportedLanguage, TemplateBody>>;
  updatedAt: Timestamp;
};

export type CreateTenantNotificationTemplateInput = Omit<
  TenantNotificationTemplate,
  "templateId" | "updatedAt"
>;

// ---------------------------------------------------------------------------
// Built-in default templates (used when no tenant override exists)
// ---------------------------------------------------------------------------

/**
 * System defaults per eventType × locale.
 * Extends to hr and es for the reminder and confirmed event to demonstrate
 * multi-language support; other event types default to English only.
 */
export const BUILT_IN_TEMPLATES: Record<
  NotificationEventType,
  Partial<Record<SupportedLanguage, TemplateBody>>
> = {
  booking_created: {
    en: {
      subject: "Booking request received — {{tenantName}}",
      body: "Hi {{customerName}},\n\nYour booking request for {{serviceName}} with {{staffName}} on {{date}} at {{time}} has been received.\n\nWe will confirm it shortly.\n\n— {{tenantName}}",
    },
    hr: {
      subject: "Zahtjev za rezervaciju primljen — {{tenantName}}",
      body: "Pozdrav {{customerName}},\n\nVaš zahtjev za rezervaciju usluge {{serviceName}} s {{staffName}} dana {{date}} u {{time}} je primljen.\n\nUskoro ćemo vas potvrditi.\n\n— {{tenantName}}",
    },
    es: {
      subject: "Solicitud de reserva recibida — {{tenantName}}",
      body: "Hola {{customerName}},\n\nHemos recibido tu solicitud para {{serviceName}} con {{staffName}} el {{date}} a las {{time}}.\n\nTe confirmaremos pronto.\n\n— {{tenantName}}",
    },
  },

  booking_confirmed: {
    en: {
      subject: "Booking confirmed — {{serviceName}} on {{date}}",
      body: "Hi {{customerName}},\n\nYour booking is confirmed!\n\nService:  {{serviceName}}\nWith:     {{staffName}}\nDate:     {{date}}\nTime:     {{time}}\n\nSee you soon!\n— {{tenantName}}",
    },
    hr: {
      subject: "Rezervacija potvrđena — {{serviceName}} na {{date}}",
      body: "Pozdrav {{customerName}},\n\nVaša rezervacija je potvrđena!\n\nUsluga:  {{serviceName}}\nS:       {{staffName}}\nDatum:   {{date}}\nVrijeme: {{time}}\n\nVidimo se uskoro!\n— {{tenantName}}",
    },
    es: {
      subject: "Reserva confirmada — {{serviceName}} el {{date}}",
      body: "Hola {{customerName}},\n\n¡Tu reserva está confirmada!\n\nServicio: {{serviceName}}\nCon:      {{staffName}}\nFecha:    {{date}}\nHora:     {{time}}\n\n¡Hasta pronto!\n— {{tenantName}}",
    },
  },

  booking_rejected: {
    en: {
      subject: "Booking request declined — {{tenantName}}",
      body: "Hi {{customerName}},\n\nUnfortunately your booking request for {{serviceName}} on {{date}} at {{time}} could not be accepted.\n\nReason: {{reason}}\n\nPlease contact us to reschedule.\n— {{tenantName}}",
    },
    hr: {
      subject: "Zahtjev za rezervaciju odbijen — {{tenantName}}",
      body: "Pozdrav {{customerName}},\n\nNažalost, vaš zahtjev za rezervaciju usluge {{serviceName}} dana {{date}} u {{time}} nije prihvaćen.\n\nRazlog: {{reason}}\n\nKontaktirajte nas za novi termin.\n— {{tenantName}}",
    },
    es: {
      subject: "Solicitud de reserva rechazada — {{tenantName}}",
      body: "Hola {{customerName}},\n\nLamentablemente tu solicitud para {{serviceName}} el {{date}} a las {{time}} no pudo ser aceptada.\n\nMotivo: {{reason}}\n\nContáctanos para reprogramar.\n— {{tenantName}}",
    },
  },

  booking_cancelled: {
    en: {
      subject: "Booking cancelled — {{serviceName}} on {{date}}",
      body: "Hi {{customerName}},\n\nYour booking for {{serviceName}} with {{staffName}} on {{date}} at {{time}} has been cancelled.\n\nReason: {{reason}}\n\nWe hope to see you again soon.\n— {{tenantName}}",
    },
    hr: {
      subject: "Rezervacija otkazana — {{serviceName}} na {{date}}",
      body: "Pozdrav {{customerName}},\n\nVaša rezervacija za uslugu {{serviceName}} s {{staffName}} dana {{date}} u {{time}} je otkazana.\n\nRazlog: {{reason}}\n\nNadamo se da ćemo vas vidjeti uskoro.\n— {{tenantName}}",
    },
    es: {
      subject: "Reserva cancelada — {{serviceName}} el {{date}}",
      body: "Hola {{customerName}},\n\nTu reserva de {{serviceName}} con {{staffName}} el {{date}} a las {{time}} ha sido cancelada.\n\nMotivo: {{reason}}\n\nEsperamos verte pronto.\n— {{tenantName}}",
    },
  },

  booking_rescheduled: {
    en: {
      subject: "Booking rescheduled — {{serviceName}}",
      body: "Hi {{customerName}},\n\nYour booking for {{serviceName}} has been rescheduled.\n\nPrevious: {{previousDate}} at {{previousTime}}\nNew:      {{date}} at {{time}}\nWith:     {{staffName}}\n\n— {{tenantName}}",
    },
    hr: {
      subject: "Rezervacija preplanirana — {{serviceName}}",
      body: "Pozdrav {{customerName}},\n\nVaša rezervacija za uslugu {{serviceName}} je preplanirana.\n\nPrije:   {{previousDate}} u {{previousTime}}\nNovo:    {{date}} u {{time}}\nS:       {{staffName}}\n\n— {{tenantName}}",
    },
    es: {
      subject: "Reserva reprogramada — {{serviceName}}",
      body: "Hola {{customerName}},\n\nTu reserva de {{serviceName}} ha sido reprogramada.\n\nAnterior: {{previousDate}} a las {{previousTime}}\nNueva:    {{date}} a las {{time}}\nCon:      {{staffName}}\n\n— {{tenantName}}",
    },
  },

  reminder_due: {
    en: {
      subject: "Reminder: {{serviceName}} tomorrow with {{staffName}}",
      body: "Hi {{customerName}},\n\nJust a friendly reminder about your upcoming appointment:\n\nService: {{serviceName}}\nWith:    {{staffName}}\nDate:    {{date}}\nTime:    {{time}}\n\nSee you soon!\n— {{tenantName}}",
    },
    hr: {
      subject: "Podsjetnik: {{serviceName}} sutra s {{staffName}}",
      body: "Pozdrav {{customerName}},\n\nPodsjećamo vas na vaš nadolazeći termin:\n\nUsluga:  {{serviceName}}\nS:       {{staffName}}\nDatum:   {{date}}\nVrijeme: {{time}}\n\nVidimo se uskoro!\n— {{tenantName}}",
    },
    es: {
      subject: "Recordatorio: {{serviceName}} mañana con {{staffName}}",
      body: "Hola {{customerName}},\n\nTe recordamos tu próxima cita:\n\nServicio: {{serviceName}}\nCon:      {{staffName}}\nFecha:    {{date}}\nHora:     {{time}}\n\n¡Hasta pronto!\n— {{tenantName}}",
    },
  },
};
