/**
 * ConsentToggleList.tsx — W29 Batch I marketing consent preference list.
 *
 * Renders a sectioned list of toggleable consent items. Each item uses
 * PreferenceToggleRow. Items with a `disclosure` string render an inline
 * info banner below the toggle row (TCPA / CCPA / CAN-SPAM compliance).
 */

import { StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, textStyles } from "./tokens";
import { PreferenceToggleRow } from "./PreferenceToggleRow";

export type ConsentItem = {
  id: string;
  label: string;
  helperText?: string;
  /** Legal disclosure rendered inline below the row (TCPA/CCPA/CAN-SPAM). */
  disclosure?: string;
  value: boolean;
};

export type ConsentToggleListProps = {
  items: ConsentItem[];
  onToggle: (id: string, value: boolean) => void;
  saving?: boolean;
  testID?: string;
};

export function ConsentToggleList({
  items,
  onToggle,
  saving,
  testID,
}: ConsentToggleListProps) {
  return (
    <View testID={testID}>
      {items.map((item, idx) => (
        <View
          key={item.id}
          style={[
            styles.item,
            idx < items.length - 1 ? styles.itemBorder : null,
          ]}
        >
          <PreferenceToggleRow
            label={item.label}
            helperText={item.helperText}
            value={item.value}
            onValueChange={(val) => onToggle(item.id, val)}
            disabled={saving}
            testID={testID ? `${testID}-${item.id}` : undefined}
          />
          {item.disclosure ? (
            <View
              style={styles.disclosure}
              testID={testID ? `${testID}-disclosure-${item.id}` : undefined}
            >
              <Text style={styles.disclosureText}>{item.disclosure}</Text>
            </View>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    paddingBottom: spacing.s3,
    marginBottom: spacing.s3,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  disclosure: {
    marginTop: spacing.s2,
    paddingHorizontal: spacing.s3,
    paddingVertical: spacing.s2,
    backgroundColor: colors.primary10,
    borderRadius: radius.sm,
  },
  disclosureText: {
    ...textStyles.bodySmall,
    color: colors.foreground,
  },
});
