/**
 * Web stub for @stripe/stripe-react-native.
 *
 * The native SDK uses codegen native modules that don't exist on web.
 * Metro is configured (metro.config.js) to redirect to this file when
 * building for web platform. Payment flows require a native build; on web
 * they are no-ops / placeholder UI.
 */
import React from "react";
import { View, Text, StyleSheet } from "react-native";

// StripeProvider — just renders children on web (no SDK init needed)
export const StripeProvider: React.FC<React.PropsWithChildren<Record<string, unknown>>> = ({
  children,
}) => <>{children}</>;

// CardField stub — renders an informational placeholder on web
export const CardField: React.FC<Record<string, unknown>> = () => (
  <View style={styles.placeholder}>
    <Text style={styles.text}>Card entry not supported on web</Text>
  </View>
);

const styles = StyleSheet.create({
  placeholder: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f9f9f9",
  },
  text: {
    color: "#999",
    fontSize: 13,
  },
});

// Common hook stubs
export const useStripe = () => ({
  createPaymentMethod: async () => ({ error: { message: "Not supported on web" } }),
  confirmPayment: async () => ({ error: { message: "Not supported on web" } }),
  handleNextAction: async () => ({ error: { message: "Not supported on web" } }),
  initPaymentSheet: async () => ({ error: { message: "Not supported on web" } }),
  presentPaymentSheet: async () => ({ error: { message: "Not supported on web" } }),
  confirmSetupIntent: async () => ({ error: { message: "Not supported on web" } }),
});

// No-op initialise
export const initStripe = async () => {};
