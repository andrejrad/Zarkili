import { fireEvent, render, screen } from "@testing-library/react-native";

import {
  BookingConfirmScreen,
  BookingsListScreen,
  BookingResultScreen,
  DatePickerScreen,
  LocationPickerScreen,
  ServicePickerScreen,
  SlotPickerScreen,
  TechnicianPickerScreen,
} from "../ClientBookingScreens";
import { generateBookableDates } from "../clientBookingFlow";
import type { Location } from "../../../domains/locations/model";
import type { Service } from "../../../domains/services/model";
import type { StaffMember } from "../../../domains/staff/model";
import type { AvailableSlot } from "../../../domains/bookings/slotEngine";
import type { BookingConfirmSummary } from "../ClientBookingScreens";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const LOC: Location = {
  locationId: "loc1",
  tenantId: "tenantA",
  name: "Downtown Salon",
  code: "DT",
  status: "active",
  timezone: "UTC",
  phone: null,
  email: null,
  address: { line1: "1 Main St", city: "Anytown", country: "US", postalCode: "00000" },
  operatingHours: {},
  createdAt: { seconds: 0, nanoseconds: 0 } as never,
  updatedAt: { seconds: 0, nanoseconds: 0 } as never,
};

const SVC: Service = {
  serviceId: "svc1",
  tenantId: "tenantA",
  locationIds: ["loc1"],
  name: "Haircut",
  category: "hair",
  durationMinutes: 60,
  bufferMinutes: 10,
  price: 30,
  currency: "€",
  active: true,
  sortOrder: 0,
  createdAt: { seconds: 0, nanoseconds: 0 } as never,
  updatedAt: { seconds: 0, nanoseconds: 0 } as never,
};

const TECH: StaffMember = {
  staffId: "staff1",
  tenantId: "tenantA",
  userId: "u1",
  displayName: "Alice",
  role: "technician",
  status: "active",
  locationIds: ["loc1"],
  serviceIds: ["svc1"],
  skills: [],
  constraints: [],
  createdAt: { seconds: 0, nanoseconds: 0 } as never,
  updatedAt: { seconds: 0, nanoseconds: 0 } as never,
};

const SLOT: AvailableSlot = {
  startMinutes: 540,
  endMinutes: 600,
  startTime: "09:00",
  endTime: "10:00",
};

const SUMMARY: BookingConfirmSummary = {
  locationName: "Downtown Salon",
  serviceName: "Haircut",
  technicianName: "Alice",
  date: "2026-04-27",
  startTime: "09:00",
  endTime: "10:00",
  durationMinutes: 60,
  price: 30,
  currency: "€",
};

// ---------------------------------------------------------------------------
// BookingsListScreen
// ---------------------------------------------------------------------------

describe("BookingsListScreen", () => {
  it("renders with correct testID and CTA", () => {
    const onStart = jest.fn();
    render(<BookingsListScreen onStartBooking={onStart} />);
    expect(screen.getByTestId("bookings-list-screen")).toBeTruthy();
    expect(screen.getByTestId("start-booking-button")).toBeTruthy();
  });

  it("calls onStartBooking when CTA pressed", () => {
    const onStart = jest.fn();
    render(<BookingsListScreen onStartBooking={onStart} />);
    fireEvent.press(screen.getByTestId("start-booking-button"));
    expect(onStart).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// LocationPickerScreen
// ---------------------------------------------------------------------------

describe("LocationPickerScreen", () => {
  function defaultProps(overrides = {}) {
    return {
      tenantName: "Zarkili Salon",
      locations: [],
      isLoading: false,
      error: null,
      onSelect: jest.fn(),
      onRetry: jest.fn(),
      onBack: jest.fn(),
      ...overrides,
    };
  }

  it("renders screen root", () => {
    render(<LocationPickerScreen {...defaultProps()} />);
    expect(screen.getByTestId("location-picker-screen")).toBeTruthy();
  });

  it("shows loading state", () => {
    render(<LocationPickerScreen {...defaultProps({ isLoading: true })} />);
    expect(screen.getByText(/Loading/)).toBeTruthy();
  });

  it("shows error and retry button", () => {
    const onRetry = jest.fn();
    render(<LocationPickerScreen {...defaultProps({ error: "Network error", onRetry })} />);
    expect(screen.getByText("Network error")).toBeTruthy();
    fireEvent.press(screen.getByText("Try again"));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("shows empty state when no locations", () => {
    render(<LocationPickerScreen {...defaultProps({ locations: [] })} />);
    expect(screen.getByText(/No locations available/)).toBeTruthy();
  });

  it("renders location cards and calls onSelect", () => {
    const onSelect = jest.fn();
    render(<LocationPickerScreen {...defaultProps({ locations: [LOC], onSelect })} />);
    expect(screen.getByTestId("location-card-loc1")).toBeTruthy();
    expect(screen.getByText("Downtown Salon")).toBeTruthy();
    fireEvent.press(screen.getByTestId("location-card-loc1"));
    expect(onSelect).toHaveBeenCalledWith(LOC);
  });
});

// ---------------------------------------------------------------------------
// ServicePickerScreen
// ---------------------------------------------------------------------------

describe("ServicePickerScreen", () => {
  function defaultProps(overrides = {}) {
    return {
      locationName: "Downtown Salon",
      services: [],
      isLoading: false,
      error: null,
      onSelect: jest.fn(),
      onRetry: jest.fn(),
      onBack: jest.fn(),
      ...overrides,
    };
  }

  it("renders screen root", () => {
    render(<ServicePickerScreen {...defaultProps()} />);
    expect(screen.getByTestId("service-picker-screen")).toBeTruthy();
  });

  it("renders service card with duration and price", () => {
    const onSelect = jest.fn();
    render(<ServicePickerScreen {...defaultProps({ services: [SVC], onSelect })} />);
    expect(screen.getByTestId("service-card-svc1")).toBeTruthy();
    expect(screen.getByText("Haircut")).toBeTruthy();
    expect(screen.getByText(/60 min/)).toBeTruthy();
    fireEvent.press(screen.getByTestId("service-card-svc1"));
    expect(onSelect).toHaveBeenCalledWith(SVC);
  });

  it("shows empty state when no services", () => {
    render(<ServicePickerScreen {...defaultProps()} />);
    expect(screen.getByText(/No services available/)).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// TechnicianPickerScreen
// ---------------------------------------------------------------------------

describe("TechnicianPickerScreen", () => {
  function defaultProps(overrides = {}) {
    return {
      serviceName: "Haircut",
      technicians: [],
      isLoading: false,
      error: null,
      onSelect: jest.fn(),
      onRetry: jest.fn(),
      onBack: jest.fn(),
      ...overrides,
    };
  }

  it("renders screen root", () => {
    render(<TechnicianPickerScreen {...defaultProps()} />);
    expect(screen.getByTestId("technician-picker-screen")).toBeTruthy();
  });

  it("renders technician card and fires selection", () => {
    const onSelect = jest.fn();
    render(<TechnicianPickerScreen {...defaultProps({ technicians: [TECH], onSelect })} />);
    expect(screen.getByTestId("technician-card-staff1")).toBeTruthy();
    expect(screen.getByText("Alice")).toBeTruthy();
    fireEvent.press(screen.getByTestId("technician-card-staff1"));
    expect(onSelect).toHaveBeenCalledWith(TECH);
  });

  it("shows empty state when no technicians", () => {
    render(<TechnicianPickerScreen {...defaultProps()} />);
    expect(screen.getByText(/No technicians available/)).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// DatePickerScreen
// ---------------------------------------------------------------------------

describe("DatePickerScreen", () => {
  const DATES = ["2026-04-27", "2026-04-28", "2026-04-29"];

  function defaultProps(overrides = {}) {
    return {
      technicianName: "Alice",
      availableDates: DATES,
      selectedDate: null,
      onSelect: jest.fn(),
      onConfirm: jest.fn(),
      onBack: jest.fn(),
      ...overrides,
    };
  }

  it("renders screen root", () => {
    render(<DatePickerScreen {...defaultProps()} />);
    expect(screen.getByTestId("date-picker-screen")).toBeTruthy();
  });

  it("renders all date buttons", () => {
    render(<DatePickerScreen {...defaultProps()} />);
    for (const d of DATES) {
      expect(screen.getByTestId(`date-${d}`)).toBeTruthy();
    }
  });

  it("calls onSelect when a date is tapped", () => {
    const onSelect = jest.fn();
    render(<DatePickerScreen {...defaultProps({ onSelect })} />);
    fireEvent.press(screen.getByTestId("date-2026-04-27"));
    expect(onSelect).toHaveBeenCalledWith("2026-04-27");
  });

  it("confirm button is present", () => {
    render(<DatePickerScreen {...defaultProps()} />);
    expect(screen.getByTestId("date-confirm-button")).toBeTruthy();
  });

  it("calls onConfirm when date is selected and button pressed", () => {
    const onConfirm = jest.fn();
    render(<DatePickerScreen {...defaultProps({ selectedDate: "2026-04-27", onConfirm })} />);
    fireEvent.press(screen.getByTestId("date-confirm-button"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// SlotPickerScreen
// ---------------------------------------------------------------------------

describe("SlotPickerScreen", () => {
  function defaultProps(overrides = {}) {
    return {
      date: "2026-04-27",
      slots: [],
      isLoading: false,
      error: null,
      onSelect: jest.fn(),
      onRetry: jest.fn(),
      onBack: jest.fn(),
      ...overrides,
    };
  }

  it("renders screen root", () => {
    render(<SlotPickerScreen {...defaultProps()} />);
    expect(screen.getByTestId("slot-picker-screen")).toBeTruthy();
  });

  it("shows loading state", () => {
    render(<SlotPickerScreen {...defaultProps({ isLoading: true })} />);
    expect(screen.getByText(/Loading available slots/)).toBeTruthy();
  });

  it("shows error and retry", () => {
    const onRetry = jest.fn();
    render(<SlotPickerScreen {...defaultProps({ error: "Failed", onRetry })} />);
    fireEvent.press(screen.getByText("Try again"));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("shows empty state when no slots", () => {
    render(<SlotPickerScreen {...defaultProps()} />);
    expect(screen.getByText(/No slots available/)).toBeTruthy();
  });

  it("renders slot buttons and calls onSelect", () => {
    const onSelect = jest.fn();
    render(<SlotPickerScreen {...defaultProps({ slots: [SLOT], onSelect })} />);
    expect(screen.getByTestId("slot-09:00")).toBeTruthy();
    expect(screen.getByText("09:00")).toBeTruthy();
    expect(screen.getByText("60 min")).toBeTruthy();
    fireEvent.press(screen.getByTestId("slot-09:00"));
    expect(onSelect).toHaveBeenCalledWith(SLOT);
  });
});

// ---------------------------------------------------------------------------
// BookingConfirmScreen
// ---------------------------------------------------------------------------

describe("BookingConfirmScreen", () => {
  function defaultProps(overrides = {}) {
    return {
      summary: SUMMARY,
      isSubmitting: false,
      onConfirm: jest.fn(),
      onBack: jest.fn(),
      ...overrides,
    };
  }

  it("renders screen root with summary rows", () => {
    render(<BookingConfirmScreen {...defaultProps()} />);
    expect(screen.getByTestId("booking-confirm-screen")).toBeTruthy();
    expect(screen.getByText("Downtown Salon")).toBeTruthy();
    expect(screen.getByText("Haircut")).toBeTruthy();
    expect(screen.getByText("Alice")).toBeTruthy();
  });

  it("shows 'Book now' when not submitting", () => {
    render(<BookingConfirmScreen {...defaultProps()} />);
    expect(screen.getByText("Book now")).toBeTruthy();
  });

  it("shows 'Booking…' while submitting", () => {
    render(<BookingConfirmScreen {...defaultProps({ isSubmitting: true })} />);
    expect(screen.getByText("Booking…")).toBeTruthy();
  });

  it("calls onConfirm when button pressed", () => {
    const onConfirm = jest.fn();
    render(<BookingConfirmScreen {...defaultProps({ onConfirm })} />);
    fireEvent.press(screen.getByTestId("confirm-booking-button"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// BookingResultScreen
// ---------------------------------------------------------------------------

describe("BookingResultScreen — success", () => {
  it("renders success screen with done button", () => {
    const onDone = jest.fn();
    render(
      <BookingResultScreen
        outcome="success"
        bookingId="bk123"
        date="2026-04-27"
        startTime="09:00"
        onDone={onDone}
      />,
    );
    expect(screen.getByTestId("booking-result-success")).toBeTruthy();
    expect(screen.getByTestId("booking-done-button")).toBeTruthy();
    fireEvent.press(screen.getByTestId("booking-done-button"));
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});

describe("BookingResultScreen — slot_unavailable", () => {
  it("renders slot-unavailable screen with retry button", () => {
    const onRetry = jest.fn();
    const onBack = jest.fn();
    render(<BookingResultScreen outcome="slot_unavailable" onRetry={onRetry} onBack={onBack} />);
    expect(screen.getByTestId("booking-result-slot-unavailable")).toBeTruthy();
    expect(screen.getByTestId("slot-retry-button")).toBeTruthy();
    fireEvent.press(screen.getByTestId("slot-retry-button"));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

describe("BookingResultScreen — error", () => {
  it("renders error screen with retry button", () => {
    const onRetry = jest.fn();
    const onBack = jest.fn();
    render(
      <BookingResultScreen
        outcome="error"
        message="Unexpected network failure"
        onRetry={onRetry}
        onBack={onBack}
      />,
    );
    expect(screen.getByTestId("booking-result-error")).toBeTruthy();
    expect(screen.getByTestId("booking-error-retry-button")).toBeTruthy();
    expect(screen.getByText("Unexpected network failure")).toBeTruthy();
    fireEvent.press(screen.getByTestId("booking-error-retry-button"));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// generateBookableDates utility
// ---------------------------------------------------------------------------

describe("generateBookableDates", () => {
  it("returns the requested number of dates", () => {
    // Use local-time constructor (not ISO string) to avoid UTC-vs-local issues
    const dates = generateBookableDates(new Date(2026, 3, 27), 7);
    expect(dates).toHaveLength(7);
  });

  it("first date equals the from date in ISO format", () => {
    const dates = generateBookableDates(new Date(2026, 3, 27), 3);
    expect(dates[0]).toBe("2026-04-27");
  });

  it("dates are sequential with no gaps", () => {
    const dates = generateBookableDates(new Date(2026, 3, 27), 3);
    expect(dates).toEqual(["2026-04-27", "2026-04-28", "2026-04-29"]);
  });

  it("handles month boundaries", () => {
    const dates = generateBookableDates(new Date(2026, 3, 29), 3);
    expect(dates).toEqual(["2026-04-29", "2026-04-30", "2026-05-01"]);
  });
});
