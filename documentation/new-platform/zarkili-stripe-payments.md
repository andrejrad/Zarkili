# Zarkili — Stripe Payments Implementation Guide

## Overview

This document covers the full implementation of Stripe payments in the Zarkili platform, supporting:

- **Tenant (salon) subscriptions** — handled web-only via Stripe, not in-app
- **Client → Salon payments** — deposits, full payments, card on file, and post-service charge capture

---

## Architecture

```
Zarkili Backend (API)
  ├── Stripe SDK (server-side only — never expose secret key to client)
  ├── Webhook handler (/webhooks/stripe)
  └── Payment endpoints

Zarkili Mobile/Web App
  ├── Stripe SDK (client-side — publishable key only)
  │     ├── Stripe React Native SDK  (mobile)
  │     └── Stripe.js / Stripe Elements (web)
  └── Never calls Stripe directly for sensitive ops — always via your backend
```

---

## 1. Database Schema

### Tenant Payment Settings

```sql
-- tenant_payment_settings
id                    UUID PRIMARY KEY
tenant_id             UUID REFERENCES tenants(id)
payments_enabled      BOOLEAN DEFAULT false
payment_mode          ENUM('deposit', 'full', 'card_on_file')
deposit_percentage    INTEGER (1–100, relevant if mode = 'deposit')
cancellation_policy   BOOLEAN DEFAULT false
cancellation_hours    INTEGER  -- e.g. 24 (charge if cancelled < 24hrs before)
cancellation_charge   ENUM('deposit', 'custom')
cancellation_amount   DECIMAL(10,2) -- if custom
stripe_account_id     VARCHAR  -- Stripe Connect account ID for this salon
created_at            TIMESTAMP
updated_at            TIMESTAMP
```

### Client Payment Profile

```sql
-- client_payment_profiles
id                    UUID PRIMARY KEY
client_id             UUID REFERENCES clients(id)
tenant_id             UUID REFERENCES tenants(id)
stripe_customer_id    VARCHAR  -- Stripe Customer ID (cus_xxx)
default_payment_method_id VARCHAR -- Stripe PaymentMethod ID (pm_xxx)
created_at            TIMESTAMP
updated_at            TIMESTAMP
```

### Appointment Payments

```sql
-- appointment_payments
id                      UUID PRIMARY KEY
appointment_id          UUID REFERENCES appointments(id)
tenant_id               UUID REFERENCES tenants(id)
client_id               UUID REFERENCES clients(id)
stripe_payment_intent_id VARCHAR  -- pi_xxx (null if card_on_file only)
stripe_setup_intent_id   VARCHAR  -- seti_xxx (if card_on_file mode)
payment_mode            ENUM('deposit', 'full', 'card_on_file')
authorized_amount       DECIMAL(10,2)
captured_amount         DECIMAL(10,2)
remaining_amount        DECIMAL(10,2)
status                  ENUM('pending', 'authorized', 'partially_captured', 'captured', 'refunded', 'cancelled', 'paid_in_person')
stripe_status           VARCHAR  -- mirrors Stripe's PaymentIntent status
tip_amount              DECIMAL(10,2) DEFAULT 0
notes                   TEXT
created_at              TIMESTAMP
updated_at              TIMESTAMP
```

---

## 2. Stripe Connect Setup (Multi-Tenant)

Each salon (tenant) needs their own Stripe Connected Account so payouts go directly to them. Zarkili takes a platform fee on each transaction.

### 2a. Onboarding a Salon (Web Only)

```typescript
// POST /api/tenants/:tenantId/stripe/onboard
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function createStripeOnboardingLink(tenantId: string, returnUrl: string) {
  // Create a Connected Account for the salon
  const account = await stripe.accounts.create({
    type: 'express',  // Express accounts = Stripe handles KYC/dashboard
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });

  // Save account ID to tenant_payment_settings
  await db.tenantPaymentSettings.update({
    where: { tenant_id: tenantId },
    data: { stripe_account_id: account.id },
  });

  // Generate onboarding link
  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: `${returnUrl}/stripe/onboard/refresh`,
    return_url: `${returnUrl}/stripe/onboard/complete`,
    type: 'account_onboarding',
  });

  return accountLink.url;
}
```

### 2b. Check Onboarding Status

```typescript
// GET /api/tenants/:tenantId/stripe/status
export async function getStripeAccountStatus(stripeAccountId: string) {
  const account = await stripe.accounts.retrieve(stripeAccountId);
  return {
    onboarded: account.details_submitted && account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
  };
}
```

---

## 3. Tenant Payment Settings API

### Get Settings

```typescript
// GET /api/tenants/:tenantId/payment-settings
export async function getPaymentSettings(tenantId: string) {
  return await db.tenantPaymentSettings.findUnique({
    where: { tenant_id: tenantId },
  });
}
```

### Update Settings

```typescript
// PUT /api/tenants/:tenantId/payment-settings
export async function updatePaymentSettings(tenantId: string, data: {
  payments_enabled: boolean;
  payment_mode?: 'deposit' | 'full' | 'card_on_file';
  deposit_percentage?: number;
  cancellation_policy?: boolean;
  cancellation_hours?: number;
  cancellation_charge?: 'deposit' | 'custom';
  cancellation_amount?: number;
}) {
  // Validate deposit_percentage is between 1–100 if mode is deposit
  if (data.payment_mode === 'deposit') {
    if (!data.deposit_percentage || data.deposit_percentage < 1 || data.deposit_percentage > 100) {
      throw new Error('deposit_percentage must be between 1 and 100');
    }
  }

  return await db.tenantPaymentSettings.upsert({
    where: { tenant_id: tenantId },
    update: data,
    create: { tenant_id: tenantId, ...data },
  });
}
```

---

## 4. Client Stripe Customer Management

### Create or Retrieve Stripe Customer

```typescript
// Called when a client books for the first time at a payment-enabled salon
export async function getOrCreateStripeCustomer(clientId: string, tenantId: string, email: string, name: string) {
  const existing = await db.clientPaymentProfiles.findUnique({
    where: { client_id: clientId, tenant_id: tenantId },
  });

  if (existing) return existing.stripe_customer_id;

  // Create customer on Stripe Connect account
  const settings = await db.tenantPaymentSettings.findUnique({ where: { tenant_id: tenantId } });

  const customer = await stripe.customers.create(
    { email, name, metadata: { client_id: clientId, tenant_id: tenantId } },
    { stripeAccount: settings.stripe_account_id }  // scoped to salon's account
  );

  await db.clientPaymentProfiles.create({
    data: {
      client_id: clientId,
      tenant_id: tenantId,
      stripe_customer_id: customer.id,
    },
  });

  return customer.id;
}
```

---

## 5. Booking Payment Flow

### 5a. Step 1 — Create Intent at Booking

This is the main endpoint called when a client confirms a booking.

```typescript
// POST /api/appointments/:appointmentId/payment/create-intent
export async function createBookingPaymentIntent(appointmentId: string) {
  const appointment = await db.appointments.findUnique({
    where: { id: appointmentId },
    include: { tenant: true, client: true, services: true },
  });

  const settings = await db.tenantPaymentSettings.findUnique({
    where: { tenant_id: appointment.tenant_id },
  });

  if (!settings.payments_enabled) return null;

  const totalAmount = calculateServiceTotal(appointment.services); // in cents
  const stripeAccountId = settings.stripe_account_id;
  const stripeCustomerId = await getOrCreateStripeCustomer(
    appointment.client_id,
    appointment.tenant_id,
    appointment.client.email,
    appointment.client.name,
  );

  // --- CARD ON FILE: SetupIntent (no charge now) ---
  if (settings.payment_mode === 'card_on_file') {
    const setupIntent = await stripe.setupIntents.create(
      {
        customer: stripeCustomerId,
        usage: 'off_session',
        metadata: { appointment_id: appointmentId },
      },
      { stripeAccount: stripeAccountId }
    );

    await db.appointmentPayments.create({
      data: {
        appointment_id: appointmentId,
        tenant_id: appointment.tenant_id,
        client_id: appointment.client_id,
        stripe_setup_intent_id: setupIntent.id,
        payment_mode: 'card_on_file',
        authorized_amount: 0,
        remaining_amount: totalAmount / 100,
        status: 'pending',
      },
    });

    return { type: 'setup_intent', client_secret: setupIntent.client_secret };
  }

  // --- DEPOSIT or FULL: PaymentIntent with capture_method: manual ---
  const chargeAmount = settings.payment_mode === 'deposit'
    ? Math.round(totalAmount * (settings.deposit_percentage / 100))
    : totalAmount;

  const platformFeePercent = 0.02; // Zarkili takes 2% — adjust as needed
  const applicationFeeAmount = Math.round(chargeAmount * platformFeePercent);

  const paymentIntent = await stripe.paymentIntents.create(
    {
      amount: chargeAmount,           // in cents
      currency: 'usd',                // adjust to tenant's currency
      customer: stripeCustomerId,
      capture_method: 'manual',       // KEY: authorize now, capture later
      setup_future_usage: 'off_session', // saves card for future charges
      application_fee_amount: applicationFeeAmount,
      metadata: {
        appointment_id: appointmentId,
        payment_mode: settings.payment_mode,
        deposit_percentage: settings.deposit_percentage?.toString() ?? '',
      },
    },
    { stripeAccount: stripeAccountId }
  );

  await db.appointmentPayments.create({
    data: {
      appointment_id: appointmentId,
      tenant_id: appointment.tenant_id,
      client_id: appointment.client_id,
      stripe_payment_intent_id: paymentIntent.id,
      payment_mode: settings.payment_mode,
      authorized_amount: chargeAmount / 100,
      remaining_amount: (totalAmount - chargeAmount) / 100,
      status: 'pending',
      stripe_status: paymentIntent.status,
    },
  });

  return { type: 'payment_intent', client_secret: paymentIntent.client_secret };
}
```

### 5b. Step 2 — Client Confirms Payment (Mobile/Web)

**React Native (Mobile)**

```typescript
import { useStripe } from '@stripe/stripe-react-native';

const { confirmPayment, confirmSetupIntent } = useStripe();

// For deposit/full payment
async function handleBookingPayment(clientSecret: string, type: string) {
  if (type === 'payment_intent') {
    const { error, paymentIntent } = await confirmPayment(clientSecret, {
      paymentMethodType: 'Card',
    });
    if (error) throw new Error(error.message);
    return paymentIntent;
  }

  if (type === 'setup_intent') {
    const { error, setupIntent } = await confirmSetupIntent(clientSecret, {
      paymentMethodType: 'Card',
    });
    if (error) throw new Error(error.message);
    return setupIntent;
  }
}
```

---

## 6. Post-Service: Finalizing Payment (Admin Mode)

This is the "Finalize Payment" screen in admin mode after a service is completed.

### 6a. Get Payment Summary for Appointment

```typescript
// GET /api/appointments/:appointmentId/payment/summary
export async function getPaymentSummary(appointmentId: string) {
  const payment = await db.appointmentPayments.findUnique({
    where: { appointment_id: appointmentId },
  });

  const appointment = await db.appointments.findUnique({
    where: { id: appointmentId },
    include: { services: true },
  });

  const serviceTotal = calculateServiceTotal(appointment.services);

  return {
    service_total: serviceTotal,
    authorized_amount: payment.authorized_amount,
    captured_amount: payment.captured_amount,
    remaining_amount: serviceTotal - (payment.captured_amount ?? 0),
    status: payment.status,
    payment_mode: payment.payment_mode,
  };
}
```

### 6b. Capture Remaining / Full Amount

```typescript
// POST /api/appointments/:appointmentId/payment/capture
export async function captureAppointmentPayment(
  appointmentId: string,
  data: {
    final_amount: number;   // total to charge (service + tip), in dollars
    tip_amount?: number;
    paid_in_person?: boolean;
  }
) {
  const payment = await db.appointmentPayments.findUnique({
    where: { appointment_id: appointmentId },
  });

  const settings = await db.tenantPaymentSettings.findUnique({
    where: { tenant_id: payment.tenant_id },
  });

  // --- Paid in person (cash/POS terminal) ---
  if (data.paid_in_person) {
    // Cancel the hold on the card if one exists
    if (payment.stripe_payment_intent_id) {
      await stripe.paymentIntents.cancel(
        payment.stripe_payment_intent_id,
        { cancellation_reason: 'abandoned' },
        { stripeAccount: settings.stripe_account_id }
      );
    }

    await db.appointmentPayments.update({
      where: { appointment_id: appointmentId },
      data: { status: 'paid_in_person', captured_amount: data.final_amount },
    });
    return;
  }

  const finalAmountCents = Math.round(data.final_amount * 100);

  // --- Card on file: create a new PaymentIntent off-session ---
  if (payment.payment_mode === 'card_on_file') {
    const profile = await db.clientPaymentProfiles.findUnique({
      where: { client_id: payment.client_id, tenant_id: payment.tenant_id },
    });

    const newIntent = await stripe.paymentIntents.create(
      {
        amount: finalAmountCents,
        currency: 'usd',
        customer: profile.stripe_customer_id,
        payment_method: profile.default_payment_method_id,
        confirm: true,
        off_session: true,
        application_fee_amount: Math.round(finalAmountCents * 0.02),
        metadata: { appointment_id: appointmentId, type: 'post_service_capture' },
      },
      { stripeAccount: settings.stripe_account_id }
    );

    await db.appointmentPayments.update({
      where: { appointment_id: appointmentId },
      data: {
        stripe_payment_intent_id: newIntent.id,
        captured_amount: data.final_amount,
        tip_amount: data.tip_amount ?? 0,
        status: 'captured',
        stripe_status: newIntent.status,
      },
    });
    return;
  }

  // --- Deposit/Full: capture against the existing authorized PaymentIntent ---
  // Note: captured amount can be <= authorized amount
  // For remainder + tip, create a second PaymentIntent for the difference
  const alreadyCaptured = payment.captured_amount ?? 0;
  const remainingCents = finalAmountCents - Math.round(alreadyCaptured * 100);

  if (remainingCents > 0) {
    // Capture the original authorized amount
    await stripe.paymentIntents.capture(
      payment.stripe_payment_intent_id,
      {},
      { stripeAccount: settings.stripe_account_id }
    );

    // Charge the remainder (including tip) as a new off-session charge
    if (remainingCents > 0) {
      const profile = await db.clientPaymentProfiles.findUnique({
        where: { client_id: payment.client_id, tenant_id: payment.tenant_id },
      });

      await stripe.paymentIntents.create(
        {
          amount: remainingCents,
          currency: 'usd',
          customer: profile.stripe_customer_id,
          payment_method: profile.default_payment_method_id,
          confirm: true,
          off_session: true,
          application_fee_amount: Math.round(remainingCents * 0.02),
          metadata: { appointment_id: appointmentId, type: 'remainder_capture' },
        },
        { stripeAccount: settings.stripe_account_id }
      );
    }
  }

  await db.appointmentPayments.update({
    where: { appointment_id: appointmentId },
    data: {
      captured_amount: data.final_amount,
      tip_amount: data.tip_amount ?? 0,
      remaining_amount: 0,
      status: 'captured',
    },
  });
}
```

---

## 7. Cancellation & Refunds

```typescript
// POST /api/appointments/:appointmentId/payment/cancel
export async function cancelAppointmentPayment(
  appointmentId: string,
  data: { keep_deposit?: boolean }
) {
  const payment = await db.appointmentPayments.findUnique({
    where: { appointment_id: appointmentId },
  });

  const settings = await db.tenantPaymentSettings.findUnique({
    where: { tenant_id: payment.tenant_id },
  });

  if (!payment.stripe_payment_intent_id) {
    // Card on file only — nothing to refund, just update status
    await db.appointmentPayments.update({
      where: { appointment_id: appointmentId },
      data: { status: 'cancelled' },
    });
    return;
  }

  if (data.keep_deposit && payment.payment_mode === 'deposit') {
    // Capture the deposit as a cancellation fee, then done
    await stripe.paymentIntents.capture(
      payment.stripe_payment_intent_id,
      {},
      { stripeAccount: settings.stripe_account_id }
    );

    await db.appointmentPayments.update({
      where: { appointment_id: appointmentId },
      data: {
        status: 'captured',
        captured_amount: payment.authorized_amount,
        notes: 'Cancellation fee — deposit retained',
      },
    });
  } else {
    // Cancel the hold entirely (no charge)
    await stripe.paymentIntents.cancel(
      payment.stripe_payment_intent_id,
      {},
      { stripeAccount: settings.stripe_account_id }
    );

    await db.appointmentPayments.update({
      where: { appointment_id: appointmentId },
      data: { status: 'cancelled' },
    });
  }
}
```

---

## 8. Stripe Webhooks

Webhooks keep your DB in sync with Stripe's actual payment state. Always verify the webhook signature.

```typescript
// POST /webhooks/stripe
import { Request, Response } from 'express';

export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,           // raw body — must NOT be parsed as JSON
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
      break;
    case 'payment_intent.payment_failed':
      await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
      break;
    case 'payment_intent.canceled':
      await handlePaymentCanceled(event.data.object as Stripe.PaymentIntent);
      break;
    case 'setup_intent.succeeded':
      await handleSetupIntentSucceeded(event.data.object as Stripe.SetupIntent);
      break;
    case 'payment_intent.amount_capturable_updated':
      // PaymentIntent authorized — funds are on hold
      await handlePaymentAuthorized(event.data.object as Stripe.PaymentIntent);
      break;
  }

  res.json({ received: true });
}

async function handleSetupIntentSucceeded(setupIntent: Stripe.SetupIntent) {
  // Save default payment method to client profile
  const appointmentId = setupIntent.metadata.appointment_id;
  const payment = await db.appointmentPayments.findUnique({
    where: { appointment_id: appointmentId },
  });

  await db.clientPaymentProfiles.update({
    where: { client_id: payment.client_id, tenant_id: payment.tenant_id },
    data: { default_payment_method_id: setupIntent.payment_method as string },
  });

  await db.appointmentPayments.update({
    where: { appointment_id: appointmentId },
    data: { status: 'authorized', stripe_status: 'succeeded' },
  });
}

async function handlePaymentAuthorized(paymentIntent: Stripe.PaymentIntent) {
  const appointmentId = paymentIntent.metadata.appointment_id;
  await db.appointmentPayments.update({
    where: { appointment_id: appointmentId },
    data: { status: 'authorized', stripe_status: paymentIntent.status },
  });
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const appointmentId = paymentIntent.metadata.appointment_id;
  if (!appointmentId) return;

  await db.appointmentPayments.update({
    where: { appointment_id: appointmentId },
    data: {
      status: 'captured',
      captured_amount: paymentIntent.amount_received / 100,
      stripe_status: paymentIntent.status,
    },
  });
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const appointmentId = paymentIntent.metadata.appointment_id;
  if (!appointmentId) return;

  await db.appointmentPayments.update({
    where: { appointment_id: appointmentId },
    data: { status: 'pending', stripe_status: 'payment_failed' },
  });

  // TODO: notify salon admin and client of failed payment
}
```

---

## 9. Admin Mode — Finalize Payment UI Flow

The "Finalize Payment" screen should present the admin with:

```
┌─────────────────────────────────────┐
│  Appointment: Sarah J. — Highlights │
│  Date: Mon 18 May, 2:00pm           │
├─────────────────────────────────────┤
│  Service Total:         $120.00     │
│  Deposit Paid:          - $30.00    │
│  Remaining:             $90.00      │
├─────────────────────────────────────┤
│  Add Tip:               [  $0.00  ] │
│  Final Charge:          $90.00      │
├─────────────────────────────────────┤
│  [Charge Card on File]              │
│  [Mark as Paid in Person]           │
└─────────────────────────────────────┘
```

API call on "Charge Card on File":

```typescript
await api.post(`/appointments/${appointmentId}/payment/capture`, {
  final_amount: remainingAmount + tipAmount,
  tip_amount: tipAmount,
  paid_in_person: false,
});
```

---

## 10. Environment Variables

```env
# Stripe
STRIPE_SECRET_KEY=sk_live_...          # Server only — never expose
STRIPE_PUBLISHABLE_KEY=pk_live_...     # Safe for client
STRIPE_WEBHOOK_SECRET=whsec_...        # From Stripe Dashboard > Webhooks

# Platform fee
STRIPE_PLATFORM_FEE_PERCENT=0.02       # 2% — adjust as needed
```

---

## 11. Key Implementation Notes

- **Never call Stripe from the client with your secret key.** All sensitive operations go through your backend.
- **Always use `capture_method: 'manual'`** on PaymentIntents at booking so funds are held but not charged until after service.
- **Authorization holds expire after 7 days** on most cards. If appointments are booked more than 7 days in advance, you'll need to re-authorize closer to the appointment date.
- **Idempotency keys** — use `appointmentId` as the Stripe idempotency key to prevent duplicate charges on retries.
- **Currency** — store all amounts in your DB as decimals (dollars), send to Stripe as integers (cents).
- **Stripe Connect fee** — Stripe charges the connected account (salon) per transaction. Your platform fee comes on top via `application_fee_amount`.
- **Test with Stripe CLI** for local webhook testing: `stripe listen --forward-to localhost:3000/webhooks/stripe`

---

## 12. Stripe Dashboard for Salons

Since you're using Express accounts, salons get access to their own Stripe Express dashboard to:
- View payouts and transaction history
- Manage their bank account details
- Handle disputes

Generate a dashboard login link:

```typescript
// GET /api/tenants/:tenantId/stripe/dashboard-link
export async function getStripeDashboardLink(stripeAccountId: string) {
  const loginLink = await stripe.accounts.createLoginLink(stripeAccountId);
  return loginLink.url;
}
```
