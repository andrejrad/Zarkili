/**
 * AdminMessagingScreens.test.tsx
 *
 * Smoke tests for the admin messaging UI. Focus:
 *   - customer list renders, search, bulk selection
 *   - thread panel empty state + message rendering
 *   - send button enabled/disabled
 *   - bulk modal open / confirm / cancel flow
 *   - error states surfaced
 */

import React from "react";
import { render, fireEvent, screen } from "@testing-library/react-native";

import {
  AdminMessagingScreen,
  AdminMessagingScreenProps,
} from "../AdminMessagingScreens";
import type { CustomerSummary } from "../adminMessagingService";
import type { Message } from "../../../domains/messages/model";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ts(seconds: number) {
  return { seconds, nanoseconds: 0 } as any;
}

const CUSTOMERS: CustomerSummary[] = [
  {
    userId: "u1",
    displayName: "Alice Smith",
    subscriptionStatus: "active",
    locationIds: ["l1"],
  },
  {
    userId: "u2",
    displayName: "Bob Jones",
    subscriptionStatus: "trialing",
    locationIds: ["l1"],
  },
];

const MESSAGES: Message[] = [
  {
    messageId: "msg1",
    tenantId: "t1",
    threadId: "t1_staff1_u1",
    senderType: "staff",
    senderId: "staff1",
    receiverId: "u1",
    text: "Hello Alice",
    attachments: [],
    read: false,
    createdAt: ts(1000),
    updatedAt: ts(1000),
  },
  {
    messageId: "msg2",
    tenantId: "t1",
    threadId: "t1_staff1_u1",
    senderType: "customer",
    senderId: "u1",
    receiverId: "staff1",
    text: "Hi there",
    attachments: [],
    read: true,
    createdAt: ts(1001),
    updatedAt: ts(1001),
  },
];

function buildProps(overrides: Partial<AdminMessagingScreenProps> = {}): AdminMessagingScreenProps {
  return {
    customers: CUSTOMERS,
    isLoadingCustomers: false,
    customerSearchQuery: "",
    onCustomerSearchChange: jest.fn(),
    subscriptionStatusFilter: "all",
    onSubscriptionStatusFilterChange: jest.fn(),
    selectedCustomerId: null,
    onSelectCustomer: jest.fn(),
    threadMessages: [],
    isLoadingThread: false,
    threadError: null,
    staffId: "staff1",
    composerText: "",
    onComposerTextChange: jest.fn(),
    pendingAttachments: [],
    onAddAttachment: jest.fn(),
    onRemoveAttachment: jest.fn(),
    attachmentError: null,
    isSending: false,
    sendError: null,
    onSend: jest.fn(),
    bulkSelectedIds: [],
    onToggleBulkSelect: jest.fn(),
    onClearBulkSelection: jest.fn(),
    onOpenBulkModal: jest.fn(),
    bulkModalVisible: false,
    bulkMessageText: "",
    onBulkMessageTextChange: jest.fn(),
    isBulkSending: false,
    bulkSendError: null,
    onConfirmBulkSend: jest.fn(),
    onDismissBulkModal: jest.fn(),
    bulkSendResult: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Customer list
// ---------------------------------------------------------------------------

describe("AdminMessagingScreen — customer list", () => {
  it("renders customer names", () => {
    render(<AdminMessagingScreen {...buildProps()} />);
    expect(screen.getByText("Alice Smith")).toBeTruthy();
    expect(screen.getByText("Bob Jones")).toBeTruthy();
  });

  it("shows subscription status under each customer", () => {
    render(<AdminMessagingScreen {...buildProps()} />);
    expect(screen.getByText("active")).toBeTruthy();
    expect(screen.getByText("trialing")).toBeTruthy();
  });

  it("shows loading indicator while loading customers", () => {
    render(<AdminMessagingScreen {...buildProps({ isLoadingCustomers: true })} />);
    expect(screen.getByTestId("customers-loading")).toBeTruthy();
  });

  it("shows empty state when customers list is empty", () => {
    render(<AdminMessagingScreen {...buildProps({ customers: [] })} />);
    expect(screen.getByTestId("customers-empty")).toBeTruthy();
  });

  it("calls onCustomerSearchChange when search input changes", () => {
    const onCustomerSearchChange = jest.fn();
    render(<AdminMessagingScreen {...buildProps({ onCustomerSearchChange })} />);
    fireEvent.changeText(screen.getByTestId("customer-search-input"), "ali");
    expect(onCustomerSearchChange).toHaveBeenCalledWith("ali");
  });

  it("calls onSelectCustomer when a customer row is pressed", () => {
    const onSelectCustomer = jest.fn();
    render(<AdminMessagingScreen {...buildProps({ onSelectCustomer })} />);
    fireEvent.press(screen.getByTestId("customer-item-u1"));
    expect(onSelectCustomer).toHaveBeenCalledWith("u1");
  });

  it("calls onSubscriptionStatusFilterChange when a filter tab is pressed", () => {
    const fn = jest.fn();
    render(<AdminMessagingScreen {...buildProps({ onSubscriptionStatusFilterChange: fn })} />);
    fireEvent.press(screen.getByTestId("filter-tab-trialing"));
    expect(fn).toHaveBeenCalledWith("trialing");
  });
});

// ---------------------------------------------------------------------------
// Bulk selection
// ---------------------------------------------------------------------------

describe("AdminMessagingScreen — bulk selection", () => {
  it("calls onToggleBulkSelect when a checkbox is pressed", () => {
    const onToggleBulkSelect = jest.fn();
    render(<AdminMessagingScreen {...buildProps({ onToggleBulkSelect })} />);
    fireEvent.press(screen.getByTestId("bulk-checkbox-u1"));
    expect(onToggleBulkSelect).toHaveBeenCalledWith("u1");
  });

  it("bulk button is disabled when no customers selected", () => {
    render(<AdminMessagingScreen {...buildProps({ bulkSelectedIds: [] })} />);
    const btn = screen.getByTestId("open-bulk-modal-button");
    // disabled prop makes opacity 0.5 — we can check the prop
    expect(btn.props.accessibilityState?.disabled ?? btn.props.disabled).toBeTruthy();
  });

  it("bulk button shows count when customers are selected", () => {
    render(<AdminMessagingScreen {...buildProps({ bulkSelectedIds: ["u1", "u2"] })} />);
    expect(screen.getByText("Bulk (2)")).toBeTruthy();
  });

  it("calls onOpenBulkModal when bulk button is pressed (with selection)", () => {
    const onOpenBulkModal = jest.fn();
    render(
      <AdminMessagingScreen
        {...buildProps({ bulkSelectedIds: ["u1"], onOpenBulkModal })}
      />
    );
    fireEvent.press(screen.getByTestId("open-bulk-modal-button"));
    expect(onOpenBulkModal).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Thread panel
// ---------------------------------------------------------------------------

describe("AdminMessagingScreen — thread panel", () => {
  it("shows empty state when no customer selected", () => {
    render(<AdminMessagingScreen {...buildProps()} />);
    expect(screen.getByTestId("thread-empty-state")).toBeTruthy();
  });

  it("shows loading indicator while loading thread", () => {
    render(
      <AdminMessagingScreen
        {...buildProps({ selectedCustomerId: "u1", isLoadingThread: true })}
      />
    );
    expect(screen.getByTestId("thread-loading")).toBeTruthy();
  });

  it("shows thread error when set", () => {
    render(
      <AdminMessagingScreen
        {...buildProps({ selectedCustomerId: "u1", threadError: "Load failed" })}
      />
    );
    expect(screen.getByTestId("thread-error")).toBeTruthy();
    expect(screen.getByText("Load failed")).toBeTruthy();
  });

  it("shows no-messages state when thread is empty", () => {
    render(
      <AdminMessagingScreen
        {...buildProps({ selectedCustomerId: "u1", threadMessages: [] })}
      />
    );
    expect(screen.getByTestId("thread-no-messages")).toBeTruthy();
  });

  it("renders message bubbles for each message", () => {
    render(
      <AdminMessagingScreen
        {...buildProps({ selectedCustomerId: "u1", threadMessages: MESSAGES })}
      />
    );
    expect(screen.getByTestId("message-bubble-msg1")).toBeTruthy();
    expect(screen.getByTestId("message-bubble-msg2")).toBeTruthy();
    expect(screen.getByText("Hello Alice")).toBeTruthy();
    expect(screen.getByText("Hi there")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Composer
// ---------------------------------------------------------------------------

describe("AdminMessagingScreen — composer", () => {
  it("send button is disabled when composer is empty", () => {
    render(
      <AdminMessagingScreen
        {...buildProps({ selectedCustomerId: "u1", composerText: "" })}
      />
    );
    const btn = screen.getByTestId("send-button");
    expect(btn.props.accessibilityState?.disabled ?? btn.props.disabled).toBeTruthy();
  });

  it("send button is enabled when composer has text", () => {
    render(
      <AdminMessagingScreen
        {...buildProps({
          selectedCustomerId: "u1",
          composerText: "Hello!",
        })}
      />
    );
    const btn = screen.getByTestId("send-button");
    expect(btn.props.accessibilityState?.disabled ?? btn.props.disabled).toBeFalsy();
  });

  it("calls onSend when send button is pressed", () => {
    const onSend = jest.fn();
    render(
      <AdminMessagingScreen
        {...buildProps({
          selectedCustomerId: "u1",
          composerText: "Hello!",
          onSend,
        })}
      />
    );
    fireEvent.press(screen.getByTestId("send-button"));
    expect(onSend).toHaveBeenCalled();
  });

  it("calls onComposerTextChange when text changes", () => {
    const onComposerTextChange = jest.fn();
    render(
      <AdminMessagingScreen
        {...buildProps({ selectedCustomerId: "u1", onComposerTextChange })}
      />
    );
    fireEvent.changeText(screen.getByTestId("composer-input"), "Hello!");
    expect(onComposerTextChange).toHaveBeenCalledWith("Hello!");
  });

  it("calls onAddAttachment when attachment button pressed", () => {
    const onAddAttachment = jest.fn();
    render(
      <AdminMessagingScreen {...buildProps({ selectedCustomerId: "u1", onAddAttachment })} />
    );
    fireEvent.press(screen.getByTestId("add-attachment-button"));
    expect(onAddAttachment).toHaveBeenCalled();
  });

  it("shows send error when set", () => {
    render(
      <AdminMessagingScreen
        {...buildProps({
          selectedCustomerId: "u1",
          composerText: "x",
          sendError: "Send failed",
        })}
      />
    );
    expect(screen.getByTestId("send-error")).toBeTruthy();
    expect(screen.getByText("Send failed")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Bulk modal
// ---------------------------------------------------------------------------

describe("AdminMessagingScreen — bulk modal", () => {
  it("renders the bulk modal when visible", () => {
    render(
      <AdminMessagingScreen
        {...buildProps({
          bulkModalVisible: true,
          bulkSelectedIds: ["u1", "u2"],
        })}
      />
    );
    expect(screen.getByTestId("bulk-modal-sheet")).toBeTruthy();
    expect(screen.getByTestId("bulk-recipient-count")).toBeTruthy();
    expect(screen.getByText("Sending to 2 customers")).toBeTruthy();
  });

  it("confirm button is disabled when no text", () => {
    render(
      <AdminMessagingScreen
        {...buildProps({
          bulkModalVisible: true,
          bulkSelectedIds: ["u1"],
          bulkMessageText: "",
        })}
      />
    );
    const btn = screen.getByTestId("bulk-confirm-button");
    expect(btn.props.accessibilityState?.disabled ?? btn.props.disabled).toBeTruthy();
  });

  it("confirm button is enabled when text and recipients present", () => {
    render(
      <AdminMessagingScreen
        {...buildProps({
          bulkModalVisible: true,
          bulkSelectedIds: ["u1"],
          bulkMessageText: "Hey everyone!",
        })}
      />
    );
    const btn = screen.getByTestId("bulk-confirm-button");
    expect(btn.props.accessibilityState?.disabled ?? btn.props.disabled).toBeFalsy();
  });

  it("calls onConfirmBulkSend when confirm pressed", () => {
    const onConfirmBulkSend = jest.fn();
    render(
      <AdminMessagingScreen
        {...buildProps({
          bulkModalVisible: true,
          bulkSelectedIds: ["u1"],
          bulkMessageText: "Hi!",
          onConfirmBulkSend,
        })}
      />
    );
    fireEvent.press(screen.getByTestId("bulk-confirm-button"));
    expect(onConfirmBulkSend).toHaveBeenCalled();
  });

  it("calls onDismissBulkModal when cancel pressed", () => {
    const onDismissBulkModal = jest.fn();
    render(
      <AdminMessagingScreen
        {...buildProps({
          bulkModalVisible: true,
          bulkSelectedIds: ["u1"],
          onDismissBulkModal,
        })}
      />
    );
    fireEvent.press(screen.getByTestId("bulk-cancel-button"));
    expect(onDismissBulkModal).toHaveBeenCalled();
  });

  it("shows bulk send error when set", () => {
    render(
      <AdminMessagingScreen
        {...buildProps({
          bulkModalVisible: true,
          bulkSelectedIds: ["u1"],
          bulkSendError: "Bulk send failed",
        })}
      />
    );
    expect(screen.getByTestId("bulk-send-error")).toBeTruthy();
    expect(screen.getByText("Bulk send failed")).toBeTruthy();
  });

  it("shows bulk result banner after send", () => {
    render(
      <AdminMessagingScreen
        {...buildProps({ bulkSendResult: { sentCount: 3, failedCount: 1 } })}
      />
    );
    expect(screen.getByTestId("bulk-result-banner")).toBeTruthy();
    expect(screen.getByText("Sent: 3 · Failed: 1")).toBeTruthy();
  });
});
