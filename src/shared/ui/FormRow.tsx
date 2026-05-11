/**
 * FormRow.tsx — A.C3 form-row primitive.
 *
 * Wraps form children with consistent vertical rhythm:
 *   - between rows gap 16 (caller-managed; FormRow uses marginBottom)
 *   - within row gap 4 between label and content
 */

import { StyleSheet, View } from "react-native";
import type { ReactNode } from "react";

import { spacing } from "./tokens";

export type FormRowProps = {
  children: ReactNode;
  testID?: string;
};

export function FormRow({ children, testID }: FormRowProps) {
  return (
    <View style={styles.row} testID={testID}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginBottom: spacing.s4,
  },
});
