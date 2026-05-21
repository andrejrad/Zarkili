/**
 * WebStripePaymentForm.tsx
 *
 * TypeScript declaration file used for type-checking.
 * Metro resolves .native.tsx (iOS/Android) or .web.tsx (web) at bundle time.
 * This file provides the shared prop types for both platforms.
 */

export type WebStripePaymentFormProps = {
  publishableKey: string;
  clientSecret: string;
  isSetupIntent: boolean;
  onSuccess: () => void;
  onError: (msg: string) => void;
};

/**
 * Fallback implementation (null) — Metro replaces this with the
 * platform-specific version (.native.tsx or .web.tsx) at bundle time.
 */
export function WebStripePaymentForm(_props: WebStripePaymentFormProps) {
  return null;
}
