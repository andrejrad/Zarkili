import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";

import { AccountMergeScreen } from "../AccountMergeScreen";

describe("AccountMergeScreen", () => {
  it("renders booking + loyalty summary", () => {
    const { getByText } = render(
      <AccountMergeScreen
        bookingCount={2}
        loyaltyPoints={120}
        onChoose={jest.fn().mockResolvedValue(undefined)}
      />,
    );
    expect(getByText(/2 bookings/i)).toBeTruthy();
    expect(getByText(/120 loyalty points/i)).toBeTruthy();
  });

  it("calls onChoose with signIn when sign-in card is tapped", async () => {
    const onChoose = jest.fn().mockResolvedValue(undefined);
    const { getByTestId } = render(
      <AccountMergeScreen bookingCount={1} onChoose={onChoose} />,
    );
    await act(async () => {
      fireEvent.press(getByTestId("merge-signin"));
    });
    expect(onChoose).toHaveBeenCalledWith("signIn");
  });

  it("disables create-new when emailExists conflict and shows warning", () => {
    const onChoose = jest.fn().mockResolvedValue(undefined);
    const { getByTestId, getByText } = render(
      <AccountMergeScreen bookingCount={1} emailExists onChoose={onChoose} />,
    );
    expect(getByText(/already registered/i)).toBeTruthy();
    expect(getByTestId("merge-create").props.accessibilityState?.disabled).toBe(true);
  });
});
