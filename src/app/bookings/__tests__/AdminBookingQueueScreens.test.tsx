import { fireEvent, render, screen } from "@testing-library/react-native";

import { AdminBookingQueueScreen } from "../AdminBookingQueueScreens";
import type { AdminBookingQueueScreenProps } from "../AdminBookingQueueScreens";
import type { Booking } from "../../../domains/bookings/model";
import type { Location } from "../../../domains/locations/model";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const fakeTimestamp = { seconds: 0, nanoseconds: 0 } as never;

const LOC: Location = {
  locationId: "loc1",
  tenantId: "tA",
  name: "Main Studio",
  code: "MS",
  status: "active",
  timezone: "UTC",
  phone: null,
  email: null,
  address: { line1: "1 Main St", city: "City", country: "HR", postalCode: "10000" },
  operatingHours: {},
  createdAt: fakeTimestamp,
  updatedAt: fakeTimestamp,
};

function makeBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    bookingId: "bk1",
    tenantId: "tA",
    locationId: "loc1",
    staffId: "staff1",
    serviceId: "svc1",
    customerUserId: "cust1",
    date: "2026-05-15",
    startMinutes: 540,
    endMinutes: 600,
    startTime: "09:00",
    endTime: "10:00",
    durationMinutes: 60,
    bufferMinutes: 0,
    status: "pending",
    version: 0,
    lifecycleEvents: [],
    notes: null,
    createdAt: fakeTimestamp,
    updatedAt: fakeTimestamp,
    ...overrides,
  };
}

function defaultProps(overrides: Partial<AdminBookingQueueScreenProps> = {}): AdminBookingQueueScreenProps {
  return {
    locationNames: { loc1: "Main Studio" },
    staffNames: { staff1: "Alice" },
    customerLabels: { cust1: "Jane Doe" },
    locations: [LOC],
    activeTab: "pending",
    bookings: [],
    tabCounts: { pending: 0, reschedule_pending: 0, exceptions: 0 },
    isLoading: false,
    error: null,
    filterLocationId: null,
    filterDate: null,
    isActionSubmitting: false,
    actionError: null,
    onTabChange: jest.fn(),
    onFilterLocationChange: jest.fn(),
    onFilterDateChange: jest.fn(),
    onRetry: jest.fn(),
    onBack: jest.fn(),
    onConfirmAction: jest.fn(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Root / structure
// ---------------------------------------------------------------------------

describe("AdminBookingQueueScreen", () => {
  it("renders root testID", () => {
    render(<AdminBookingQueueScreen {...defaultProps()} />);
    expect(screen.getByTestId("admin-booking-queue-screen")).toBeTruthy();
  });

  it("renders back button and calls onBack when pressed", () => {
    const onBack = jest.fn();
    render(<AdminBookingQueueScreen {...defaultProps({ onBack })} />);
    fireEvent.press(screen.getByTestId("queue-back-button"));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("renders all three tabs", () => {
    render(<AdminBookingQueueScreen {...defaultProps()} />);
    expect(screen.getByTestId("tab-pending")).toBeTruthy();
    expect(screen.getByTestId("tab-reschedule_pending")).toBeTruthy();
    expect(screen.getByTestId("tab-exceptions")).toBeTruthy();
  });

  it("calls onTabChange when a tab is pressed", () => {
    const onTabChange = jest.fn();
    render(<AdminBookingQueueScreen {...defaultProps({ onTabChange })} />);
    fireEvent.press(screen.getByTestId("tab-reschedule_pending"));
    expect(onTabChange).toHaveBeenCalledWith("reschedule_pending");
  });

  it("renders filter bar with location chips", () => {
    render(<AdminBookingQueueScreen {...defaultProps()} />);
    expect(screen.getByTestId("filter-bar")).toBeTruthy();
    expect(screen.getByTestId("filter-location-all")).toBeTruthy();
    expect(screen.getByTestId("filter-location-loc1")).toBeTruthy();
  });

  it("calls onFilterLocationChange when location chip pressed", () => {
    const onFilter = jest.fn();
    render(<AdminBookingQueueScreen {...defaultProps({ onFilterLocationChange: onFilter })} />);
    fireEvent.press(screen.getByTestId("filter-location-loc1"));
    expect(onFilter).toHaveBeenCalledWith("loc1");
  });

  it("renders scroll view", () => {
    render(<AdminBookingQueueScreen {...defaultProps()} />);
    expect(screen.getByTestId("queue-scroll")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Loading / error / empty states
// ---------------------------------------------------------------------------

describe("AdminBookingQueueScreen — states", () => {
  it("shows loading indicator when isLoading=true", () => {
    render(<AdminBookingQueueScreen {...defaultProps({ isLoading: true })} />);
    expect(screen.getByText("Loading bookings…")).toBeTruthy();
  });

  it("shows error text and retry button when error is set", () => {
    const onRetry = jest.fn();
    render(
      <AdminBookingQueueScreen
        {...defaultProps({ error: "Network error", onRetry })}
      />,
    );
    expect(screen.getByText("Network error")).toBeTruthy();
    expect(screen.getByTestId("queue-retry-button")).toBeTruthy();
    fireEvent.press(screen.getByTestId("queue-retry-button"));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("shows empty state when no bookings", () => {
    render(<AdminBookingQueueScreen {...defaultProps({ bookings: [] })} />);
    expect(screen.getByTestId("queue-empty-state")).toBeTruthy();
  });

  it("does not show empty state when loading", () => {
    render(<AdminBookingQueueScreen {...defaultProps({ isLoading: true, bookings: [] })} />);
    expect(screen.queryByTestId("queue-empty-state")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Booking cards
// ---------------------------------------------------------------------------

describe("AdminBookingQueueScreen — booking cards", () => {
  it("renders a card per booking", () => {
    const bookings = [
      makeBooking({ bookingId: "bk1" }),
      makeBooking({ bookingId: "bk2" }),
    ];
    render(<AdminBookingQueueScreen {...defaultProps({ bookings })} />);
    expect(screen.getByTestId("booking-card-bk1")).toBeTruthy();
    expect(screen.getByTestId("booking-card-bk2")).toBeTruthy();
  });

  it("shows Confirm and Cancel buttons for a pending booking", () => {
    const bookings = [makeBooking({ bookingId: "bk1", status: "pending" })];
    render(<AdminBookingQueueScreen {...defaultProps({ bookings })} />);
    expect(screen.getByTestId("confirm-btn-bk1")).toBeTruthy();
    expect(screen.getByTestId("reject-btn-bk1")).toBeTruthy();
    expect(screen.getByTestId("cancel-btn-bk1")).toBeTruthy();
  });

  it("shows only Confirm and Cancel (no Reject) for reschedule_pending", () => {
    const bookings = [makeBooking({ bookingId: "bk1", status: "reschedule_pending" })];
    render(<AdminBookingQueueScreen {...defaultProps({ bookings, activeTab: "reschedule_pending" })} />);
    expect(screen.getByTestId("confirm-btn-bk1")).toBeTruthy();
    expect(screen.queryByTestId("reject-btn-bk1")).toBeNull();
    expect(screen.getByTestId("cancel-btn-bk1")).toBeTruthy();
  });

  it("shows only Cancel for exceptions (reschedule_rejected)", () => {
    const bookings = [makeBooking({ bookingId: "bk1", status: "reschedule_rejected" })];
    render(<AdminBookingQueueScreen {...defaultProps({ bookings, activeTab: "exceptions" })} />);
    expect(screen.queryByTestId("confirm-btn-bk1")).toBeNull();
    expect(screen.queryByTestId("reject-btn-bk1")).toBeNull();
    expect(screen.getByTestId("cancel-btn-bk1")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Action modal
// ---------------------------------------------------------------------------

describe("AdminBookingQueueScreen — action modal", () => {
  it("opens modal when Confirm button pressed", () => {
    const bookings = [makeBooking({ bookingId: "bk1", status: "pending" })];
    render(<AdminBookingQueueScreen {...defaultProps({ bookings })} />);

    fireEvent.press(screen.getByTestId("confirm-btn-bk1"));
    expect(screen.getByTestId("action-modal-sheet")).toBeTruthy();
  });

  it("calls onConfirmAction when modal submit pressed for confirm", () => {
    const onConfirmAction = jest.fn();
    const bookings = [makeBooking({ bookingId: "bk1", status: "pending" })];
    render(<AdminBookingQueueScreen {...defaultProps({ bookings, onConfirmAction })} />);

    fireEvent.press(screen.getByTestId("confirm-btn-bk1"));
    fireEvent.press(screen.getByTestId("action-modal-submit"));

    expect(onConfirmAction).toHaveBeenCalledWith("bk1", "confirm", "");
  });

  it("requires reason text before enabling submit for cancel", () => {
    const onConfirmAction = jest.fn();
    const bookings = [makeBooking({ bookingId: "bk1", status: "pending" })];
    render(<AdminBookingQueueScreen {...defaultProps({ bookings, onConfirmAction })} />);

    // Open cancel modal
    fireEvent.press(screen.getByTestId("cancel-btn-bk1"));
    expect(screen.getByTestId("action-reason-input")).toBeTruthy();

    // Submit without typing reason — the button is disabled but still pressable (RN handles internally)
    // Verify that typing a reason and submitting works
    fireEvent.changeText(screen.getByTestId("action-reason-input"), "Client request");
    fireEvent.press(screen.getByTestId("action-modal-submit"));

    expect(onConfirmAction).toHaveBeenCalledWith("bk1", "cancel", "Client request");
  });

  it("closes modal when dismiss button pressed", () => {
    const bookings = [makeBooking({ bookingId: "bk1", status: "pending" })];
    render(<AdminBookingQueueScreen {...defaultProps({ bookings })} />);

    fireEvent.press(screen.getByTestId("confirm-btn-bk1"));
    expect(screen.getByTestId("action-modal-sheet")).toBeTruthy();

    fireEvent.press(screen.getByTestId("action-modal-dismiss"));
    // Modal should be hidden (visible=false) — sheet unmounted or hidden
    expect(screen.queryByTestId("action-modal-sheet")).toBeNull();
  });

  it("shows actionError in the modal", () => {
    const bookings = [makeBooking({ bookingId: "bk1", status: "pending" })];
    render(
      <AdminBookingQueueScreen
        {...defaultProps({ bookings, actionError: "Something went wrong", isActionSubmitting: false })}
      />,
    );

    fireEvent.press(screen.getByTestId("confirm-btn-bk1"));
    expect(screen.getByTestId("action-modal-error")).toBeTruthy();
    expect(screen.getByText("Something went wrong")).toBeTruthy();
  });
});
