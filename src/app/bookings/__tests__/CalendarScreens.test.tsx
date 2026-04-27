import { fireEvent, render, screen } from "@testing-library/react-native";

import { AdminCalendarScreen } from "../CalendarScreens";
import type { AdminCalendarScreenProps } from "../CalendarScreens";
import { ClientBookingScreen } from "../CalendarScreens";
import type { ClientBookingScreenProps } from "../CalendarScreens";
import type { Booking } from "../../../domains/bookings/model";

// firebase/firestore Timestamp is referenced in the Booking type
jest.mock("firebase/firestore", () => ({
  Timestamp: { now: () => ({ seconds: 0, nanoseconds: 0 }) },
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const fakeTimestamp = { seconds: 0, nanoseconds: 0 } as never;

function makeBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    bookingId: "bk1",
    tenantId: "tA",
    locationId: "loc1",
    staffId: "staff1",
    serviceId: "svc1",
    customerUserId: "cust1",
    date: "2026-04-27",
    startMinutes: 540,
    endMinutes: 600,
    startTime: "09:00",
    endTime: "10:00",
    durationMinutes: 60,
    bufferMinutes: 10,
    status: "confirmed",
    version: 0,
    lifecycleEvents: [],
    notes: null,
    createdAt: fakeTimestamp,
    updatedAt: fakeTimestamp,
    ...overrides,
  };
}

const STAFF = [
  { staffId: "staff1", displayName: "Alice" },
  { staffId: "staff2", displayName: "Bob" },
];

const SERVICES = [
  { serviceId: "svc1", name: "Haircut", durationMinutes: 60, price: 30, currency: "€" },
  { serviceId: "svc2", name: "Colour", durationMinutes: 120, price: 80, currency: "€" },
];

const SLOTS = [
  { startMinutes: 540, endMinutes: 600, startTime: "09:00", endTime: "10:00" },
  { startMinutes: 610, endMinutes: 670, startTime: "10:10", endTime: "11:10" },
];

// ---------------------------------------------------------------------------
// AdminCalendarScreen
// ---------------------------------------------------------------------------

describe("AdminCalendarScreen", () => {
  function defaultProps(overrides: Partial<AdminCalendarScreenProps> = {}): AdminCalendarScreenProps {
    return {
      locationName: "Downtown Salon",
      selectedDate: "2026-04-27",
      staff: STAFF,
      bookings: [],
      isLoading: false,
      error: null,
      onRetry: jest.fn(),
      onPrevDay: jest.fn(),
      onNextDay: jest.fn(),
      onBack: jest.fn(),
      ...overrides,
    };
  }

  it("renders location name and date", () => {
    render(<AdminCalendarScreen {...defaultProps()} />);
    expect(screen.getByText("Downtown Salon")).toBeTruthy();
    // 2026-04-27 is a Monday
    expect(screen.getByText(/Mon.*Apr.*27/)).toBeTruthy();
  });

  it("shows loading state", () => {
    render(<AdminCalendarScreen {...defaultProps({ isLoading: true })} />);
    expect(screen.getByText("Loading schedule...")).toBeTruthy();
  });

  it("shows error state with retry button", () => {
    const onRetry = jest.fn();
    render(<AdminCalendarScreen {...defaultProps({ error: "Failed to load", onRetry })} />);
    expect(screen.getByText("Failed to load")).toBeTruthy();
    fireEvent.press(screen.getByText("Retry"));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("renders staff names with no-bookings placeholder", () => {
    render(<AdminCalendarScreen {...defaultProps()} />);
    expect(screen.getByText("Alice")).toBeTruthy();
    expect(screen.getByText("Bob")).toBeTruthy();
    expect(screen.getAllByText("No bookings")).toHaveLength(2);
  });

  it("renders booking card with time range and status", () => {
    const booking = makeBooking({ staffId: "staff1", status: "confirmed" });
    render(<AdminCalendarScreen {...defaultProps({ bookings: [booking] })} />);
    expect(screen.getByText("09:00 – 10:00")).toBeTruthy();
    expect(screen.getByText("Confirmed")).toBeTruthy();
    expect(screen.getByText("svc1")).toBeTruthy();
  });

  it("calls onPrevDay and onNextDay on arrow press", () => {
    const onPrevDay = jest.fn();
    const onNextDay = jest.fn();
    render(<AdminCalendarScreen {...defaultProps({ onPrevDay, onNextDay })} />);
    fireEvent.press(screen.getByText("‹"));
    fireEvent.press(screen.getByText("›"));
    expect(onPrevDay).toHaveBeenCalledTimes(1);
    expect(onNextDay).toHaveBeenCalledTimes(1);
  });

  it("calls onBack when back button pressed", () => {
    const onBack = jest.fn();
    render(<AdminCalendarScreen {...defaultProps({ onBack })} />);
    fireEvent.press(screen.getByText("← Back"));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// ClientBookingScreen
// ---------------------------------------------------------------------------

describe("ClientBookingScreen", () => {
  function defaultProps(overrides: Partial<ClientBookingScreenProps> = {}): ClientBookingScreenProps {
    return {
      services: SERVICES,
      staff: STAFF,
      availableSlots: [],
      selectedServiceId: null,
      selectedStaffId: null,
      selectedDate: "2026-04-27",
      isLoadingSlots: false,
      slotsError: null,
      isSubmitting: false,
      submitError: null,
      onSelectService: jest.fn(),
      onSelectStaff: jest.fn(),
      onPrevDay: jest.fn(),
      onNextDay: jest.fn(),
      onSelectAndConfirmSlot: jest.fn().mockResolvedValue(undefined),
      onBack: jest.fn(),
      ...overrides,
    };
  }

  it("renders title and service list", () => {
    render(<ClientBookingScreen {...defaultProps()} />);
    expect(screen.getByText("Book Appointment")).toBeTruthy();
    expect(screen.getByText("Select service")).toBeTruthy();
    expect(screen.getByText("Haircut")).toBeTruthy();
    expect(screen.getByText("Colour")).toBeTruthy();
  });

  it("calls onSelectService when a service is pressed", () => {
    const onSelectService = jest.fn();
    render(<ClientBookingScreen {...defaultProps({ onSelectService })} />);
    fireEvent.press(screen.getByText("Haircut"));
    expect(onSelectService).toHaveBeenCalledWith("svc1");
  });

  it("does not render staff picker until a service is selected", () => {
    render(<ClientBookingScreen {...defaultProps()} />);
    expect(screen.queryByText("Select staff")).toBeNull();
  });

  it("renders staff picker once a service is selected", () => {
    render(<ClientBookingScreen {...defaultProps({ selectedServiceId: "svc1" })} />);
    expect(screen.getByText("Select staff")).toBeTruthy();
    expect(screen.getByText("Alice")).toBeTruthy();
    expect(screen.getByText("Bob")).toBeTruthy();
  });

  it("calls onSelectStaff when a staff pill is pressed", () => {
    const onSelectStaff = jest.fn();
    render(
      <ClientBookingScreen
        {...defaultProps({ selectedServiceId: "svc1", onSelectStaff })}
      />,
    );
    fireEvent.press(screen.getByText("Alice"));
    expect(onSelectStaff).toHaveBeenCalledWith("staff1");
  });

  it("renders date navigation and slot section once staff is selected", () => {
    render(
      <ClientBookingScreen
        {...defaultProps({ selectedServiceId: "svc1", selectedStaffId: "staff1" })}
      />,
    );
    expect(screen.getByText("Select date")).toBeTruthy();
    expect(screen.getByText("Available times")).toBeTruthy();
  });

  it("shows empty state when no slots and staff is selected", () => {
    render(
      <ClientBookingScreen
        {...defaultProps({
          selectedServiceId: "svc1",
          selectedStaffId: "staff1",
          availableSlots: [],
        })}
      />,
    );
    expect(screen.getByText("No available times for this day.")).toBeTruthy();
  });

  it("renders available slot pills", () => {
    render(
      <ClientBookingScreen
        {...defaultProps({
          selectedServiceId: "svc1",
          selectedStaffId: "staff1",
          availableSlots: SLOTS,
        })}
      />,
    );
    expect(screen.getByText("09:00")).toBeTruthy();
    expect(screen.getByText("10:10")).toBeTruthy();
  });

  it("calls onSelectAndConfirmSlot when a slot pill is pressed", () => {
    const onSelectAndConfirmSlot = jest.fn().mockResolvedValue(undefined);
    render(
      <ClientBookingScreen
        {...defaultProps({
          selectedServiceId: "svc1",
          selectedStaffId: "staff1",
          availableSlots: SLOTS,
          onSelectAndConfirmSlot,
        })}
      />,
    );
    fireEvent.press(screen.getByText("09:00"));
    expect(onSelectAndConfirmSlot).toHaveBeenCalledWith(SLOTS[0]);
  });

  it("shows loading slots state", () => {
    render(
      <ClientBookingScreen
        {...defaultProps({
          selectedServiceId: "svc1",
          selectedStaffId: "staff1",
          isLoadingSlots: true,
        })}
      />,
    );
    expect(screen.getByText("Loading available times...")).toBeTruthy();
  });

  it("shows slots error", () => {
    render(
      <ClientBookingScreen
        {...defaultProps({
          selectedServiceId: "svc1",
          selectedStaffId: "staff1",
          slotsError: "Network error",
        })}
      />,
    );
    expect(screen.getByText("Network error")).toBeTruthy();
  });

  it("shows submit error when present", () => {
    render(
      <ClientBookingScreen
        {...defaultProps({ submitError: "Slot no longer available" })}
      />,
    );
    expect(screen.getByText("Slot no longer available")).toBeTruthy();
  });

  it("shows confirming state while submitting", () => {
    render(<ClientBookingScreen {...defaultProps({ isSubmitting: true })} />);
    expect(screen.getByText("Confirming your booking...")).toBeTruthy();
  });

  it("calls onBack when back button pressed", () => {
    const onBack = jest.fn();
    render(<ClientBookingScreen {...defaultProps({ onBack })} />);
    fireEvent.press(screen.getByText("← Back"));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
