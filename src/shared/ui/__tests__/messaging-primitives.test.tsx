/**
 * messaging-primitives.test.tsx
 * Tests for W26 Batch F shared-UI primitives:
 *   ChatBubble, AttachmentTile, QuickReplyChip, NotificationRow, PreferenceToggleRow
 */

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";

import {
  AttachmentTile,
  ChatBubble,
  NotificationRow,
  PreferenceToggleRow,
  QuickReplyChip,
} from "../index";

/* ─────────────────────── ChatBubble ─────────────────────── */
describe("ChatBubble", () => {
  it("renders message text for incoming bubble", () => {
    const { getByText } = render(
      <ChatBubble
        direction="incoming"
        message="Hello there"
        formattedTime="9:00 AM"
        testID="cb"
      />,
    );
    expect(getByText("Hello there")).toBeTruthy();
  });

  it("renders message text for outgoing bubble", () => {
    const { getByText } = render(
      <ChatBubble
        direction="outgoing"
        message="Hi back"
        formattedTime="9:01 AM"
        testID="cb"
      />,
    );
    expect(getByText("Hi back")).toBeTruthy();
  });

  it("renders status glyph testID for outgoing with status", () => {
    const { getByTestId } = render(
      <ChatBubble
        direction="outgoing"
        message="Delivered"
        formattedTime="9:02 AM"
        status="delivered"
        testID="cb"
      />,
    );
    expect(getByTestId("cb-status")).toBeTruthy();
  });

  it("renders formattedTime", () => {
    const { getByText } = render(
      <ChatBubble
        direction="incoming"
        message="Hey"
        formattedTime="3:45 PM"
        testID="cb"
      />,
    );
    expect(getByText("3:45 PM")).toBeTruthy();
  });
});

/* ─────────────────────── AttachmentTile ─────────────────────── */
describe("AttachmentTile", () => {
  it("renders image tile with testID-image", () => {
    const { getByTestId } = render(
      <AttachmentTile
        type="image"
        uri="https://example.com/photo.jpg"
        testID="at"
      />,
    );
    expect(getByTestId("at-image")).toBeTruthy();
  });

  it("renders file tile with filename", () => {
    const { getByText } = render(
      <AttachmentTile
        type="file"
        filename="invoice.pdf"
        fileSize="42 KB"
        testID="at"
      />,
    );
    expect(getByText("invoice.pdf")).toBeTruthy();
  });

  it("renders download button for file tile", () => {
    const onDownload = jest.fn();
    const { getByTestId } = render(
      <AttachmentTile
        type="file"
        filename="doc.pdf"
        onDownload={onDownload}
        testID="at"
      />,
    );
    fireEvent.press(getByTestId("at-download"));
    expect(onDownload).toHaveBeenCalledTimes(1);
  });
});

/* ─────────────────────── QuickReplyChip ─────────────────────── */
describe("QuickReplyChip", () => {
  it("renders label text", () => {
    const { getByText } = render(
      <QuickReplyChip label="Sounds good" onPress={() => {}} testID="qr" />,
    );
    expect(getByText("Sounds good")).toBeTruthy();
  });

  it("calls onPress when tapped", () => {
    const onPress = jest.fn();
    const { getByRole } = render(
      <QuickReplyChip label="Yes please" onPress={onPress} testID="qr" />,
    );
    fireEvent.press(getByRole("button"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

/* ─────────────────────── NotificationRow ─────────────────────── */
describe("NotificationRow", () => {
  it("renders title text", () => {
    const { getByText } = render(
      <NotificationRow
        title="Booking confirmed"
        formattedTime="2:00 PM"
        testID="nr"
      />,
    );
    expect(getByText("Booking confirmed")).toBeTruthy();
  });

  it("renders unread dot when isUnread is true", () => {
    const { getByTestId } = render(
      <NotificationRow
        title="New message"
        formattedTime="1:00 PM"
        isUnread
        testID="nr"
      />,
    );
    expect(getByTestId("nr-unread-dot")).toBeTruthy();
  });

  it("does not render unread dot when isUnread is false", () => {
    const { queryByTestId } = render(
      <NotificationRow
        title="Old message"
        formattedTime="1:00 PM"
        isUnread={false}
        testID="nr"
      />,
    );
    expect(queryByTestId("nr-unread-dot")).toBeNull();
  });

  it("calls onPress when tapped", () => {
    const onPress = jest.fn();
    const { getByRole } = render(
      <NotificationRow
        title="Tap me"
        formattedTime="12:00 PM"
        onPress={onPress}
        testID="nr"
      />,
    );
    fireEvent.press(getByRole("button"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("calls onDismiss when dismiss button pressed", () => {
    const onDismiss = jest.fn();
    const { getByTestId } = render(
      <NotificationRow
        title="Dismissible"
        formattedTime="11:00 AM"
        onDismiss={onDismiss}
        testID="nr"
      />,
    );
    fireEvent.press(getByTestId("nr-dismiss"));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});

/* ─────────────────────── PreferenceToggleRow ─────────────────────── */
describe("PreferenceToggleRow", () => {
  it("renders label text", () => {
    const { getByText } = render(
      <PreferenceToggleRow
        label="Push notifications"
        value={false}
        onValueChange={() => {}}
        testID="ptr"
      />,
    );
    expect(getByText("Push notifications")).toBeTruthy();
  });

  it("renders helper text when provided", () => {
    const { getByText } = render(
      <PreferenceToggleRow
        label="SMS"
        helperText="Requires prior consent."
        value={false}
        onValueChange={() => {}}
        testID="ptr"
      />,
    );
    expect(getByText("Requires prior consent.")).toBeTruthy();
  });

  it("calls onValueChange when toggle switched", () => {
    const onValueChange = jest.fn();
    const { getByTestId } = render(
      <PreferenceToggleRow
        label="Email"
        value={false}
        onValueChange={onValueChange}
        testID="ptr"
      />,
    );
    fireEvent(getByTestId("ptr-toggle"), "valueChange", true);
    expect(onValueChange).toHaveBeenCalledWith(true);
  });

  it("reflects disabled state on toggle", () => {
    const { getByTestId } = render(
      <PreferenceToggleRow
        label="Disabled toggle"
        value={false}
        onValueChange={() => {}}
        disabled
        testID="ptr"
      />,
    );
    expect(getByTestId("ptr-toggle").props.disabled).toBe(true);
  });
});
