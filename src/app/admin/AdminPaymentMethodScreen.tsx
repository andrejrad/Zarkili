/**
 * W39 — AdminPaymentMethodScreen: admin-side card management.
 *
 * Lists the payment methods on file for the tenant's Stripe customer.
 * The owner can see the default card and navigate to add a new card.
 * Card removal is destructive and confirms before acting.
 */
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { brandTypography } from "../../shared/ui/brandTypography";
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from "./AdminPatterns";
import type { AdminPaymentMethod } from "./billingAdminService";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BRAND_LABELS: Record<AdminPaymentMethod["brand"], string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "Amex",
  discover: "Discover",
  unknown: "Card",
};

function expLabel(method: AdminPaymentMethod): string {
  return `Exp ${String(method.expMonth).padStart(2, "0")}/${method.expYear}`;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AdminPaymentMethodScreenProps = {
  loading: boolean;
  error: string | null;
  methods: AdminPaymentMethod[];
  onRetry: () => void;
  onBack: () => void;
  onAddCard: () => void;
  onSetDefault: (paymentMethodId: string) => Promise<void>;
  onRemove: (paymentMethodId: string) => Promise<void>;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AdminPaymentMethodScreen({
  loading,
  error,
  methods,
  onRetry,
  onBack,
  onAddCard,
  onSetDefault,
  onRemove,
}: AdminPaymentMethodScreenProps) {
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  async function handleSetDefault(id: string) {
    setPendingAction(id);
    setActionError(null);
    try {
      await onSetDefault(id);
    } catch {
      setActionError("Could not update default card. Please try again.");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleRemove(id: string) {
    setPendingAction(id);
    setActionError(null);
    setConfirmRemoveId(null);
    try {
      await onRemove(id);
    } catch {
      setActionError("Could not remove card. Please try again.");
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.root}>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.backRow}>
        <Text style={styles.backLabel}>‹ Billing</Text>
      </Pressable>
      <Text style={styles.pageTitle}>Payment method</Text>

      {loading ? <AdminLoadingState label="Loading payment methods…" /> : null}
      {error && !loading ? <AdminErrorState message={error} onRetry={onRetry} /> : null}

      {!loading && !error && methods.length === 0 ? (
        <AdminEmptyState
          title="No card on file"
          body="Add a payment method to activate your subscription."
          cta="Add card"
          onCta={onAddCard}
        />
      ) : null}

      {!loading && methods.length > 0 ? (
        <View style={styles.list}>
          {methods.map((method) => (
            <View key={method.paymentMethodId} style={styles.cardRow} testID={`card-${method.paymentMethodId}`}>
              <View style={styles.cardInfo}>
                <Text style={styles.cardLabel}>
                  {BRAND_LABELS[method.brand]} ···· {method.last4}
                </Text>
                <Text style={styles.cardMeta}>{expLabel(method)}</Text>
                {method.isDefault ? (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultBadgeText}>Default</Text>
                  </View>
                ) : null}
              </View>
              <View style={styles.cardActions}>
                {!method.isDefault ? (
                  <Pressable
                    accessibilityRole="button"
                    disabled={pendingAction === method.paymentMethodId}
                    onPress={() => void handleSetDefault(method.paymentMethodId)}
                    style={styles.actionBtn}
                    testID={`set-default-${method.paymentMethodId}`}
                  >
                    <Text style={styles.actionBtnLabel}>Set default</Text>
                  </Pressable>
                ) : null}
                {confirmRemoveId === method.paymentMethodId ? (
                  <View style={styles.confirmRow}>
                    <Text style={styles.confirmText}>Remove this card?</Text>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => void handleRemove(method.paymentMethodId)}
                      style={styles.dangerBtn}
                      testID={`confirm-remove-${method.paymentMethodId}`}
                    >
                      <Text style={styles.dangerBtnLabel}>Remove</Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setConfirmRemoveId(null)}
                      style={styles.cancelBtn}
                    >
                      <Text style={styles.cancelBtnLabel}>Cancel</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setConfirmRemoveId(method.paymentMethodId)}
                    style={styles.removeBtn}
                    testID={`remove-${method.paymentMethodId}`}
                  >
                    <Text style={styles.removeBtnLabel}>Remove</Text>
                  </Pressable>
                )}
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {actionError ? <Text style={styles.errorText}>{actionError}</Text> : null}

      {!loading ? (
        <Pressable
          accessibilityRole="button"
          onPress={onAddCard}
          style={styles.addBtn}
          testID="add-card-btn"
        >
          <Text style={styles.addBtnLabel}>+ Add card</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: { flexGrow: 1, paddingBottom: 32, gap: 12 },
  backRow: { paddingBottom: 4 },
  backLabel: { fontSize: 14, fontFamily: brandTypography.regular, color: "#6B6B6B" },
  pageTitle: { fontSize: 26, lineHeight: 34, fontFamily: brandTypography.semibold, color: "#1A1A1A", marginBottom: 4 },
  list: { gap: 8 },
  cardRow: { backgroundColor: "#FFFFFF", borderRadius: 12, borderWidth: 1, borderColor: "#E5E0D1", padding: 14, gap: 8 },
  cardInfo: { gap: 4 },
  cardLabel: { fontSize: 15, fontFamily: brandTypography.semibold, color: "#1A1A1A" },
  cardMeta: { fontSize: 12, fontFamily: brandTypography.regular, color: "#6B6B6B" },
  defaultBadge: { backgroundColor: "#22C55E22", borderRadius: 9999, paddingHorizontal: 8, paddingVertical: 2, alignSelf: "flex-start" },
  defaultBadgeText: { fontSize: 11, fontFamily: brandTypography.medium, color: "#22C55E" },
  cardActions: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  actionBtn: { borderWidth: 1, borderColor: "#E5E0D1", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  actionBtnLabel: { fontSize: 12, fontFamily: brandTypography.medium, color: "#1A1A1A" },
  removeBtn: { borderWidth: 1, borderColor: "#EF4444", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  removeBtnLabel: { fontSize: 12, fontFamily: brandTypography.medium, color: "#EF4444" },
  confirmRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  confirmText: { fontSize: 12, fontFamily: brandTypography.regular, color: "#1A1A1A" },
  dangerBtn: { backgroundColor: "#EF4444", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  dangerBtnLabel: { fontSize: 12, fontFamily: brandTypography.medium, color: "#FFFFFF" },
  cancelBtn: { borderWidth: 1, borderColor: "#E5E0D1", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  cancelBtnLabel: { fontSize: 12, fontFamily: brandTypography.medium, color: "#6B6B6B" },
  errorText: { fontSize: 13, fontFamily: brandTypography.regular, color: "#EF4444", textAlign: "center" },
  addBtn: { borderWidth: 1.5, borderColor: "#E3A9A0", borderStyle: "dashed", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  addBtnLabel: { fontSize: 14, fontFamily: brandTypography.medium, color: "#E3A9A0" },
});
