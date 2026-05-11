import React from "react";
import { render, fireEvent } from "@testing-library/react-native";

import {
  CurrencyInput,
  PaymentMethodRow,
  ReceiptLineItem,
  TipPresetChipGroup,
} from "../index";

describe("PaymentMethodRow", () => {
  it("renders brand + last4 + expiry + default badge", () => {
    const { getByText, getByTestId } = render(
      <PaymentMethodRow
        brandLabel="Visa"
        last4Label="•••• 4242"
        expiryLabel="Expires 12/28"
        isDefault
        testID="row"
      />,
    );
    expect(getByText("Visa •••• 4242")).toBeTruthy();
    expect(getByText("Expires 12/28")).toBeTruthy();
    expect(getByTestId("row-default")).toBeTruthy();
  });

  it("invokes onPressMenu when kebab is pressed", () => {
    const onPressMenu = jest.fn();
    const { getByTestId } = render(
      <PaymentMethodRow brandLabel="Visa" last4Label="•••• 4242" onPressMenu={onPressMenu} testID="row" />,
    );
    fireEvent.press(getByTestId("row-menu"));
    expect(onPressMenu).toHaveBeenCalledTimes(1);
  });

  it("renders error label when expired", () => {
    const { getByText } = render(
      <PaymentMethodRow brandLabel="Visa" last4Label="•••• 4242" expiryLabel="Expires 01/20" expired />,
    );
    expect(getByText(/Expired/)).toBeTruthy();
  });

  it("invokes onPress for the row body", () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <PaymentMethodRow brandLabel="Visa" last4Label="•••• 4242" onPress={onPress} testID="row" />,
    );
    fireEvent.press(getByTestId("row-press"));
    expect(onPress).toHaveBeenCalled();
  });
});

describe("CurrencyInput", () => {
  it("strips non-numeric characters before invoking onChange", () => {
    const onChangeText = jest.fn();
    const { getByTestId } = render(
      <CurrencyInput value="" onChangeText={onChangeText} testID="ci" />,
    );
    fireEvent.changeText(getByTestId("ci-input"), "$12.3a4");
    expect(onChangeText).toHaveBeenLastCalledWith("12.34");
  });

  it("clamps to 2 decimal places", () => {
    const onChangeText = jest.fn();
    const { getByTestId } = render(
      <CurrencyInput value="" onChangeText={onChangeText} testID="ci" />,
    );
    fireEvent.changeText(getByTestId("ci-input"), "12.3456");
    expect(onChangeText).toHaveBeenLastCalledWith("12.34");
  });

  it("rejects multiple decimal points", () => {
    const onChangeText = jest.fn();
    const { getByTestId } = render(
      <CurrencyInput value="" onChangeText={onChangeText} testID="ci" />,
    );
    fireEvent.changeText(getByTestId("ci-input"), "1.2.3");
    expect(onChangeText).toHaveBeenLastCalledWith("1.23");
  });

  it("renders error helper text when provided", () => {
    const { getByTestId } = render(
      <CurrencyInput value="abc" onChangeText={() => {}} errorText="Invalid amount" testID="ci" />,
    );
    expect(getByTestId("ci-error")).toBeTruthy();
  });
});

describe("TipPresetChipGroup", () => {
  const opts = [
    { id: "p15", label: "15%" },
    { id: "p20", label: "20%" },
    { id: "none", label: "No tip", destructive: true },
  ];

  it("renders all chips and marks the selected one", () => {
    const { getByTestId } = render(
      <TipPresetChipGroup options={opts} selectedId="p20" onSelect={() => {}} testID="tg" />,
    );
    expect(getByTestId("tg-p15")).toBeTruthy();
    expect(getByTestId("tg-p20")).toBeTruthy();
    expect(getByTestId("tg-none")).toBeTruthy();
  });

  it("invokes onSelect with the correct id", () => {
    const onSelect = jest.fn();
    const { getByTestId } = render(
      <TipPresetChipGroup options={opts} selectedId={null} onSelect={onSelect} testID="tg" />,
    );
    fireEvent.press(getByTestId("tg-p15"));
    expect(onSelect).toHaveBeenCalledWith("p15");
  });
});

describe("ReceiptLineItem", () => {
  it("renders description, qty (when > 1) and amount", () => {
    const { getByText, getByTestId } = render(
      <ReceiptLineItem description="Haircut" quantity={2} amountLabel="$60.00" testID="li" />,
    );
    expect(getByText("Haircut")).toBeTruthy();
    expect(getByTestId("li-qty")).toBeTruthy();
    expect(getByText("$60.00")).toBeTruthy();
  });

  it("hides qty when quantity is 1", () => {
    const { queryByTestId } = render(
      <ReceiptLineItem description="Cut" quantity={1} amountLabel="$30.00" testID="li" />,
    );
    expect(queryByTestId("li-qty")).toBeNull();
  });

  it("renders modifier line when provided", () => {
    const { getByText } = render(
      <ReceiptLineItem description="Color" amountLabel="$80.00" modifier="Add: aromatherapy" />,
    );
    expect(getByText("Add: aromatherapy")).toBeTruthy();
  });
});
