/**
 * AdminLoyaltyScreen.tsx
 *
 * Admin-facing loyalty management view:
 *   - Loyalty overview (top customers by points)
 *   - Per-customer detail: balance, tier, transaction history
 *   - Point adjustment panel (credit / debit)
 *   - Redemption action on behalf of a customer
 *   - Loading, empty and error states
 */

import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import type { CustomerLoyaltyState, LoyaltyTransaction } from "../../domains/loyalty/model";
import type { TenantLoyaltyConfig } from "../../domains/loyalty/model";
import type { CustomerLoyaltySummary } from "./loyaltyAdminService";

// ---------------------------------------------------------------------------
// Design tokens
// ---------------------------------------------------------------------------

const colors = {
  background: "#F2EDDD",
  surface: "#FFFFFF",
  border: "#E5E0D1",
  text: "#1A1A1A",
  muted: "#6B6B6B",
  primary: "#E3A9A0",
  primaryPressed: "#CF8B80",
  accent: "#BBEDDA",
  error: "#F44336",
  success: "#4CAF50",
  gold: "#F5C842",
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type AdminLoyaltyScreenProps = {
  tenantId: string;
  config: TenantLoyaltyConfig | null;
  customerSummaries: CustomerLoyaltySummary[];
  isLoadingOverview: boolean;
  overviewError: string | null;

  selectedUserId: string | null;
  onSelectUser: (userId: string) => void;

  selectedUserState: CustomerLoyaltyState | null;
  selectedUserTransactions: LoyaltyTransaction[];
  isLoadingDetail: boolean;

  adjustDelta: string;
  onAdjustDeltaChange: (v: string) => void;
  adjustReason: string;
  onAdjustReasonChange: (v: string) => void;
  onConfirmAdjust: () => void;
  isAdjusting: boolean;
  adjustError: string | null;

  onRedeemOption: (optionId: string) => void;
  isRedeeming: boolean;
  redeemError: string | null;
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function CustomerRow({
  summary,
  isSelected,
  onPress,
}: {
  summary: CustomerLoyaltySummary;
  isSelected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.customerRow, isSelected && styles.customerRowSelected]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Select ${summary.displayName}`}
    >
      <View style={styles.customerRowInfo}>
        <Text style={styles.customerName}>{summary.displayName}</Text>
        {summary.currentTierId && (
          <Text style={styles.customerTier}>{summary.currentTierId}</Text>
        )}
      </View>
      <Text style={styles.customerPoints}>{summary.points.toLocaleString()} pts</Text>
    </Pressable>
  );
}

function TransactionRow({ tx }: { tx: LoyaltyTransaction }) {
  const isCredit = tx.type === "credit";
  return (
    <View style={styles.txRow}>
      <Text style={styles.txReason} numberOfLines={1}>{tx.reason}</Text>
      <Text style={[styles.txPoints, { color: isCredit ? colors.success : colors.error }]}>
        {isCredit ? "+" : "−"}{tx.points}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function AdminLoyaltyScreen({
  config,
  customerSummaries,
  isLoadingOverview,
  overviewError,
  selectedUserId,
  onSelectUser,
  selectedUserState,
  selectedUserTransactions,
  isLoadingDetail,
  adjustDelta,
  onAdjustDeltaChange,
  adjustReason,
  onAdjustReasonChange,
  onConfirmAdjust,
  isAdjusting,
  adjustError,
  onRedeemOption,
  isRedeeming,
  redeemError,
}: AdminLoyaltyScreenProps) {
  const [showAdjustModal, setShowAdjustModal] = useState(false);

  return (
    <View style={styles.container}>
      {/* Overview panel */}
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Loyalty Overview</Text>

        {isLoadingOverview ? (
          <ActivityIndicator color={colors.primary} />
        ) : overviewError ? (
          <Text style={styles.errorText}>{overviewError}</Text>
        ) : customerSummaries.length === 0 ? (
          <Text style={styles.mutedText}>No customers enrolled in the loyalty programme.</Text>
        ) : (
          <FlatList
            data={customerSummaries}
            keyExtractor={(s) => s.userId}
            renderItem={({ item }) => (
              <CustomerRow
                summary={item}
                isSelected={item.userId === selectedUserId}
                onPress={() => onSelectUser(item.userId)}
              />
            )}
            scrollEnabled={false}
          />
        )}
      </View>

      {/* Customer detail panel */}
      {selectedUserId && (
        <ScrollView style={styles.panel}>
          <Text style={styles.panelTitle}>Customer Detail</Text>

          {isLoadingDetail ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <>
              <View style={styles.detailCard}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Balance</Text>
                  <Text style={styles.detailValue}>
                    {(selectedUserState?.points ?? 0).toLocaleString()} pts
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Lifetime</Text>
                  <Text style={styles.detailValue}>
                    {(selectedUserState?.lifetimePoints ?? 0).toLocaleString()} pts
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Tier</Text>
                  <Text style={styles.detailValue}>
                    {selectedUserState?.currentTierId ?? "None"}
                  </Text>
                </View>
              </View>

              {/* Actions */}
              <Pressable
                style={styles.actionBtn}
                onPress={() => setShowAdjustModal(true)}
                accessibilityRole="button"
                accessibilityLabel="Adjust points"
              >
                <Text style={styles.actionBtnText}>Adjust Points</Text>
              </Pressable>

              {/* Redemption options */}
              {config && config.redemptionOptions.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Redemptions</Text>
                  {config.redemptionOptions.map((opt) => (
                    <Pressable
                      key={opt.optionId}
                      style={styles.redeemBtn}
                      onPress={() => onRedeemOption(opt.optionId)}
                      accessibilityRole="button"
                      accessibilityLabel={`Redeem ${opt.name} for customer`}
                    >
                      <Text style={styles.redeemBtnText}>
                        {opt.name} — {opt.pointsCost} pts
                      </Text>
                    </Pressable>
                  ))}
                  {redeemError && <Text style={styles.errorText}>{redeemError}</Text>}
                  {isRedeeming && <ActivityIndicator color={colors.primary} />}
                </View>
              )}

              {/* Transaction history */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Transactions</Text>
                {selectedUserTransactions.length === 0 ? (
                  <Text style={styles.mutedText}>No transactions.</Text>
                ) : (
                  selectedUserTransactions.map((tx) => (
                    <TransactionRow key={tx.txId} tx={tx} />
                  ))
                )}
              </View>
            </>
          )}
        </ScrollView>
      )}

      {/* Adjust points modal */}
      <Modal
        visible={showAdjustModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAdjustModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Adjust Points</Text>

            <Text style={styles.inputLabel}>Delta (positive = credit, negative = debit)</Text>
            <TextInput
              style={styles.input}
              value={adjustDelta}
              onChangeText={onAdjustDeltaChange}
              keyboardType="numeric"
              placeholder="e.g. 100 or -50"
              placeholderTextColor={colors.muted}
            />

            <Text style={styles.inputLabel}>Reason</Text>
            <TextInput
              style={styles.input}
              value={adjustReason}
              onChangeText={onAdjustReasonChange}
              placeholder="e.g. Goodwill credit"
              placeholderTextColor={colors.muted}
            />

            {adjustError && <Text style={styles.errorText}>{adjustError}</Text>}

            <View style={styles.modalButtons}>
              <Pressable
                style={styles.cancelBtn}
                onPress={() => setShowAdjustModal(false)}
                accessibilityRole="button"
                accessibilityLabel="Cancel adjustment"
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.confirmBtn, isAdjusting && styles.btnDisabled]}
                onPress={() => {
                  onConfirmAdjust();
                  setShowAdjustModal(false);
                }}
                disabled={isAdjusting}
                accessibilityRole="button"
                accessibilityLabel="Confirm point adjustment"
              >
                {isAdjusting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.confirmBtnText}>Confirm</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  panel: { padding: 16, marginBottom: 8 },
  panelTitle: { fontSize: 17, fontWeight: "700", color: colors.text, marginBottom: 12 },
  customerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  customerRowSelected: { borderColor: colors.primary, backgroundColor: "#FDF5F4" },
  customerRowInfo: { flex: 1 },
  customerName: { fontSize: 14, fontWeight: "600", color: colors.text },
  customerTier: { fontSize: 11, color: colors.muted, marginTop: 2 },
  customerPoints: { fontSize: 14, fontWeight: "700", color: colors.primary },
  detailCard: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  detailLabel: { fontSize: 13, color: colors.muted },
  detailValue: { fontSize: 13, fontWeight: "600", color: colors.text },
  actionBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  actionBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: "600", color: colors.text, marginBottom: 8 },
  redeemBtn: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
  },
  redeemBtnText: { fontSize: 13, color: colors.text, fontWeight: "500" },
  txRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  txReason: { fontSize: 13, color: colors.text, flex: 1 },
  txPoints: { fontSize: 13, fontWeight: "700" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 24,
    width: "85%",
  },
  modalTitle: { fontSize: 17, fontWeight: "700", color: colors.text, marginBottom: 16 },
  inputLabel: { fontSize: 13, color: colors.muted, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: colors.text,
    marginBottom: 12,
  },
  modalButtons: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 4 },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelBtnText: { fontSize: 14, color: colors.text },
  confirmBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  confirmBtnText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  btnDisabled: { opacity: 0.5 },
  errorText: { color: colors.error, fontSize: 13, marginBottom: 8 },
  mutedText: { fontSize: 13, color: colors.muted },
});
