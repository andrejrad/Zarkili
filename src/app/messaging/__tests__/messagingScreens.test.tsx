/**
 * messagingScreens.test.tsx — W26 Batch F screen tests.
 * Covers: InboxScreen (F.1), ThreadScreen (F.2), ComposeScreen (F.3).
 */

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";

import { InboxScreen } from "../InboxScreen";
import { ThreadScreen } from "../ThreadScreen";
import { ComposeScreen } from "../ComposeScreen";
import type { ThreadSummary, ConsumerMessage } from "../messagingHelpers";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const makeThread = (overrides: Partial<ThreadSummary> = {}): ThreadSummary => ({
  id: "t1",
  salonId: "s1",
  salonName: "Glow Studio",
  lastMessage: "See you soon!",
  lastMessageAt: "2024-06-15T10:00:00.000Z",
  unreadCount: 0,
  isArchived: false,
  isMuted: false,
  isBlocked: false,
  ...overrides,
});

const makeMessage = (overrides: Partial<ConsumerMessage> = {}): ConsumerMessage => ({
  id: "m1",
  threadId: "t1",
  sender: "salon",
  text: "Hello from salon",
  sentAt: "2024-06-15T10:00:00.000Z",
  status: "read",
  ...overrides,
});

// ---------------------------------------------------------------------------
// InboxScreen
// ---------------------------------------------------------------------------

describe("InboxScreen", () => {
  function defaultInboxProps(overrides = {}) {
    return {
      threads: [makeThread()],
      activeTab: "all" as const,
      searchQuery: "",
      onTabChange: jest.fn(),
      onSearchChange: jest.fn(),
      onPressThread: jest.fn(),
      onPressCompose: jest.fn(),
      testID: "inbox",
      ...overrides,
    };
  }

  it("renders thread list with salon name", () => {
    const { getByText } = render(<InboxScreen {...defaultInboxProps()} />);
    expect(getByText("Glow Studio")).toBeTruthy();
  });

  it("renders loading state with testID", () => {
    const { getByTestId } = render(
      <InboxScreen {...defaultInboxProps({ threads: [], isLoading: true })} />,
    );
    expect(getByTestId("inbox-loading")).toBeTruthy();
  });

  it("renders empty state with testID", () => {
    const { getByTestId } = render(
      <InboxScreen {...defaultInboxProps({ threads: [] })} />,
    );
    expect(getByTestId("inbox-empty")).toBeTruthy();
  });

  it("renders error retry state with testID", () => {
    const { getByTestId } = render(
      <InboxScreen
        {...defaultInboxProps({ threads: [], isError: true, onPressRetry: jest.fn() })}
      />,
    );
    expect(getByTestId("inbox-retry")).toBeTruthy();
  });

  it("calls onPressCompose when compose button pressed", () => {
    const onPressCompose = jest.fn();
    const { getByTestId } = render(
      <InboxScreen {...defaultInboxProps({ onPressCompose })} />,
    );
    fireEvent.press(getByTestId("inbox-compose"));
    expect(onPressCompose).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// ThreadScreen
// ---------------------------------------------------------------------------

describe("ThreadScreen", () => {
  function defaultThreadProps(overrides = {}) {
    return {
      thread: makeThread(),
      messages: [makeMessage()],
      composerText: "",
      onComposerChange: jest.fn(),
      onPressSend: jest.fn(),
      onPressQuickReply: jest.fn(),
      onPressBack: jest.fn(),
      testID: "thread",
      ...overrides,
    };
  }

  it("renders message text", () => {
    const { getByText } = render(<ThreadScreen {...defaultThreadProps()} />);
    expect(getByText("Hello from salon")).toBeTruthy();
  });

  it("renders blocked banner when thread is blocked", () => {
    const { getByTestId } = render(
      <ThreadScreen
        {...defaultThreadProps({
          thread: makeThread({ isBlocked: true }),
        })}
      />,
    );
    expect(getByTestId("thread-blocked-banner")).toBeTruthy();
  });

  it("renders loading state with testID", () => {
    const { getByTestId } = render(
      <ThreadScreen
        {...defaultThreadProps({ messages: [], isLoading: true })}
      />,
    );
    expect(getByTestId("thread-loading")).toBeTruthy();
  });

  it("send button has testID", () => {
    const { getByTestId } = render(<ThreadScreen {...defaultThreadProps()} />);
    expect(getByTestId("thread-send")).toBeTruthy();
  });

  it("calls onPressBack when back button pressed", () => {
    const onPressBack = jest.fn();
    const { getByTestId } = render(
      <ThreadScreen {...defaultThreadProps({ onPressBack })} />,
    );
    fireEvent.press(getByTestId("thread-back"));
    expect(onPressBack).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// ComposeScreen
// ---------------------------------------------------------------------------

describe("ComposeScreen", () => {
  function defaultComposeProps(overrides = {}) {
    return {
      recipientName: null,
      salonSearchQuery: "",
      onSalonSearchChange: jest.fn(),
      salonResults: [],
      onSelectSalon: jest.fn(),
      onRemoveRecipient: jest.fn(),
      subject: "",
      onSubjectChange: jest.fn(),
      message: "",
      onMessageChange: jest.fn(),
      onPressSend: jest.fn(),
      onPressBack: jest.fn(),
      testID: "compose",
      ...overrides,
    };
  }

  it("renders back button with testID", () => {
    const { getByTestId } = render(<ComposeScreen {...defaultComposeProps()} />);
    expect(getByTestId("compose-back")).toBeTruthy();
  });

  it("renders salon search input when no recipient", () => {
    const { getByTestId } = render(<ComposeScreen {...defaultComposeProps()} />);
    expect(getByTestId("compose-recipient-search")).toBeTruthy();
  });

  it("renders recipient chip when recipient selected", () => {
    const { getByText } = render(
      <ComposeScreen
        {...defaultComposeProps({ recipientName: "Glow Studio" })}
      />,
    );
    expect(getByText("Glow Studio")).toBeTruthy();
  });

  it("send CTA has testID", () => {
    const { getByTestId } = render(
      <ComposeScreen
        {...defaultComposeProps({ recipientName: "Salon", message: "Hello" })}
      />,
    );
    expect(getByTestId("compose-send")).toBeTruthy();
  });

  it("calls onPressBack when back pressed", () => {
    const onPressBack = jest.fn();
    const { getByTestId } = render(
      <ComposeScreen {...defaultComposeProps({ onPressBack })} />,
    );
    fireEvent.press(getByTestId("compose-back"));
    expect(onPressBack).toHaveBeenCalledTimes(1);
  });
});
