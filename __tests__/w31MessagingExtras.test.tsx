/**
 * w31MessagingExtras.test.tsx
 *
 * W31 Batch K — K.2 Messaging Extras (20 tests)
 *
 * Covers: ThreadActionsSheet, MessageSearchScreen,
 *         ReadReceiptToggleSheet, DeliveryFailureBanner
 */

import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

import {
  DeliveryFailureBanner,
  MessageSearchScreen,
  ReadReceiptToggleSheet,
  ThreadActionsSheet,
} from "../src/app/messaging/MessagingExtrasScreen";

// ---------------------------------------------------------------------------
// ThreadActionsSheet
// ---------------------------------------------------------------------------

describe("ThreadActionsSheet", () => {
  const baseProps = {
    visible: true,
    isMuted: false,
    isArchived: false,
    onMuteToggle: jest.fn(),
    onArchiveToggle: jest.fn(),
    onBlockUser: jest.fn(),
    onReportMessage: jest.fn(),
    onDismiss: jest.fn(),
  };

  it("renders mute action", () => {
    const { getByTestId } = render(
      <ThreadActionsSheet {...baseProps} testID="tas" />
    );
    expect(getByTestId("tas-mute")).toBeTruthy();
  });

  it("renders 'Unmute conversation' when already muted", () => {
    const { getByText } = render(
      <ThreadActionsSheet {...baseProps} isMuted testID="tas" />
    );
    expect(getByText("Unmute conversation")).toBeTruthy();
  });

  it("calls onMuteToggle when mute pressed", () => {
    const onMuteToggle = jest.fn();
    const { getByTestId } = render(
      <ThreadActionsSheet {...baseProps} onMuteToggle={onMuteToggle} testID="tas" />
    );
    fireEvent.press(getByTestId("tas-mute"));
    expect(onMuteToggle).toHaveBeenCalled();
  });

  it("calls onBlockUser when block pressed", () => {
    const onBlockUser = jest.fn();
    const { getByTestId } = render(
      <ThreadActionsSheet {...baseProps} onBlockUser={onBlockUser} testID="tas" />
    );
    fireEvent.press(getByTestId("tas-block"));
    expect(onBlockUser).toHaveBeenCalled();
  });

  it("calls onReportMessage when report pressed", () => {
    const onReport = jest.fn();
    const { getByTestId } = render(
      <ThreadActionsSheet {...baseProps} onReportMessage={onReport} testID="tas" />
    );
    fireEvent.press(getByTestId("tas-report"));
    expect(onReport).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// MessageSearchScreen
// ---------------------------------------------------------------------------

describe("MessageSearchScreen", () => {
  const hits = [
    { id: "m1", message: "See you tomorrow", sender: "Ana", timestamp: "10:00" },
  ];

  it("renders search input", () => {
    const { getByTestId } = render(
      <MessageSearchScreen
        onSearch={() => []}
        onSelectHit={jest.fn()}
        onClose={jest.fn()}
        testID="mss"
      />
    );
    expect(getByTestId("mss-input")).toBeTruthy();
  });

  it("calls onClose when cancel pressed", () => {
    const onClose = jest.fn();
    const { getByTestId } = render(
      <MessageSearchScreen
        onSearch={() => []}
        onSelectHit={jest.fn()}
        onClose={onClose}
        testID="mss"
      />
    );
    fireEvent.press(getByTestId("mss-cancel"));
    expect(onClose).toHaveBeenCalled();
  });

  it("renders hits returned by onSearch", () => {
    const { getByTestId } = render(
      <MessageSearchScreen
        onSearch={() => hits}
        onSelectHit={jest.fn()}
        onClose={jest.fn()}
        testID="mss"
      />
    );
    fireEvent.changeText(getByTestId("mss-input"), "tomorrow");
    expect(getByTestId("mss-hit-m1")).toBeTruthy();
  });

  it("calls onSelectHit when a result pressed", () => {
    const onSelect = jest.fn();
    const { getByTestId } = render(
      <MessageSearchScreen
        onSearch={() => hits}
        onSelectHit={onSelect}
        onClose={jest.fn()}
        testID="mss"
      />
    );
    fireEvent.changeText(getByTestId("mss-input"), "tomorrow");
    fireEvent.press(getByTestId("mss-hit-m1"));
    expect(onSelect).toHaveBeenCalledWith("m1");
  });

  it("shows empty state for query with no results", () => {
    const { getByTestId } = render(
      <MessageSearchScreen
        onSearch={() => []}
        onSelectHit={jest.fn()}
        onClose={jest.fn()}
        testID="mss"
      />
    );
    fireEvent.changeText(getByTestId("mss-input"), "xyz abc");
    expect(getByTestId("mss-empty")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// ReadReceiptToggleSheet
// ---------------------------------------------------------------------------

describe("ReadReceiptToggleSheet", () => {
  it("renders toggle row", () => {
    const { getByTestId } = render(
      <ReadReceiptToggleSheet
        visible
        enabled
        onToggle={jest.fn()}
        onDismiss={jest.fn()}
        testID="rr"
      />
    );
    expect(getByTestId("rr-toggle")).toBeTruthy();
  });

  it("calls onToggle when switch changed", () => {
    const onToggle = jest.fn();
    const { getByTestId } = render(
      <ReadReceiptToggleSheet
        visible
        enabled
        onToggle={onToggle}
        onDismiss={jest.fn()}
        testID="rr"
      />
    );
    fireEvent(getByTestId("rr-toggle"), "valueChange", false);
    expect(onToggle).toHaveBeenCalledWith(false);
  });

  it("calls onDismiss when Done pressed", () => {
    const onDismiss = jest.fn();
    const { getByTestId } = render(
      <ReadReceiptToggleSheet
        visible
        enabled
        onToggle={jest.fn()}
        onDismiss={onDismiss}
        testID="rr"
      />
    );
    fireEvent.press(getByTestId("rr-done"));
    expect(onDismiss).toHaveBeenCalled();
  });

  it("renders nothing when not visible", () => {
    const { queryByTestId } = render(
      <ReadReceiptToggleSheet
        visible={false}
        enabled
        onToggle={jest.fn()}
        onDismiss={jest.fn()}
        testID="rr"
      />
    );
    expect(queryByTestId("rr-toggle")).toBeNull();
  });

  it("renders label text", () => {
    const { getByText } = render(
      <ReadReceiptToggleSheet
        visible
        enabled
        onToggle={jest.fn()}
        onDismiss={jest.fn()}
        testID="rr"
      />
    );
    expect(getByText("Show read receipts")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// DeliveryFailureBanner
// ---------------------------------------------------------------------------

describe("DeliveryFailureBanner", () => {
  it("renders nothing when not visible", () => {
    const { queryByTestId } = render(
      <DeliveryFailureBanner
        visible={false}
        onRetry={jest.fn()}
        onDismiss={jest.fn()}
        testID="dfb"
      />
    );
    expect(queryByTestId("dfb")).toBeNull();
  });

  it("renders when visible", () => {
    const { getByTestId } = render(
      <DeliveryFailureBanner
        visible
        onRetry={jest.fn()}
        onDismiss={jest.fn()}
        testID="dfb"
      />
    );
    expect(getByTestId("dfb")).toBeTruthy();
  });

  it("renders 'Message failed to send' copy", () => {
    const { getByText } = render(
      <DeliveryFailureBanner
        visible
        onRetry={jest.fn()}
        onDismiss={jest.fn()}
        testID="dfb"
      />
    );
    expect(getByText("Message failed to send.")).toBeTruthy();
  });

  it("renders retry CTA", () => {
    const { getByText } = render(
      <DeliveryFailureBanner
        visible
        onRetry={jest.fn()}
        onDismiss={jest.fn()}
        testID="dfb"
      />
    );
    expect(getByText("Retry")).toBeTruthy();
  });

  it("calls onRetry when Retry pressed", () => {
    const onRetry = jest.fn();
    const { getByText } = render(
      <DeliveryFailureBanner
        visible
        onRetry={onRetry}
        onDismiss={jest.fn()}
        testID="dfb"
      />
    );
    fireEvent.press(getByText("Retry"));
    expect(onRetry).toHaveBeenCalled();
  });
});
