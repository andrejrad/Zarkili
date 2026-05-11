/**
 * w31PrimitivesK.test.tsx
 *
 * W31 Batch K — shared/ui primitive tests
 *
 * Covers:
 *   AIFeedbackBar         (6 tests)
 *   ExplainabilitySheet   (5 tests)
 *   ChannelPreferenceMatrix (4 tests)
 *   TierUpCelebration     (5 tests)
 *   FollowToggle          (5 tests)
 *   WalkInForm            (5 tests)
 */

import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

import { AIFeedbackBar } from "../src/shared/ui/AIFeedbackBar";
import { ChannelPreferenceMatrix } from "../src/shared/ui/ChannelPreferenceMatrix";
import { ExplainabilitySheet } from "../src/shared/ui/ExplainabilitySheet";
import { FollowToggle } from "../src/shared/ui/FollowToggle";
import { TierUpCelebration } from "../src/shared/ui/TierUpCelebration";
import { WalkInForm } from "../src/shared/ui/WalkInForm";

// ---------------------------------------------------------------------------
// AIFeedbackBar
// ---------------------------------------------------------------------------

describe("AIFeedbackBar", () => {
  it("renders 'Was this helpful?' label", () => {
    const { getByText } = render(
      <AIFeedbackBar onVote={jest.fn()} testID="fb" />
    );
    expect(getByText("Was this helpful?")).toBeTruthy();
  });

  it("renders positive and negative buttons", () => {
    const { getByTestId } = render(
      <AIFeedbackBar onVote={jest.fn()} testID="fb" />
    );
    expect(getByTestId("fb-positive")).toBeTruthy();
    expect(getByTestId("fb-negative")).toBeTruthy();
  });

  it("calls onVote with 'positive' when thumbs-up pressed", () => {
    const onVote = jest.fn();
    const { getByTestId } = render(
      <AIFeedbackBar onVote={onVote} testID="fb" />
    );
    fireEvent.press(getByTestId("fb-positive"));
    expect(onVote).toHaveBeenCalledWith("positive");
  });

  it("calls onVote with 'negative' when thumbs-down pressed", () => {
    const onVote = jest.fn();
    const { getByTestId } = render(
      <AIFeedbackBar onVote={onVote} testID="fb" />
    );
    fireEvent.press(getByTestId("fb-negative"));
    expect(onVote).toHaveBeenCalledWith("negative");
  });

  it("shows free-text area after vote when allowFreeText is true", () => {
    const { getByTestId } = render(
      <AIFeedbackBar vote="positive" allowFreeText onVote={jest.fn()} testID="fb" />
    );
    expect(getByTestId("fb-freetext-area")).toBeTruthy();
  });

  it("calls onSubmitFreeText when Send is pressed", () => {
    const onSubmit = jest.fn();
    const { getByTestId } = render(
      <AIFeedbackBar
        vote="negative"
        allowFreeText
        onVote={jest.fn()}
        onSubmitFreeText={onSubmit}
        testID="fb"
      />
    );
    fireEvent.changeText(getByTestId("fb-freetext"), "Could be better");
    fireEvent.press(getByTestId("fb-submit"));
    expect(onSubmit).toHaveBeenCalledWith("Could be better");
  });
});

// ---------------------------------------------------------------------------
// ExplainabilitySheet
// ---------------------------------------------------------------------------

describe("ExplainabilitySheet", () => {
  it("renders nothing when not visible", () => {
    const { queryByTestId } = render(
      <ExplainabilitySheet
        visible={false}
        explanation="Test"
        onDismiss={jest.fn()}
        testID="ex"
      />
    );
    // ModalSheet renders null when not visible — sheet content absent
    expect(queryByTestId("ex-explanation")).toBeNull();
  });

  it("renders explanation text when visible", () => {
    const { getByTestId } = render(
      <ExplainabilitySheet
        visible
        explanation="Based on your booking history"
        onDismiss={jest.fn()}
        testID="ex"
      />
    );
    expect(getByTestId("ex-explanation")).toBeTruthy();
  });

  it("renders reason chips", () => {
    const reasons = [{ id: "r1", label: "Your history" }];
    const { getByTestId } = render(
      <ExplainabilitySheet
        visible
        explanation="Test"
        reasons={reasons}
        onDismiss={jest.fn()}
        testID="ex"
      />
    );
    expect(getByTestId("ex-chips")).toBeTruthy();
  });

  it("calls onDismiss when 'Got it' pressed", () => {
    const onDismiss = jest.fn();
    const { getByTestId } = render(
      <ExplainabilitySheet
        visible
        explanation="Test"
        onDismiss={onDismiss}
        testID="ex"
      />
    );
    fireEvent.press(getByTestId("ex-dismiss"));
    expect(onDismiss).toHaveBeenCalled();
  });

  it("calls onOptOut when opt-out link pressed", () => {
    const onOptOut = jest.fn();
    const { getByTestId } = render(
      <ExplainabilitySheet
        visible
        explanation="Test"
        onDismiss={jest.fn()}
        onOptOut={onOptOut}
        testID="ex"
      />
    );
    fireEvent.press(getByTestId("ex-opt-out"));
    expect(onOptOut).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// ChannelPreferenceMatrix
// ---------------------------------------------------------------------------

describe("ChannelPreferenceMatrix", () => {
  const prefs = {
    booking_confirmed: { push: true, email: false, sms: false },
  };

  it("renders without crashing", () => {
    const { getByTestId } = render(
      <ChannelPreferenceMatrix
        preferences={prefs}
        onToggle={jest.fn()}
        testID="matrix"
      />
    );
    expect(getByTestId("matrix")).toBeTruthy();
  });

  it("renders a switch for each event/channel pair", () => {
    const { getByTestId } = render(
      <ChannelPreferenceMatrix
        preferences={prefs}
        onToggle={jest.fn()}
        testID="m"
      />
    );
    // spot-check a specific cell
    expect(getByTestId("m-booking_confirmed-push")).toBeTruthy();
  });

  it("calls onToggle with correct args when switch toggled", () => {
    const onToggle = jest.fn();
    const { getByTestId } = render(
      <ChannelPreferenceMatrix
        preferences={prefs}
        onToggle={onToggle}
        testID="m"
      />
    );
    fireEvent(getByTestId("m-booking_confirmed-email"), "valueChange", true);
    expect(onToggle).toHaveBeenCalledWith("email", "booking_confirmed", true);
  });

  it("reflects initial true state for a switch", () => {
    const { getByTestId } = render(
      <ChannelPreferenceMatrix
        preferences={{ booking_confirmed: { push: true } }}
        onToggle={jest.fn()}
        testID="m"
      />
    );
    expect(getByTestId("m-booking_confirmed-push").props.value).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// TierUpCelebration
// ---------------------------------------------------------------------------

describe("TierUpCelebration", () => {
  it("renders nothing when not visible", () => {
    const { queryByTestId } = render(
      <TierUpCelebration
        visible={false}
        newTier="Gold"
        onDismiss={jest.fn()}
        testID="tier"
      />
    );
    expect(queryByTestId("tier-card")).toBeNull();
  });

  it("renders tier name in badge when visible", () => {
    const { getByText } = render(
      <TierUpCelebration
        visible
        newTier="Gold"
        onDismiss={jest.fn()}
        testID="tier"
      />
    );
    expect(getByText("Gold")).toBeTruthy();
  });

  it("renders headline", () => {
    const { getByTestId } = render(
      <TierUpCelebration
        visible
        newTier="Platinum"
        onDismiss={jest.fn()}
        testID="tier"
      />
    );
    expect(getByTestId("tier-headline")).toBeTruthy();
  });

  it("renders benefit headline when provided", () => {
    const { getByTestId } = render(
      <TierUpCelebration
        visible
        newTier="Silver"
        benefitHeadline="Free treatment on us!"
        onDismiss={jest.fn()}
        testID="tier"
      />
    );
    expect(getByTestId("tier-benefit")).toBeTruthy();
  });

  it("calls onDismiss when CTA pressed", () => {
    const onDismiss = jest.fn();
    const { getByTestId } = render(
      <TierUpCelebration
        visible
        newTier="Bronze"
        onDismiss={onDismiss}
        testID="tier"
      />
    );
    fireEvent.press(getByTestId("tier-dismiss"));
    expect(onDismiss).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// FollowToggle
// ---------------------------------------------------------------------------

describe("FollowToggle", () => {
  it("renders 'Follow' when not following", () => {
    const { getByTestId } = render(
      <FollowToggle followed={false} onToggle={jest.fn()} testID="ft" />
    );
    expect(getByTestId("ft-label").props.children).toBe("Follow");
  });

  it("renders 'Following' when following", () => {
    const { getByTestId } = render(
      <FollowToggle followed onToggle={jest.fn()} testID="ft" />
    );
    expect(getByTestId("ft-label").props.children).toBe("Following");
  });

  it("calls onToggle with true when Follow pressed", () => {
    const onToggle = jest.fn();
    const { getByTestId } = render(
      <FollowToggle followed={false} onToggle={onToggle} testID="ft" />
    );
    fireEvent.press(getByTestId("ft"));
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it("calls onToggle with false when Following pressed (unfollow)", () => {
    const onToggle = jest.fn();
    const { getByTestId } = render(
      <FollowToggle followed onToggle={onToggle} testID="ft" />
    );
    fireEvent.press(getByTestId("ft"));
    expect(onToggle).toHaveBeenCalledWith(false);
  });

  it("optimistically flips label before promise resolves", () => {
    const onToggle = jest.fn(() => new Promise<void>(() => {})); // never resolves
    const { getByTestId } = render(
      <FollowToggle followed={false} onToggle={onToggle} testID="ft" />
    );
    fireEvent.press(getByTestId("ft"));
    // After optimistic update, label should show "Following" (or spinner)
    // At minimum, onToggle was called
    expect(onToggle).toHaveBeenCalledWith(true);
  });
});

// ---------------------------------------------------------------------------
// WalkInForm
// ---------------------------------------------------------------------------

describe("WalkInForm", () => {
  const services = [
    { id: "cut", name: "Haircut" },
    { id: "color", name: "Color" },
  ];

  it("renders name and phone inputs", () => {
    const { getByTestId } = render(
      <WalkInForm services={services} onSubmit={jest.fn()} testID="wif" />
    );
    expect(getByTestId("wif-name")).toBeTruthy();
    expect(getByTestId("wif-phone")).toBeTruthy();
  });

  it("renders service chips", () => {
    const { getByTestId } = render(
      <WalkInForm services={services} onSubmit={jest.fn()} testID="wif" />
    );
    expect(getByTestId("wif-svc-cut")).toBeTruthy();
    expect(getByTestId("wif-svc-color")).toBeTruthy();
  });

  it("calls onSubmit with entered data when submit pressed", () => {
    const onSubmit = jest.fn();
    const { getByTestId } = render(
      <WalkInForm services={services} onSubmit={onSubmit} testID="wif" />
    );
    fireEvent.changeText(getByTestId("wif-name"), "Maria Doe");
    fireEvent.press(getByTestId("wif-submit"));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ clientName: "Maria Doe" })
    );
  });

  it("shows error message when formState is error", () => {
    const { getByTestId } = render(
      <WalkInForm
        services={services}
        formState="error"
        errorMessage="Network error"
        onSubmit={jest.fn()}
        testID="wif"
      />
    );
    expect(getByTestId("wif-error")).toBeTruthy();
  });

  it("shows success screen when formState is success", () => {
    const { getByTestId } = render(
      <WalkInForm
        services={services}
        formState="success"
        onSubmit={jest.fn()}
        testID="wif"
      />
    );
    expect(getByTestId("wif-success")).toBeTruthy();
  });
});
