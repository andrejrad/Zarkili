/**
 * SavedPaymentMethodsScreen.tsx — D.1 Saved Payment Methods.
 *
 * Apple Pay row at top (always present), list of PaymentMethodRow, kebab
 * menu actions per row, "Add payment method" tertiary tile, empty state,
 * remove-confirm modal sheet, error banner.
 *
 * Props-driven: caller wires the actual Stripe customer.paymentMethods.list
 * and detach side effects. No Firestore I/O here.
 */

import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useState } from "react";

import {
  Button,
  ModalSheet,
  PaymentMethodRow,
  colors,
  radius,
  spacing,
} from "../../shared/ui";
import {
  formatBrandLabel,
  formatCardExpiry,
  formatLast4,
  isCardExpired,
  type SavedPaymentMethod,
} from "./paymentsHelpers";

export type SavedPaymentMethodsScreenProps = {
  methods: readonly SavedPaymentMethod[];
  applePayAvailable?: boolean;
  loading?: boolean;
  errorMessage?: string;
  /** Reference date for expiry checks; defaults to "now". */
  now?: Date;
  onPressMethod?: (id: string) => void;
  onPressEdit: (id: string) => void;
  onPressSetDefault: (id: string) => void;
  onPressRemove: (id: string) => void;
  onPressAddCard: () => void;
  onPressBack?: () => void;
  testID?: string;
};

export function SavedPaymentMethodsScreen({
  methods,
  applePayAvailable,
  loading,
  errorMessage,
  now,
  onPressMethod,
  onPressEdit,
  onPressSetDefault,
  onPressRemove,
  onPressAddCard,
  onPressBack,
  testID,
}: SavedPaymentMethodsScreenProps) {
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  const isEmpty = !loading && methods.length === 0;

  return (
    <View style={styles.root} testID={testID}>
      <View style={styles.header}>
        {onPressBack ? (
          <Pressable
            onPress={onPressBack}
            accessibilityRole="button"
            accessibilityLabel="Back"
            style={styles.backBtn}
            testID={testID ? `${testID}-back` : undefined}
          >
            <Text style={styles.backGlyph}>{"\u2190"}</Text>
          </Pressable>
        ) : null}
        <Text style={styles.title}>Payment methods</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {errorMessage ? (
          <View style={styles.errorBanner} testID={testID ? `${testID}-error` : undefined}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        <Pressable
          onPress={onPressAddCard}
          accessibilityRole="button"
          accessibilityLabel={applePayAvailable ? "Apple Pay" : "Apple Pay not available on this device"}
          accessibilityState={{ disabled: !applePayAvailable }}
          disabled={!applePayAvailable}
          style={[styles.applePayRow, !applePayAvailable ? styles.applePayDisabled : null]}
          testID={testID ? `${testID}-apple-pay` : undefined}
        >
          <Text style={styles.applePayGlyph}>{"\uF8FF"}</Text>
          <Text style={styles.applePayLabel}>{applePayAvailable ? "Apple Pay" : "Apple Pay (unavailable)"}</Text>
        </Pressable>

        {loading ? (
          <View testID={testID ? `${testID}-loading` : undefined}>
            <View style={styles.skeleton} />
            <View style={styles.skeleton} />
          </View>
        ) : null}

        {isEmpty ? (
          <View style={styles.emptyState} testID={testID ? `${testID}-empty` : undefined}>
            <Text style={styles.emptyTitle}>No saved cards yet</Text>
            <Text style={styles.emptyBody}>Add your first card to speed up checkout.</Text>
            <Button label="Add your first card" onPress={onPressAddCard} variant="primary" testID={testID ? `${testID}-add-first` : undefined} />
          </View>
        ) : null}

        {!loading && !isEmpty
          ? methods.map((m) => (
              <View key={m.id} style={styles.cardWrap}>
                <PaymentMethodRow
                  brandLabel={formatBrandLabel(m.brand)}
                  last4Label={formatLast4(m.last4)}
                  expiryLabel={formatCardExpiry(m.expMonth, m.expYear)}
                  isDefault={m.isDefault}
                  expired={isCardExpired(m.expMonth, m.expYear, now)}
                  onPress={onPressMethod ? () => onPressMethod(m.id) : undefined}
                  onPressMenu={() => setMenuFor(m.id)}
                  testID={testID ? `${testID}-method-${m.id}` : undefined}
                />
              </View>
            ))
          : null}

        {!isEmpty ? (
          <Pressable
            onPress={onPressAddCard}
            accessibilityRole="button"
            accessibilityLabel="Add payment method"
            style={styles.addTile}
            testID={testID ? `${testID}-add` : undefined}
          >
            <Text style={styles.addGlyph}>+</Text>
            <Text style={styles.addLabel}>Add payment method</Text>
          </Pressable>
        ) : null}
      </ScrollView>

      <ModalSheet
        visible={menuFor !== null}
        onClose={() => setMenuFor(null)}
        title="Card actions"
        testID={testID ? `${testID}-menu` : undefined}
      >
        <View style={styles.menuList}>
          <Pressable
            onPress={() => {
              if (menuFor) onPressEdit(menuFor);
              setMenuFor(null);
            }}
            accessibilityRole="button"
            style={styles.menuItem}
            testID={testID ? `${testID}-menu-edit` : undefined}
          >
            <Text style={styles.menuItemText}>Edit</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              if (menuFor) onPressSetDefault(menuFor);
              setMenuFor(null);
            }}
            accessibilityRole="button"
            style={styles.menuItem}
            testID={testID ? `${testID}-menu-default` : undefined}
          >
            <Text style={styles.menuItemText}>Set as default</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setConfirmRemoveId(menuFor);
              setMenuFor(null);
            }}
            accessibilityRole="button"
            style={styles.menuItem}
            testID={testID ? `${testID}-menu-remove` : undefined}
          >
            <Text style={[styles.menuItemText, styles.menuItemDestructive]}>Remove</Text>
          </Pressable>
        </View>
      </ModalSheet>

      <ModalSheet
        visible={confirmRemoveId !== null}
        onClose={() => setConfirmRemoveId(null)}
        title="Remove this card?"
        testID={testID ? `${testID}-confirm-remove` : undefined}
        footer={
          <View style={styles.confirmFooter}>
            <Button
              label="Cancel"
              onPress={() => setConfirmRemoveId(null)}
              variant="tertiary"
              fullWidth
              testID={testID ? `${testID}-confirm-cancel` : undefined}
            />
            <Button
              label="Remove"
              variant="destructive"
              fullWidth
              onPress={() => {
                if (confirmRemoveId) onPressRemove(confirmRemoveId);
                setConfirmRemoveId(null);
              }}
              testID={testID ? `${testID}-confirm-remove-cta` : undefined}
            />
          </View>
        }
      >
        <Text style={styles.confirmBody}>
          You can always add it back later. This won&apos;t cancel any in-progress bookings.
        </Text>
      </ModalSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.pageHorizontal,
    paddingTop: spacing.s4,
    paddingBottom: spacing.s3,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  backGlyph: { fontSize: 22, lineHeight: 24, color: colors.foreground },
  title: { flex: 1, fontSize: 18, lineHeight: 24, fontWeight: "600", color: colors.foreground, textAlign: "center" },
  body: { padding: spacing.pageHorizontal, gap: spacing.s3 },
  errorBanner: {
    backgroundColor: colors.error,
    borderRadius: radius.md,
    padding: spacing.s3,
  },
  errorText: { color: colors.white, fontSize: 14, lineHeight: 20, fontWeight: "500" },
  applePayRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.foreground,
    borderRadius: radius.md,
    paddingHorizontal: spacing.s4,
    minHeight: 56,
    gap: spacing.s2,
  },
  applePayDisabled: { backgroundColor: colors.disabled },
  applePayGlyph: { fontSize: 18, lineHeight: 22, color: colors.white, fontWeight: "600" },
  applePayLabel: { fontSize: 16, lineHeight: 24, color: colors.white, fontWeight: "600" },
  skeleton: {
    height: 64,
    borderRadius: radius.md,
    backgroundColor: colors.disabledBg,
    marginBottom: spacing.s2,
  },
  emptyState: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.s5,
    alignItems: "center",
    gap: spacing.s3,
  },
  emptyTitle: { fontSize: 18, lineHeight: 24, fontWeight: "600", color: colors.foreground },
  emptyBody: { fontSize: 14, lineHeight: 20, color: colors.textMuted, textAlign: "center" },
  cardWrap: {},
  addTile: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 64,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border,
    gap: spacing.s2,
    paddingHorizontal: spacing.s4,
  },
  addGlyph: { fontSize: 22, color: colors.primary, fontWeight: "600" },
  addLabel: { fontSize: 14, lineHeight: 20, fontWeight: "500", color: colors.primary },
  menuList: { gap: spacing.s1 },
  menuItem: {
    minHeight: spacing.touchTarget,
    paddingHorizontal: spacing.s2,
    justifyContent: "center",
  },
  menuItemText: { fontSize: 16, lineHeight: 24, fontWeight: "500", color: colors.foreground },
  menuItemDestructive: { color: colors.error },
  confirmFooter: { flexDirection: "row", gap: spacing.s2 },
  confirmBody: { fontSize: 14, lineHeight: 20, color: colors.textMuted },
});
