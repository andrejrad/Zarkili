/**
 * WebStripePaymentForm.web.tsx
 *
 * Web-only Stripe Elements checkout component.
 * Bundled only on the web platform (Metro resolves .web.tsx first for web builds).
 *
 * Renders a PaymentElement within an Elements provider.
 * On submit:
 *   - PaymentIntents  → stripe.confirmPayment  (redirect: "if_required")
 *   - SetupIntents    → stripe.confirmSetup    (redirect: "if_required")
 *
 * Props:
 *   publishableKey   — Stripe publishable key (pk_xxx)
 *   clientSecret     — Client secret from createBookingPaymentIntent (pi_xxx or seti_xxx)
 *   isSetupIntent    — true when card_on_file mode (SetupIntent)
 *   onSuccess        — called after successful confirmation
 *   onError          — called with error message on failure
 */

import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useMemo, useState } from "react";

// ---------------------------------------------------------------------------
// Inner form (must be rendered inside <Elements>)
// ---------------------------------------------------------------------------

type InnerFormProps = {
  isSetupIntent: boolean;
  onSuccess: () => void;
  onError: (msg: string) => void;
};

function PaymentFormInner({ isSetupIntent, onSuccess, onError }: InnerFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!stripe || !elements) return;

    setLoading(true);
    setLocalError(null);

    // Ensure PaymentElement is ready
    const submitResult = await elements.submit();
    if (submitResult.error) {
      setLocalError(submitResult.error.message ?? "Invalid payment details.");
      setLoading(false);
      return;
    }

    let error: { message?: string } | undefined;

    if (isSetupIntent) {
      const result = await stripe.confirmSetup({
        elements,
        redirect: "if_required",
        confirmParams: { return_url: window.location.href },
      });
      error = result.error;
    } else {
      const result = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
        confirmParams: { return_url: window.location.href },
      });
      error = result.error;
    }

    setLoading(false);

    if (error) {
      const msg = error.message ?? "Payment failed.";
      setLocalError(msg);
      onError(msg);
    } else {
      onSuccess();
    }
  }

  return (
    <div style={{ width: "100%", maxWidth: 480, margin: "0 auto" }}>
      <PaymentElement />
      {localError && (
        <p style={{ color: "#dc2626", fontSize: 14, marginTop: 12 }}>{localError}</p>
      )}
      <button
        onClick={() => void handleSubmit()}
        disabled={loading || !stripe || !elements}
        style={{
          marginTop: 20,
          width: "100%",
          padding: "14px 0",
          backgroundColor: loading ? "#888" : "#000",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          fontSize: 16,
          fontWeight: 600,
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Processing…" : isSetupIntent ? "Save card" : "Pay now"}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Public component (wraps with Elements provider)
// ---------------------------------------------------------------------------

export type WebStripePaymentFormProps = {
  publishableKey: string;
  clientSecret: string;
  isSetupIntent: boolean;
  onSuccess: () => void;
  onError: (msg: string) => void;
};

export function WebStripePaymentForm({
  publishableKey,
  clientSecret,
  isSetupIntent,
  onSuccess,
  onError,
}: WebStripePaymentFormProps) {
  const stripePromise = useMemo(() => loadStripe(publishableKey), [publishableKey]);

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <PaymentFormInner
        isSetupIntent={isSetupIntent}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  );
}
