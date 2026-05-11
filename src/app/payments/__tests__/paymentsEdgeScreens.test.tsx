/**
 * paymentsEdgeScreens.test.tsx — W30 Batch J payments edge screens.
 * J.4 PaymentFailedScreen / ThreeDsScreen
 * J.5 NativePayScreen
 * J.6 PreAuthDisclosureSheet / GiftCardSheet / PromoCodeSheet / WalletTopUpSheet
 * J.7 DisputeScreen
 */

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";

import {
  PaymentFailedScreen,
  ThreeDsScreen,
} from "../PaymentFailedScreen";
import { NativePayScreen } from "../NativePayScreen";
import {
  PreAuthDisclosureSheet,
  GiftCardSheet,
  PromoCodeSheet,
  WalletTopUpSheet,
} from "../PaymentExtrasScreen";
import { DisputeScreen } from "../DisputeScreen";

// ---------------------------------------------------------------------------
// J.4.1 — ThreeDsScreen
// ---------------------------------------------------------------------------

describe("ThreeDsScreen", () => {
  it("renders the 3DS overlay (pending state)", () => {
    const { getByTestId } = render(
      <ThreeDsScreen
        state="pending"
        onCancel={jest.fn()}
        testID="tds"
      />,
    );
    expect(getByTestId("tds")).toBeTruthy();
    expect(getByTestId("tds-overlay")).toBeTruthy();
  });

  it("renders approved banner", () => {
    const { getByTestId } = render(
      <ThreeDsScreen
        state="approved"
        onCancel={jest.fn()}
        testID="tds"
      />,
    );
    expect(getByTestId("tds-overlay-banner")).toBeTruthy();
  });

  it("calls onCancel", () => {
    const onCancel = jest.fn();
    const { getByTestId } = render(
      <ThreeDsScreen
        state="pending"
        onCancel={onCancel}
        testID="tds"
      />,
    );
    fireEvent.press(getByTestId("tds-overlay-cancel"));
    expect(onCancel).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// J.4.2 — PaymentFailedScreen
// ---------------------------------------------------------------------------

describe("PaymentFailedScreen", () => {
  it("renders default heading", () => {
    const { getByText } = render(
      <PaymentFailedScreen
        reason="declined"
        onRetry={jest.fn()}
        onUseAnotherMethod={jest.fn()}
        onContactSupport={jest.fn()}
      />,
    );
    expect(getByText(/payment didn't go through/i)).toBeTruthy();
  });

  it("calls onRetry", () => {
    const onRetry = jest.fn();
    const { getByTestId } = render(
      <PaymentFailedScreen
        reason="declined"
        onRetry={onRetry}
        onUseAnotherMethod={jest.fn()}
        onContactSupport={jest.fn()}
        testID="pf"
      />,
    );
    fireEvent.press(getByTestId("pf-retry"));
    expect(onRetry).toHaveBeenCalled();
  });

  it("renders insufficient-funds reason text", () => {
    const { getByTestId } = render(
      <PaymentFailedScreen
        reason="insufficient-funds"
        onRetry={jest.fn()}
        onUseAnotherMethod={jest.fn()}
        onContactSupport={jest.fn()}
        testID="pf"
      />,
    );
    expect(getByTestId("pf-reason")).toBeTruthy();
  });

  it("calls onUseAnotherMethod and onContactSupport", () => {
    const onUseOther = jest.fn();
    const onContact = jest.fn();
    const { getByTestId } = render(
      <PaymentFailedScreen
        reason="network"
        onRetry={jest.fn()}
        onUseAnotherMethod={onUseOther}
        onContactSupport={onContact}
        testID="pf"
      />,
    );
    fireEvent.press(getByTestId("pf-use-other"));
    fireEvent.press(getByTestId("pf-contact"));
    expect(onUseOther).toHaveBeenCalled();
    expect(onContact).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// J.5 — NativePayScreen
// ---------------------------------------------------------------------------

describe("NativePayScreen", () => {
  it("renders Apple Pay sheet in ready state", () => {
    const { getByText, getByTestId } = render(
      <NativePayScreen
        method="apple"
        amount="$65.00"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
        testID="np"
      />,
    );
    expect(getByText("Apple Pay")).toBeTruthy();
    expect(getByText("$65.00")).toBeTruthy();
    expect(getByTestId("np-confirm")).toBeTruthy();
  });

  it("renders Google Pay sheet", () => {
    const { getByText } = render(
      <NativePayScreen
        method="google"
        amount="$42.00"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />,
    );
    expect(getByText("Google Pay")).toBeTruthy();
  });

  it("renders ACH sheet", () => {
    const { getByText } = render(
      <NativePayScreen
        method="ach"
        amount="$90.00"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />,
    );
    expect(getByText("ACH Bank Debit")).toBeTruthy();
  });

  it("shows completed state", () => {
    const { getByTestId } = render(
      <NativePayScreen
        method="apple"
        state="completed"
        amount="$65.00"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
        testID="np"
      />,
    );
    expect(getByTestId("np-success")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// J.6 — Payment Extras Sheets
// ---------------------------------------------------------------------------

describe("PreAuthDisclosureSheet", () => {
  it("renders hold amount and confirm button", () => {
    const { getByTestId } = render(
      <PreAuthDisclosureSheet
        visible
        holdAmountCents={5000}
        onConfirm={jest.fn()}
        onClose={jest.fn()}
        testID="pauth"
      />,
    );
    expect(getByTestId("pauth")).toBeTruthy();
    expect(getByTestId("pauth-fee-box")).toBeTruthy();
    expect(getByTestId("pauth-confirm")).toBeTruthy();
  });

  it("calls onConfirm", () => {
    const onConfirm = jest.fn();
    const { getByTestId } = render(
      <PreAuthDisclosureSheet
        visible
        holdAmountCents={2500}
        onConfirm={onConfirm}
        onClose={jest.fn()}
        testID="pauth"
      />,
    );
    fireEvent.press(getByTestId("pauth-confirm"));
    expect(onConfirm).toHaveBeenCalled();
  });
});

describe("GiftCardSheet", () => {
  it("renders code input and apply button in default state", () => {
    const { getByTestId } = render(
      <GiftCardSheet
        visible
        onApply={jest.fn()}
        onRemove={jest.fn()}
        onClose={jest.fn()}
        testID="gc"
      />,
    );
    expect(getByTestId("gc-code-input")).toBeTruthy();
    expect(getByTestId("gc-apply")).toBeTruthy();
  });

  it("shows balance in valid state", () => {
    const { getByTestId } = render(
      <GiftCardSheet
        visible
        state="valid"
        balanceCents={7500}
        onApply={jest.fn()}
        onRemove={jest.fn()}
        onClose={jest.fn()}
        testID="gc"
      />,
    );
    expect(getByTestId("gc-balance")).toBeTruthy();
  });

  it("shows invalid banner", () => {
    const { getByTestId } = render(
      <GiftCardSheet
        visible
        state="invalid"
        onApply={jest.fn()}
        onRemove={jest.fn()}
        onClose={jest.fn()}
        testID="gc"
      />,
    );
    expect(getByTestId("gc-invalid-banner")).toBeTruthy();
  });

  it("shows remove button in applied state", () => {
    const onRemove = jest.fn();
    const { getByTestId } = render(
      <GiftCardSheet
        visible
        state="applied"
        balanceCents={4000}
        onApply={jest.fn()}
        onRemove={onRemove}
        onClose={jest.fn()}
        testID="gc"
      />,
    );
    fireEvent.press(getByTestId("gc-remove"));
    expect(onRemove).toHaveBeenCalled();
  });
});

describe("PromoCodeSheet", () => {
  it("renders code input in default state", () => {
    const { getByTestId } = render(
      <PromoCodeSheet
        visible
        onApply={jest.fn()}
        onRemove={jest.fn()}
        onClose={jest.fn()}
        testID="promo"
      />,
    );
    expect(getByTestId("promo-code-input")).toBeTruthy();
    expect(getByTestId("promo-apply")).toBeTruthy();
  });

  it("shows discount in applied state", () => {
    const { getByTestId } = render(
      <PromoCodeSheet
        visible
        state="applied"
        discountLabel="-$10.00"
        onApply={jest.fn()}
        onRemove={jest.fn()}
        onClose={jest.fn()}
        testID="promo"
      />,
    );
    expect(getByTestId("promo-discount")).toBeTruthy();
  });
});

describe("WalletTopUpSheet", () => {
  it("renders preset chips and custom input", () => {
    const { getByTestId } = render(
      <WalletTopUpSheet
        visible
        onTopUp={jest.fn()}
        onClose={jest.fn()}
        testID="wallet"
      />,
    );
    expect(getByTestId("wallet-preset-2500")).toBeTruthy();
    expect(getByTestId("wallet-preset-5000")).toBeTruthy();
    expect(getByTestId("wallet-preset-10000")).toBeTruthy();
    expect(getByTestId("wallet-custom")).toBeTruthy();
  });

  it("calls onTopUp with preset amount on tap", () => {
    const onTopUp = jest.fn();
    const { getByTestId } = render(
      <WalletTopUpSheet
        visible
        onTopUp={onTopUp}
        onClose={jest.fn()}
        testID="wallet"
      />,
    );
    fireEvent.press(getByTestId("wallet-preset-5000"));
    fireEvent.press(getByTestId("wallet-topup"));
    expect(onTopUp).toHaveBeenCalledWith(5000);
  });
});

// ---------------------------------------------------------------------------
// J.7 — DisputeScreen
// ---------------------------------------------------------------------------

describe("DisputeScreen", () => {
  it("renders open state with Disputed pill", () => {
    const { getByTestId, getByText } = render(
      <DisputeScreen
        state="open"
        disputedAmount="$65.00"
        reason="I did not authorise this charge."
        testID="disp"
      />,
    );
    expect(getByTestId("disp-pill")).toBeTruthy();
    expect(getByText("Disputed")).toBeTruthy();
    expect(getByTestId("disp-rules")).toBeTruthy();
  });

  it("renders timeline steps", () => {
    const { getByTestId } = render(
      <DisputeScreen
        state="open"
        disputedAmount="$40.00"
        reason="Wrong amount."
        timeline={[
          { label: "Dispute filed", completed: true },
          { label: "Under review", completed: false },
        ]}
        testID="disp"
      />,
    );
    expect(getByTestId("disp-timeline")).toBeTruthy();
  });

  it("renders evidence list", () => {
    const { getByTestId } = render(
      <DisputeScreen
        state="open"
        disputedAmount="$65.00"
        reason="Not my charge."
        evidence={[
          { id: "e1", label: "Receipt PDF", type: "receipt" },
          { id: "e2", label: "Screenshot", type: "photo" },
        ]}
        testID="disp"
      />,
    );
    expect(getByTestId("disp-evidence")).toBeTruthy();
  });

  it("renders resolved-won state", () => {
    const { getByText } = render(
      <DisputeScreen
        state="resolved-won"
        disputedAmount="$65.00"
        reason="Resolved in favour of customer."
        testID="disp"
      />,
    );
    expect(getByText("Resolved — Won")).toBeTruthy();
  });
});
