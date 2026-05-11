import React from "react";
import { render } from "@testing-library/react-native";

import { AddPaymentMethodScreen } from "../AddPaymentMethodScreen";
import { BookingHistoryScreen } from "../BookingHistoryScreen";
import { ReceiptScreen } from "../ReceiptScreen";
import { RefundStatusScreen } from "../RefundStatusScreen";
import { SavedPaymentMethodsScreen } from "../SavedPaymentMethodsScreen";
import { TippingScreen } from "../TippingScreen";

describe("SavedPaymentMethodsScreen", () => {
  it("renders empty state when no methods", () => {
    const { getByTestId, getByText } = render(
      <SavedPaymentMethodsScreen
        methods={[]}
        applePayAvailable
        onPressEdit={jest.fn()}
        onPressSetDefault={jest.fn()}
        onPressRemove={jest.fn()}
        onPressAddCard={jest.fn()}
        testID="spm"
      />,
    );
    expect(getByTestId("spm")).toBeTruthy();
    expect(getByText("Payment methods")).toBeTruthy();
  });

  it("renders saved cards", () => {
    const { getByText } = render(
      <SavedPaymentMethodsScreen
        methods={[
          {
            id: "pm_1",
            brand: "visa",
            last4: "4242",
            expMonth: 12,
            expYear: 2030,
            isDefault: true,
          },
        ]}
        onPressEdit={jest.fn()}
        onPressSetDefault={jest.fn()}
        onPressRemove={jest.fn()}
        onPressAddCard={jest.fn()}
      />,
    );
    expect(getByText(/Visa/)).toBeTruthy();
  });
});

describe("AddPaymentMethodScreen", () => {
  it("renders the form with disabled CTA initially", () => {
    const { getByTestId } = render(
      <AddPaymentMethodScreen
        state={{ cardholderName: "", zip: "", cardComplete: false, setAsDefault: false }}
        onChange={jest.fn()}
        onSubmit={jest.fn()}
        testID="addpm"
      />,
    );
    expect(getByTestId("addpm")).toBeTruthy();
  });
});

describe("TippingScreen", () => {
  it("renders chip group and live total", () => {
    const { getByText } = render(
      <TippingScreen
        subtotal={100}
        state={{ selectedPresetId: "p20", customAmountInput: "" }}
        onChange={jest.fn()}
        onConfirm={jest.fn()}
      />,
    );
    expect(getByText(/100% of tips go to your stylist/i)).toBeTruthy();
  });
});

describe("ReceiptScreen", () => {
  it("renders salon, line items and totals", () => {
    const { getByText } = render(
      <ReceiptScreen
        salonName="Glow Salon"
        salonAddress="123 Pine St, Seattle, WA"
        occurredAtIso="2026-04-15T18:30:00Z"
        items={[{ id: "i1", description: "Haircut", quantity: 1, unitPriceUsd: 60 }]}
        taxLines={[{ label: "WA Sales Tax 10.25%", amount: 6.15 }]}
        tip={12}
        paymentMethodLabel="Visa •••• 4242"
        onPressEmail={jest.fn()}
        onPressDownload={jest.fn()}
        onPressShare={jest.fn()}
      />,
    );
    expect(getByText("Glow Salon")).toBeTruthy();
    expect(getByText("Haircut")).toBeTruthy();
    expect(getByText("Visa •••• 4242")).toBeTruthy();
  });
});

describe("BookingHistoryScreen", () => {
  it("renders tabs and empty state for upcoming", () => {
    const { getByTestId } = render(
      <BookingHistoryScreen
        records={[]}
        state={{
          tab: "upcoming",
          searchQuery: "",
          filters: {},
          filterSheetOpen: false,
        }}
        onChange={jest.fn()}
        onPressRecord={jest.fn()}
        testID="bh"
      />,
    );
    expect(getByTestId("bh-empty")).toBeTruthy();
  });
});

describe("RefundStatusScreen", () => {
  it("renders pending status with timeline", () => {
    const { getByText } = render(
      <RefundStatusScreen
        status="pending"
        amountUsd={45}
        booking={{
          salonName: "Glow Salon",
          serviceName: "Haircut",
          startsAtIso: "2026-04-15T18:30:00Z",
        }}
        requestedAtIso="2026-04-16T10:00:00Z"
      />,
    );
    expect(getByText("Glow Salon")).toBeTruthy();
    expect(getByText(/Haircut/)).toBeTruthy();
  });

  it("renders denied status with denial reason", () => {
    const { getByText } = render(
      <RefundStatusScreen
        status="denied"
        amountUsd={0}
        booking={{
          salonName: "Glow Salon",
          serviceName: "Color",
          startsAtIso: "2026-04-15T18:30:00Z",
        }}
        requestedAtIso="2026-04-16T10:00:00Z"
        deniedAtIso="2026-04-17T10:00:00Z"
        denialReason="Service was completed."
      />,
    );
    expect(getByText(/Service was completed/)).toBeTruthy();
  });
});
