/**
 * BookingPoliciesScreen.tsx — C.6 Policies acknowledgement.
 *
 * Modal sheet with cancellation, no-show, and house policy sections plus
 * required acknowledgement checkbox before payment.
 */

import { ScrollView, StyleSheet, Text, View } from "react-native";

import {
  Button,
  ModalSheet,
  PolicyAcknowledgement,
  colors,
  spacing,
} from "../../shared/ui";

export type BookingPolicySection = {
  id: string;
  title: string;
  body: string;
};

export type BookingPoliciesScreenProps = {
  visible: boolean;
  sections: readonly BookingPolicySection[];
  acknowledged: boolean;
  errorMessage?: string;
  loading?: boolean;
  onChangeAcknowledged: (next: boolean) => void;
  onPressAgreeAndContinue: () => void;
  onPressClose: () => void;
  testID?: string;
};

export function BookingPoliciesScreen({
  visible,
  sections,
  acknowledged,
  errorMessage,
  loading,
  onChangeAcknowledged,
  onPressAgreeAndContinue,
  onPressClose,
  testID,
}: BookingPoliciesScreenProps) {
  return (
    <ModalSheet
      visible={visible}
      onClose={onPressClose}
      title="Policies"
      testID={testID}
      footer={
        <Button
          label="Agree and continue"
          onPress={onPressAgreeAndContinue}
          fullWidth
          disabled={!acknowledged || loading}
          loading={loading}
          testID={testID ? `${testID}-agree` : undefined}
        />
      }
    >
      <ScrollView style={styles.scroll} contentContainerStyle={styles.body}>
        {sections.map((s) => (
          <View key={s.id} style={styles.section} testID={testID ? `${testID}-section-${s.id}` : undefined}>
            <Text style={styles.sectionTitle}>{s.title}</Text>
            <Text style={styles.sectionBody}>{s.body}</Text>
          </View>
        ))}
        <View style={styles.ack}>
          <PolicyAcknowledgement
            checked={acknowledged}
            onChange={onChangeAcknowledged}
            label="I have read and agree to these policies."
            errorMessage={errorMessage}
            testID={testID ? `${testID}-ack` : undefined}
          />
        </View>
      </ScrollView>
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0 },
  body: { padding: spacing.pageHorizontal, gap: spacing.s4 },
  section: { gap: spacing.s2 },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: colors.foreground },
  sectionBody: { fontSize: 14, lineHeight: 20, color: colors.foreground },
  ack: { marginTop: spacing.s2 },
});
