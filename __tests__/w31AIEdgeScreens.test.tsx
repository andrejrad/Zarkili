/**
 * w31AIEdgeScreens.test.tsx
 *
 * W31 Batch K — K.1 AI Edge Screens (30 tests)
 *
 * Covers: AIConsentScreen, AIFeedbackScreen, AIHistoryScreen,
 *         AIDegradedScreen, AIOptOutScreen
 */

import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

import {
  AIConsentScreen,
  AIDegradedScreen,
  AIFeedbackScreen,
  AIHistoryScreen,
  AIOptOutScreen,
} from "../src/app/ai/AIEdgeScreens";

// ---------------------------------------------------------------------------
// AIConsentScreen
// ---------------------------------------------------------------------------

describe("AIConsentScreen", () => {
  it("renders title", () => {
    const { getByTestId } = render(
      <AIConsentScreen onOptIn={jest.fn()} onOptOut={jest.fn()} testID="cs" />
    );
    expect(getByTestId("cs-title")).toBeTruthy();
  });

  it("renders opt-in and opt-out buttons", () => {
    const { getByTestId } = render(
      <AIConsentScreen onOptIn={jest.fn()} onOptOut={jest.fn()} testID="cs" />
    );
    expect(getByTestId("cs-opt-in")).toBeTruthy();
    expect(getByTestId("cs-opt-out")).toBeTruthy();
  });

  it("calls onOptIn when Enable is pressed", () => {
    const onOptIn = jest.fn();
    const { getByTestId } = render(
      <AIConsentScreen onOptIn={onOptIn} onOptOut={jest.fn()} testID="cs" />
    );
    fireEvent.press(getByTestId("cs-opt-in"));
    expect(onOptIn).toHaveBeenCalled();
  });

  it("calls onOptOut when skip is pressed", () => {
    const onOptOut = jest.fn();
    const { getByTestId } = render(
      <AIConsentScreen onOptIn={jest.fn()} onOptOut={onOptOut} testID="cs" />
    );
    fireEvent.press(getByTestId("cs-opt-out"));
    expect(onOptOut).toHaveBeenCalled();
  });

  it("renders all 3 feature bullets", () => {
    const { getByText } = render(
      <AIConsentScreen onOptIn={jest.fn()} onOptOut={jest.fn()} testID="cs" />
    );
    expect(getByText("Personalised suggestions")).toBeTruthy();
    expect(getByText("Smart chat assistant")).toBeTruthy();
    expect(getByText("Private by design")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// AIFeedbackScreen
// ---------------------------------------------------------------------------

describe("AIFeedbackScreen", () => {
  it("renders title", () => {
    const { getByText } = render(
      <AIFeedbackScreen onSubmit={jest.fn()} onDismiss={jest.fn()} testID="afb" />
    );
    expect(getByText("Share your feedback")).toBeTruthy();
  });

  it("renders submit button disabled when no vote selected", () => {
    const { getByTestId } = render(
      <AIFeedbackScreen onSubmit={jest.fn()} onDismiss={jest.fn()} testID="afb" />
    );
    expect(getByTestId("afb-submit").props.accessibilityState?.disabled).toBeTruthy();
  });

  it("renders suggestion preview when provided", () => {
    const { getByTestId } = render(
      <AIFeedbackScreen
        suggestionPreview="Try the Balayage service"
        onSubmit={jest.fn()}
        onDismiss={jest.fn()}
        testID="afb"
      />
    );
    expect(getByTestId("afb-preview")).toBeTruthy();
  });

  it("calls onDismiss when cancel pressed", () => {
    const onDismiss = jest.fn();
    const { getByTestId } = render(
      <AIFeedbackScreen onSubmit={jest.fn()} onDismiss={onDismiss} testID="afb" />
    );
    fireEvent.press(getByTestId("afb-cancel"));
    expect(onDismiss).toHaveBeenCalled();
  });

  it("shows submitted state after submit", async () => {
    const onSubmit = jest.fn();
    const { getByTestId } = render(
      <AIFeedbackScreen onSubmit={onSubmit} onDismiss={jest.fn()} testID="afb" />
    );
    fireEvent.press(getByTestId("afb-bar-positive"));
    fireEvent.press(getByTestId("afb-submit"));
    // Allow promise to resolve
    await Promise.resolve();
    expect(getByTestId("afb-submitted")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// AIHistoryScreen
// ---------------------------------------------------------------------------

describe("AIHistoryScreen", () => {
  const conversations = [
    { id: "c1", createdAt: "Jan 1", summary: "Discussed booking options" },
    { id: "c2", createdAt: "Jan 5", summary: "Asked about loyalty points" },
  ];

  it("renders list of conversations", () => {
    const { getByTestId } = render(
      <AIHistoryScreen
        conversations={conversations}
        onSelectConversation={jest.fn()}
        testID="hist"
      />
    );
    expect(getByTestId("hist-row-c1")).toBeTruthy();
    expect(getByTestId("hist-row-c2")).toBeTruthy();
  });

  it("calls onSelectConversation with id when row pressed", () => {
    const onSelect = jest.fn();
    const { getByTestId } = render(
      <AIHistoryScreen
        conversations={conversations}
        onSelectConversation={onSelect}
        testID="hist"
      />
    );
    fireEvent.press(getByTestId("hist-row-c1"));
    expect(onSelect).toHaveBeenCalledWith("c1");
  });

  it("renders empty state when no conversations", () => {
    const { getByTestId } = render(
      <AIHistoryScreen
        conversations={[]}
        onSelectConversation={jest.fn()}
        testID="hist"
      />
    );
    expect(getByTestId("hist-empty")).toBeTruthy();
  });

  it("renders summary text for each conversation", () => {
    const { getByText } = render(
      <AIHistoryScreen
        conversations={conversations}
        onSelectConversation={jest.fn()}
        testID="hist"
      />
    );
    expect(getByText("Discussed booking options")).toBeTruthy();
  });

  it("renders date for each conversation", () => {
    const { getAllByText } = render(
      <AIHistoryScreen
        conversations={conversations}
        onSelectConversation={jest.fn()}
        testID="hist"
      />
    );
    expect(getAllByText("Jan 1").length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// AIDegradedScreen
// ---------------------------------------------------------------------------

describe("AIDegradedScreen", () => {
  it("renders headline", () => {
    const { getByTestId } = render(
      <AIDegradedScreen onRetry={jest.fn()} onDismiss={jest.fn()} testID="deg" />
    );
    expect(getByTestId("deg-headline")).toBeTruthy();
  });

  it("renders retry and dismiss buttons", () => {
    const { getByTestId } = render(
      <AIDegradedScreen onRetry={jest.fn()} onDismiss={jest.fn()} testID="deg" />
    );
    expect(getByTestId("deg-retry")).toBeTruthy();
    expect(getByTestId("deg-dismiss")).toBeTruthy();
  });

  it("calls onRetry when retry pressed", () => {
    const onRetry = jest.fn();
    const { getByTestId } = render(
      <AIDegradedScreen onRetry={onRetry} onDismiss={jest.fn()} testID="deg" />
    );
    fireEvent.press(getByTestId("deg-retry"));
    expect(onRetry).toHaveBeenCalled();
  });

  it("calls onDismiss when dismiss pressed", () => {
    const onDismiss = jest.fn();
    const { getByTestId } = render(
      <AIDegradedScreen onRetry={jest.fn()} onDismiss={onDismiss} testID="deg" />
    );
    fireEvent.press(getByTestId("deg-dismiss"));
    expect(onDismiss).toHaveBeenCalled();
  });

  it("renders body text about AI being unavailable", () => {
    const { getByText } = render(
      <AIDegradedScreen onRetry={jest.fn()} onDismiss={jest.fn()} testID="deg" />
    );
    expect(
      getByText(/AI features temporarily unavailable/i)
    ).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// AIOptOutScreen
// ---------------------------------------------------------------------------

describe("AIOptOutScreen", () => {
  it("renders title", () => {
    const { getByText } = render(
      <AIOptOutScreen onConfirmOptOut={jest.fn()} onCancel={jest.fn()} testID="oo" />
    );
    expect(getByText("Turn off Zarkili AI?")).toBeTruthy();
  });

  it("renders confirm and cancel buttons", () => {
    const { getByTestId } = render(
      <AIOptOutScreen onConfirmOptOut={jest.fn()} onCancel={jest.fn()} testID="oo" />
    );
    expect(getByTestId("oo-confirm")).toBeTruthy();
    expect(getByTestId("oo-cancel")).toBeTruthy();
  });

  it("calls onConfirmOptOut when confirm pressed", () => {
    const onConfirm = jest.fn();
    const { getByTestId } = render(
      <AIOptOutScreen onConfirmOptOut={onConfirm} onCancel={jest.fn()} testID="oo" />
    );
    fireEvent.press(getByTestId("oo-confirm"));
    expect(onConfirm).toHaveBeenCalled();
  });

  it("calls onCancel when keep-enabled pressed", () => {
    const onCancel = jest.fn();
    const { getByTestId } = render(
      <AIOptOutScreen onConfirmOptOut={jest.fn()} onCancel={onCancel} testID="oo" />
    );
    fireEvent.press(getByTestId("oo-cancel"));
    expect(onCancel).toHaveBeenCalled();
  });

  it("renders all 4 consequences", () => {
    const { getByText } = render(
      <AIOptOutScreen onConfirmOptOut={jest.fn()} onCancel={jest.fn()} testID="oo" />
    );
    expect(getByText(/Personalised service recommendations/i)).toBeTruthy();
    expect(getByText(/Smart booking suggestions/i)).toBeTruthy();
    expect(getByText(/AI chat assistant/i)).toBeTruthy();
    expect(getByText(/AI-driven promotions/i)).toBeTruthy();
  });
});
