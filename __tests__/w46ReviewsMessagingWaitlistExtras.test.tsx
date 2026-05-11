/**
 * w46ReviewsMessagingWaitlistExtras.test.tsx
 *
 * W46 â€” Review Admin, Messaging Admin, Waitlist Admin screens (65 tests)
 *
 * Covers: ReviewQueueScreen, ReviewReplyScreen, ReviewFlagScreen,
 *         ReviewAutomationScreen, ReputationDashboardScreen,
 *         InboxTriageScreen, ThreadAssignScreen, CannedRepliesScreen,
 *         AutoReplyConfigScreen, MessageArchiveScreen,
 *         WaitlistAdminListScreen, WaitlistConvertScreen, WaitlistPoliciesScreen
 */

import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

import { ReviewQueueScreen } from "../src/app/admin/ReviewQueueScreen";
import { ReviewReplyScreen } from "../src/app/admin/ReviewReplyScreen";
import { ReviewFlagScreen, type ReviewFlagAction } from "../src/app/admin/ReviewFlagScreen";
import { ReviewAutomationScreen } from "../src/app/admin/ReviewAutomationScreen";
import { ReputationDashboardScreen } from "../src/app/admin/ReputationDashboardScreen";
import { InboxTriageScreen } from "../src/app/admin/InboxTriageScreen";
import { ThreadAssignScreen } from "../src/app/admin/ThreadAssignScreen";
import { CannedRepliesScreen } from "../src/app/admin/CannedRepliesScreen";
import { AutoReplyConfigScreen } from "../src/app/admin/AutoReplyConfigScreen";
import { MessageArchiveScreen } from "../src/app/admin/MessageArchiveScreen";
import { WaitlistAdminListScreen } from "../src/app/admin/WaitlistAdminListScreen";
import { WaitlistConvertScreen } from "../src/app/admin/WaitlistConvertScreen";
import { WaitlistPoliciesScreen } from "../src/app/admin/WaitlistPoliciesScreen";

import type { ReviewEntry, ReviewAutomationRuleInput } from "../src/domains/reviews/reviewAdminModel";
import type { AdminThread, CannedReplyInput, AutoReplyConfig, MessageArchiveFilter } from "../src/domains/messaging/messagingAdminModel";
import type { WaitlistAdminEntry, WaitlistPolicy } from "../src/domains/waitlist/waitlistAdminModel";

// ---------------------------------------------------------------------------
// Shared default stubs
// ---------------------------------------------------------------------------

const noop = jest.fn();

const DEFAULT_AUTO_REPLY_FORM: AutoReplyConfig = {
  tenantId: "t1",
  enabled: false,
  outsideHoursMessage: "",
  useCustomMessage: false,
  openHour: 8,
  closeHour: 18,
  enabledDays: [],
  updatedAt: "",
};

const DEFAULT_WAITLIST_POLICY: WaitlistPolicy = {
  tenantId: "t1",
  maxWaitDays: 7,
  autoCancelAfterDays: 14,
  notifyOnOpenSlot: true,
  notifyLeadHours: 2,
  requireConfirmation: false,
  allowMultipleEntries: false,
  maxEntriesPerClient: 1,
  updatedAt: "",
};

const DEFAULT_AUTOMATION_FORM: ReviewAutomationRuleInput = {
  tenantId: "t1",
  label: "",
  triggerRating: 3,
  triggerRatingOp: "gte",
  replyTemplate: "",
  active: true,
};

const DEFAULT_CANNED_FORM: CannedReplyInput = {
  tenantId: "t1",
  title: "",
  body: "",
  tags: [],
  createdBy: "u1",
};

// ---------------------------------------------------------------------------
// ReviewQueueScreen (5 tests)
// ---------------------------------------------------------------------------

describe("ReviewQueueScreen", () => {
  function props(overrides = {}) {
    return {
      loading: false,
      error: null,
      reviews: [] as ReviewEntry[],
      filter: "all" as const,
      selectedIds: [],
      onFilterChange: noop,
      onOpenReview: noop,
      onToggleSelect: noop,
      onBulkHide: noop,
      onBulkFlag: noop,
      onRetry: noop,
      onBack: noop,
      ...overrides,
    };
  }

  it("renders screen testID", () => {
    const { getByTestId } = render(<ReviewQueueScreen {...props()} />);
    expect(getByTestId("review-queue-screen")).toBeTruthy();
  });

  it("shows loading indicator when loading=true", () => {
    const { getByText } = render(<ReviewQueueScreen {...props({ loading: true })} />);
    expect(getByText(/loading/i)).toBeTruthy();
  });

  it("shows error state when error is set", () => {
    const { getByText } = render(
      <ReviewQueueScreen {...props({ error: "Network error" })} />,
    );
    expect(getByText("Something went wrong")).toBeTruthy();
  });

  it("shows empty state when reviews list is empty", () => {
    const { getByText } = render(<ReviewQueueScreen {...props({ reviews: [] })} />);
    expect(getByText("No Reviews")).toBeTruthy();
  });

  it("calls onFilterChange when filter chip is pressed", () => {
    const onFilterChange = jest.fn();
    const { getByTestId } = render(<ReviewQueueScreen {...props({ onFilterChange })} />);
    fireEvent.press(getByTestId("filter-pending"));
    expect(onFilterChange).toHaveBeenCalledWith("pending");
  });
});

// ---------------------------------------------------------------------------
// ReviewReplyScreen (5 tests)
// ---------------------------------------------------------------------------

describe("ReviewReplyScreen", () => {
  function props(overrides = {}) {
    return {
      loading: false,
      error: null,
      review: null as ReviewEntry | null,
      replyText: "",
      submitting: false,
      submitError: null,
      submitSuccess: false,
      templates: [],
      onReplyTextChange: noop,
      onApplyTemplate: noop,
      onSubmit: noop,
      onRetry: noop,
      onBack: noop,
      ...overrides,
    };
  }

  it("renders screen testID", () => {
    const { getByTestId } = render(<ReviewReplyScreen {...props()} />);
    expect(getByTestId("review-reply-screen")).toBeTruthy();
  });

  it("shows loading state", () => {
    const { getByText } = render(<ReviewReplyScreen {...props({ loading: true })} />);
    expect(getByText(/loading/i)).toBeTruthy();
  });

  it("shows error state", () => {
    const { getByText } = render(<ReviewReplyScreen {...props({ error: "err" })} />);
    expect(getByText("Something went wrong")).toBeTruthy();
  });

  it("calls onSubmit on submit press", () => {
    const onSubmit = jest.fn();
    const { getByTestId } = render(<ReviewReplyScreen {...props({ onSubmit, replyText: "great service" })} />);
    fireEvent.press(getByTestId("submit-reply-btn"));
    expect(onSubmit).toHaveBeenCalled();
  });

  it("calls onBack when back is pressed", () => {
    const onBack = jest.fn();
    const { getByText } = render(<ReviewReplyScreen {...props({ onBack })} />);
    fireEvent.press(getByText(/Back/));
    expect(onBack).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// ReviewFlagScreen (5 tests)
// ---------------------------------------------------------------------------

describe("ReviewFlagScreen", () => {
  function props(overrides = {}) {
    return {
      loading: false,
      error: null,
      review: null as ReviewEntry | null,
      action: "flag" as ReviewFlagAction,
      reason: "",
      submitting: false,
      submitError: null,
      submitSuccess: false,
      onActionChange: noop,
      onReasonChange: noop,
      onSubmit: noop,
      onRetry: noop,
      onBack: noop,
      ...overrides,
    };
  }

  it("renders screen testID", () => {
    const { getByTestId } = render(<ReviewFlagScreen {...props()} />);
    expect(getByTestId("review-flag-screen")).toBeTruthy();
  });

  it("shows loading state", () => {
    const { getByText } = render(<ReviewFlagScreen {...props({ loading: true })} />);
    expect(getByText(/loading/i)).toBeTruthy();
  });

  it("shows action chips for flag, dispute and hide", () => {
    const { getByTestId } = render(<ReviewFlagScreen {...props()} />);
    expect(getByTestId("action-flag")).toBeTruthy();
    expect(getByTestId("action-dispute")).toBeTruthy();
    expect(getByTestId("action-hide")).toBeTruthy();
  });

  it("calls onActionChange when action chip is pressed", () => {
    const onActionChange = jest.fn();
    const { getByTestId } = render(<ReviewFlagScreen {...props({ onActionChange })} />);
    fireEvent.press(getByTestId("action-dispute"));
    expect(onActionChange).toHaveBeenCalledWith("dispute");
  });

  it("calls onSubmit when confirm pressed", () => {
    const onSubmit = jest.fn();
    const { getByTestId } = render(<ReviewFlagScreen {...props({ onSubmit, reason: "spam" })} />);
    fireEvent.press(getByTestId("submit-flag-btn"));
    expect(onSubmit).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// ReviewAutomationScreen (5 tests)
// ---------------------------------------------------------------------------

describe("ReviewAutomationScreen", () => {
  function props(overrides = {}) {
    return {
      loading: false,
      error: null,
      rules: [],
      showCreateForm: false,
      form: DEFAULT_AUTOMATION_FORM,
      saving: false,
      saveError: null,
      onFormChange: noop,
      onToggleForm: noop,
      onSaveRule: noop,
      onToggleActive: noop,
      onDeleteRule: noop,
      onRetry: noop,
      onBack: noop,
      ...overrides,
    };
  }

  it("renders screen testID", () => {
    const { getByTestId } = render(<ReviewAutomationScreen {...props()} />);
    expect(getByTestId("review-automation-screen")).toBeTruthy();
  });

  it("shows loading state", () => {
    const { getByText } = render(<ReviewAutomationScreen {...props({ loading: true })} />);
    expect(getByText(/loading/i)).toBeTruthy();
  });

  it("shows empty state when no rules", () => {
    const { getByText } = render(<ReviewAutomationScreen {...props()} />);
    expect(getByText("No Rules")).toBeTruthy();
  });

  it("calls onToggleForm when add button pressed", () => {
    const onToggleForm = jest.fn();
    const { getByTestId } = render(<ReviewAutomationScreen {...props({ onToggleForm })} />);
    fireEvent.press(getByTestId("toggle-create-btn"));
    expect(onToggleForm).toHaveBeenCalled();
  });

  it("calls onBack when back is pressed", () => {
    const onBack = jest.fn();
    const { getByText } = render(<ReviewAutomationScreen {...props({ onBack })} />);
    fireEvent.press(getByText(/Back/));
    expect(onBack).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// ReputationDashboardScreen (4 tests)
// ---------------------------------------------------------------------------

describe("ReputationDashboardScreen", () => {
  function props(overrides = {}) {
    return {
      loading: false,
      error: null,
      stats: null,
      onRetry: noop,
      onBack: noop,
      ...overrides,
    };
  }

  it("renders screen testID", () => {
    const { getByTestId } = render(<ReputationDashboardScreen {...props()} />);
    expect(getByTestId("reputation-dashboard-screen")).toBeTruthy();
  });

  it("shows loading state", () => {
    const { getByText } = render(<ReputationDashboardScreen {...props({ loading: true })} />);
    expect(getByText(/loading/i)).toBeTruthy();
  });

  it("shows error state", () => {
    const { getByText } = render(
      <ReputationDashboardScreen {...props({ error: "err" })} />,
    );
    expect(getByText("Something went wrong")).toBeTruthy();
  });

  it("calls onBack", () => {
    const onBack = jest.fn();
    const { getByText } = render(<ReputationDashboardScreen {...props({ onBack })} />);
    fireEvent.press(getByText(/Back/));
    expect(onBack).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// InboxTriageScreen (5 tests)
// ---------------------------------------------------------------------------

describe("InboxTriageScreen", () => {
  function props(overrides = {}) {
    return {
      loading: false,
      error: null,
      threads: [] as AdminThread[],
      statusFilter: "all" as const,
      onStatusFilter: noop,
      onOpenThread: noop,
      onAssignThread: noop,
      onResolveThread: noop,
      onArchiveThread: noop,
      onRetry: noop,
      onBack: noop,
      ...overrides,
    };
  }

  it("renders screen testID", () => {
    const { getByTestId } = render(<InboxTriageScreen {...props()} />);
    expect(getByTestId("inbox-triage-screen")).toBeTruthy();
  });

  it("shows loading state", () => {
    const { getByText } = render(<InboxTriageScreen {...props({ loading: true })} />);
    expect(getByText(/loading/i)).toBeTruthy();
  });

  it("shows error state with retry", () => {
    const onRetry = jest.fn();
    const { getByText } = render(
      <InboxTriageScreen {...props({ error: "err", onRetry })} />,
    );
    fireEvent.press(getByText("Retry"));
    expect(onRetry).toHaveBeenCalled();
  });

  it("shows empty state when threads is empty", () => {
    const { getByText } = render(<InboxTriageScreen {...props()} />);
    expect(getByText("No Threads")).toBeTruthy();
  });

  it("calls onStatusFilter when filter chip pressed", () => {
    const onStatusFilter = jest.fn();
    const { getByTestId } = render(<InboxTriageScreen {...props({ onStatusFilter })} />);
    fireEvent.press(getByTestId("filter-open"));
    expect(onStatusFilter).toHaveBeenCalledWith("open");
  });
});

// ---------------------------------------------------------------------------
// ThreadAssignScreen (5 tests)
// ---------------------------------------------------------------------------

describe("ThreadAssignScreen", () => {
  function props(overrides = {}) {
    return {
      loading: false,
      error: null,
      thread: null as AdminThread | null,
      staffOptions: [],
      selectedStaffId: null,
      onSelectStaff: noop,
      onSubmit: noop,
      submitting: false,
      submitError: null,
      submitSuccess: false,
      onRetry: noop,
      onBack: noop,
      ...overrides,
    };
  }

  it("renders screen testID", () => {
    const { getByTestId } = render(<ThreadAssignScreen {...props()} />);
    expect(getByTestId("thread-assign-screen")).toBeTruthy();
  });

  it("shows loading state", () => {
    const { getByText } = render(<ThreadAssignScreen {...props({ loading: true })} />);
    expect(getByText(/loading/i)).toBeTruthy();
  });

  it("shows error state", () => {
    const { getByText } = render(<ThreadAssignScreen {...props({ error: "err" })} />);
    expect(getByText("Something went wrong")).toBeTruthy();
  });

  it("calls onSubmit when assign pressed", () => {
    const onSubmit = jest.fn();
    const { getByTestId } = render(<ThreadAssignScreen {...props({ onSubmit, selectedStaffId: "s1" })} />);
    fireEvent.press(getByTestId("assign-btn"));
    expect(onSubmit).toHaveBeenCalled();
  });

  it("calls onBack", () => {
    const onBack = jest.fn();
    const { getByText } = render(<ThreadAssignScreen {...props({ onBack })} />);
    fireEvent.press(getByText(/Back/));
    expect(onBack).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// CannedRepliesScreen (5 tests)
// ---------------------------------------------------------------------------

describe("CannedRepliesScreen", () => {
  function props(overrides = {}) {
    return {
      loading: false,
      error: null,
      replies: [],
      showCreateForm: false,
      form: DEFAULT_CANNED_FORM,
      saving: false,
      saveError: null,
      onToggleForm: noop,
      onFormChange: noop,
      onSaveReply: noop,
      onDeleteReply: noop,
      onRetry: noop,
      onBack: noop,
      ...overrides,
    };
  }

  it("renders screen testID", () => {
    const { getByTestId } = render(<CannedRepliesScreen {...props()} />);
    expect(getByTestId("canned-replies-screen")).toBeTruthy();
  });

  it("shows loading state", () => {
    const { getByText } = render(<CannedRepliesScreen {...props({ loading: true })} />);
    expect(getByText(/loading/i)).toBeTruthy();
  });

  it("shows empty state when no replies", () => {
    const { getByText } = render(<CannedRepliesScreen {...props()} />);
    expect(getByText("No Replies")).toBeTruthy();
  });

  it("calls onToggleForm when add button pressed", () => {
    const onToggleForm = jest.fn();
    const { getByTestId } = render(<CannedRepliesScreen {...props({ onToggleForm })} />);
    fireEvent.press(getByTestId("toggle-form-btn"));
    expect(onToggleForm).toHaveBeenCalled();
  });

  it("calls onBack", () => {
    const onBack = jest.fn();
    const { getByText } = render(<CannedRepliesScreen {...props({ onBack })} />);
    fireEvent.press(getByText(/Back/));
    expect(onBack).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// AutoReplyConfigScreen (5 tests)
// ---------------------------------------------------------------------------

describe("AutoReplyConfigScreen", () => {
  function props(overrides = {}) {
    return {
      loading: false,
      error: null,
      config: null as AutoReplyConfig | null,
      form: DEFAULT_AUTO_REPLY_FORM,
      saving: false,
      saveError: null,
      saveSuccess: false,
      onFormChange: noop,
      onSave: noop,
      onRetry: noop,
      onBack: noop,
      ...overrides,
    };
  }

  it("renders screen testID", () => {
    const { getByTestId } = render(<AutoReplyConfigScreen {...props()} />);
    expect(getByTestId("auto-reply-config-screen")).toBeTruthy();
  });

  it("shows loading state", () => {
    const { getByText } = render(<AutoReplyConfigScreen {...props({ loading: true })} />);
    expect(getByText(/loading/i)).toBeTruthy();
  });

  it("shows error state", () => {
    const { getByText } = render(<AutoReplyConfigScreen {...props({ error: "err" })} />);
    expect(getByText("Something went wrong")).toBeTruthy();
  });

  it("calls onSave when save pressed", () => {
    const onSave = jest.fn();
    const { getByTestId } = render(<AutoReplyConfigScreen {...props({ onSave })} />);
    fireEvent.press(getByTestId("save-btn"));
    expect(onSave).toHaveBeenCalled();
  });

  it("calls onBack", () => {
    const onBack = jest.fn();
    const { getByText } = render(<AutoReplyConfigScreen {...props({ onBack })} />);
    fireEvent.press(getByText(/Back/));
    expect(onBack).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// MessageArchiveScreen (5 tests)
// ---------------------------------------------------------------------------

describe("MessageArchiveScreen", () => {
  function props(overrides = {}) {
    return {
      loading: false,
      error: null,
      threads: [] as AdminThread[],
      filter: {} as MessageArchiveFilter,
      onFilterChange: noop,
      onSearch: noop,
      onOpenThread: noop,
      onRetry: noop,
      onBack: noop,
      ...overrides,
    };
  }

  it("renders screen testID", () => {
    const { getByTestId } = render(<MessageArchiveScreen {...props()} />);
    expect(getByTestId("message-archive-screen")).toBeTruthy();
  });

  it("shows loading state", () => {
    const { getByText } = render(<MessageArchiveScreen {...props({ loading: true })} />);
    expect(getByText(/searching archive/i)).toBeTruthy();
  });

  it("shows empty state when threads is empty", () => {
    const { getByText } = render(<MessageArchiveScreen {...props()} />);
    expect(getByText("No Results")).toBeTruthy();
  });

  it("calls onSearch when search button pressed", () => {
    const onSearch = jest.fn();
    const { getByTestId } = render(<MessageArchiveScreen {...props({ onSearch })} />);
    fireEvent.press(getByTestId("search-btn"));
    expect(onSearch).toHaveBeenCalled();
  });

  it("calls onBack", () => {
    const onBack = jest.fn();
    const { getByText } = render(<MessageArchiveScreen {...props({ onBack })} />);
    fireEvent.press(getByText(/Back/));
    expect(onBack).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// WaitlistAdminListScreen (5 tests)
// ---------------------------------------------------------------------------

describe("WaitlistAdminListScreen", () => {
  function props(overrides = {}) {
    return {
      loading: false,
      error: null,
      entries: [] as WaitlistAdminEntry[],
      filter: "all" as const,
      onFilterChange: noop,
      onOpenEntry: noop,
      onNotifyEntry: noop,
      onCancelEntry: noop,
      onConvertEntry: noop,
      onRetry: noop,
      onBack: noop,
      ...overrides,
    };
  }

  it("renders screen testID", () => {
    const { getByTestId } = render(<WaitlistAdminListScreen {...props()} />);
    expect(getByTestId("waitlist-admin-list-screen")).toBeTruthy();
  });

  it("shows loading state", () => {
    const { getByText } = render(<WaitlistAdminListScreen {...props({ loading: true })} />);
    expect(getByText(/loading/i)).toBeTruthy();
  });

  it("shows error state with retry", () => {
    const onRetry = jest.fn();
    const { getByText } = render(
      <WaitlistAdminListScreen {...props({ error: "err", onRetry })} />,
    );
    fireEvent.press(getByText("Retry"));
    expect(onRetry).toHaveBeenCalled();
  });

  it("shows empty state when entries is empty", () => {
    const { getByText } = render(<WaitlistAdminListScreen {...props()} />);
    expect(getByText("No Entries")).toBeTruthy();
  });

  it("calls onFilterChange when filter chip pressed", () => {
    const onFilterChange = jest.fn();
    const { getByTestId } = render(<WaitlistAdminListScreen {...props({ onFilterChange })} />);
    fireEvent.press(getByTestId("filter-waiting"));
    expect(onFilterChange).toHaveBeenCalledWith("waiting");
  });
});

// ---------------------------------------------------------------------------
// WaitlistConvertScreen (5 tests)
// ---------------------------------------------------------------------------

describe("WaitlistConvertScreen", () => {
  function props(overrides = {}) {
    return {
      loading: false,
      error: null,
      entry: null as WaitlistAdminEntry | null,
      staffId: "",
      date: "",
      startTime: "",
      durationMinutes: "60",
      notes: "",
      submitting: false,
      submitError: null,
      submitSuccess: false,
      onStaffIdChange: noop,
      onDateChange: noop,
      onStartTimeChange: noop,
      onDurationChange: noop,
      onNotesChange: noop,
      onSubmit: noop,
      onRetry: noop,
      onBack: noop,
      ...overrides,
    };
  }

  it("renders screen testID", () => {
    const { getByTestId } = render(<WaitlistConvertScreen {...props()} />);
    expect(getByTestId("waitlist-convert-screen")).toBeTruthy();
  });

  it("shows loading state", () => {
    const { getByText } = render(<WaitlistConvertScreen {...props({ loading: true })} />);
    expect(getByText(/loading/i)).toBeTruthy();
  });

  it("shows error state", () => {
    const { getByText } = render(<WaitlistConvertScreen {...props({ error: "err" })} />);
    expect(getByText("Something went wrong")).toBeTruthy();
  });

  it("calls onSubmit when confirm pressed", () => {
    const onSubmit = jest.fn();
    const { getByTestId } = render(<WaitlistConvertScreen {...props({ onSubmit, staffId: "s1", date: "2024-01-01", startTime: "10:00" })} />);
    fireEvent.press(getByTestId("convert-btn"));
    expect(onSubmit).toHaveBeenCalled();
  });

  it("calls onBack", () => {
    const onBack = jest.fn();
    const { getByText } = render(<WaitlistConvertScreen {...props({ onBack })} />);
    fireEvent.press(getByText(/Back/));
    expect(onBack).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// WaitlistPoliciesScreen (5 tests)
// ---------------------------------------------------------------------------

describe("WaitlistPoliciesScreen", () => {
  function props(overrides = {}) {
    return {
      loading: false,
      error: null,
      policy: null as WaitlistPolicy | null,
      form: DEFAULT_WAITLIST_POLICY,
      saving: false,
      saveError: null,
      saveSuccess: false,
      onFormChange: noop,
      onSave: noop,
      onRetry: noop,
      onBack: noop,
      ...overrides,
    };
  }

  it("renders screen testID", () => {
    const { getByTestId } = render(<WaitlistPoliciesScreen {...props()} />);
    expect(getByTestId("waitlist-policies-screen")).toBeTruthy();
  });

  it("shows loading state", () => {
    const { getByText } = render(<WaitlistPoliciesScreen {...props({ loading: true })} />);
    expect(getByText(/loading/i)).toBeTruthy();
  });

  it("shows error state", () => {
    const { getByText } = render(<WaitlistPoliciesScreen {...props({ error: "err" })} />);
    expect(getByText("Something went wrong")).toBeTruthy();
  });

  it("calls onSave when save pressed", () => {
    const onSave = jest.fn();
    const { getByTestId } = render(<WaitlistPoliciesScreen {...props({ onSave })} />);
    fireEvent.press(getByTestId("save-btn"));
    expect(onSave).toHaveBeenCalled();
  });

  it("calls onBack", () => {
    const onBack = jest.fn();
    const { getByText } = render(<WaitlistPoliciesScreen {...props({ onBack })} />);
    fireEvent.press(getByText(/Back/));
    expect(onBack).toHaveBeenCalled();
  });
});
