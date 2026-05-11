import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";

import { SocialSignInSelectorScreen } from "../SocialSignInSelectorScreen";

describe("SocialSignInSelectorScreen", () => {
  it("renders Apple, Google, Facebook providers + email fallback by default", () => {
    const onProvider = jest.fn().mockResolvedValue(undefined);
    const { getByTestId } = render(<SocialSignInSelectorScreen onProvider={onProvider} />);
    expect(getByTestId("social-apple")).toBeTruthy();
    expect(getByTestId("social-google")).toBeTruthy();
    expect(getByTestId("social-facebook")).toBeTruthy();
    expect(getByTestId("social-fallback")).toBeTruthy();
  });

  it("hides Apple button when showApple=false", () => {
    const onProvider = jest.fn().mockResolvedValue(undefined);
    const { queryByTestId } = render(
      <SocialSignInSelectorScreen onProvider={onProvider} showApple={false} />,
    );
    expect(queryByTestId("social-apple")).toBeNull();
  });

  it("calls onProvider with the correct provider", async () => {
    const onProvider = jest.fn().mockResolvedValue(undefined);
    const { getByTestId } = render(<SocialSignInSelectorScreen onProvider={onProvider} />);
    await act(async () => {
      fireEvent.press(getByTestId("social-google"));
    });
    expect(onProvider).toHaveBeenCalledWith("google");
  });

  it("renders error banner when provider rejects", async () => {
    const onProvider = jest.fn().mockRejectedValue(new Error("Cancelled"));
    const { getByTestId, findByText } = render(
      <SocialSignInSelectorScreen onProvider={onProvider} />,
    );
    await act(async () => {
      fireEvent.press(getByTestId("social-apple"));
    });
    expect(await findByText("Cancelled")).toBeTruthy();
  });

  it("triggers onUseEmailInstead from fallback CTA", () => {
    const onProvider = jest.fn().mockResolvedValue(undefined);
    const onFallback = jest.fn();
    const { getByTestId } = render(
      <SocialSignInSelectorScreen
        onProvider={onProvider}
        onUseEmailInstead={onFallback}
      />,
    );
    fireEvent.press(getByTestId("social-fallback"));
    expect(onFallback).toHaveBeenCalled();
  });
});
