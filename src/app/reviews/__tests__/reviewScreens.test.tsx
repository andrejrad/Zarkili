/**
 * reviewScreens.test.tsx
 * Smoke + interaction tests for E.7-E.8 review screens.
 */

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";

import { ReviewPromptScreen } from "../ReviewPromptScreen";
import { ReviewDetailScreen } from "../ReviewDetailScreen";
import { EMPTY_REVIEW_DRAFT } from "../../loyalty/loyaltyHelpers";

/* ─────────────────────── ReviewPromptScreen ─────────────────────── */
describe("ReviewPromptScreen", () => {
  const salon = { name: "Salon Aurora", address: "123 Main St" };
  const baseProps = {
    salon,
    draft: { ...EMPTY_REVIEW_DRAFT },
    onDraftChange: jest.fn(),
    onSubmit: jest.fn(),
    testID: "rp",
  };

  it("renders salon name", () => {
    const { getByText } = render(<ReviewPromptScreen {...baseProps} />);
    expect(getByText("Salon Aurora")).toBeTruthy();
  });

  it("renders submit CTA disabled when rating is 0", () => {
    const { getByTestId } = render(<ReviewPromptScreen {...baseProps} />);
    expect(getByTestId("rp-submit").props.accessibilityState?.disabled).toBe(true);
  });

  it("renders submit CTA enabled when rating > 0", () => {
    const { getByTestId } = render(
      <ReviewPromptScreen {...baseProps} draft={{ ...EMPTY_REVIEW_DRAFT, overallRating: 5 }} />,
    );
    expect(getByTestId("rp-submit").props.accessibilityState?.disabled).toBe(false);
  });

  it("calls onSubmit when CTA pressed with valid rating", () => {
    const onSubmit = jest.fn();
    const { getByTestId } = render(
      <ReviewPromptScreen
        {...baseProps}
        draft={{ ...EMPTY_REVIEW_DRAFT, overallRating: 4 }}
        onSubmit={onSubmit}
      />,
    );
    fireEvent.press(getByTestId("rp-submit"));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("shows profanity warning banner", () => {
    const { getByText } = render(
      <ReviewPromptScreen {...baseProps} screenState="profanity-warning" />,
    );
    expect(getByText(/prohibited language/i)).toBeTruthy();
  });

  it("calls onDraftChange when text is entered", () => {
    const onDraftChange = jest.fn();
    const { getByTestId } = render(
      <ReviewPromptScreen {...baseProps} onDraftChange={onDraftChange} />,
    );
    fireEvent.changeText(getByTestId("rp-body"), "Great service!");
    expect(onDraftChange).toHaveBeenCalledWith(expect.objectContaining({ text: "Great service!" }));
  });

  it("renders anonymous toggle", () => {
    const { getByTestId } = render(<ReviewPromptScreen {...baseProps} />);
    expect(getByTestId("rp-anonymous")).toBeTruthy();
  });
});

/* ─────────────────────── ReviewDetailScreen ─────────────────────── */
describe("ReviewDetailScreen", () => {
  const baseProps = {
    authorName: "Jane Smith",
    postedDate: "01/15/2025",
    overallRating: 4,
    body: "Fantastic haircut, very professional.",
    testID: "rd",
  };

  it("renders author name and date", () => {
    const { getByText } = render(<ReviewDetailScreen {...baseProps} />);
    expect(getByText("Jane Smith")).toBeTruthy();
    expect(getByText("01/15/2025")).toBeTruthy();
  });

  it("renders review body", () => {
    const { getByText } = render(<ReviewDetailScreen {...baseProps} />);
    expect(getByText("Fantastic haircut, very professional.")).toBeTruthy();
  });

  it("calls onHelpfulPress when helpful button is pressed", () => {
    const onHelpfulPress = jest.fn();
    const { getByTestId } = render(
      <ReviewDetailScreen {...baseProps} onHelpfulPress={onHelpfulPress} />,
    );
    fireEvent.press(getByTestId("rd-helpful"));
    expect(onHelpfulPress).toHaveBeenCalledTimes(1);
  });

  it("renders salon response when screenState=with-response", () => {
    const { getByText } = render(
      <ReviewDetailScreen
        {...baseProps}
        screenState="with-response"
        salonResponse={{ salonName: "Salon Aurora", responseText: "Thank you!", postedDate: "01/16/2025" }}
      />,
    );
    expect(getByText("Owner response")).toBeTruthy();
    expect(getByText("Thank you!")).toBeTruthy();
  });

  it("shows removed state message", () => {
    const { getByText } = render(
      <ReviewDetailScreen {...baseProps} screenState="removed-by-moderation" />,
    );
    expect(getByText(/removed/i)).toBeTruthy();
  });

  it("shows error state with retry", () => {
    const onRetry = jest.fn();
    const { getByTestId } = render(
      <ReviewDetailScreen
        {...baseProps}
        screenState="error"
        errorMessage="Load failed"
        onRetry={onRetry}
      />,
    );
    fireEvent.press(getByTestId("rd-retry"));
    expect(onRetry).toHaveBeenCalled();
  });
});
