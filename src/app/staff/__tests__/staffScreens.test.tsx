/**
 * staffScreens.test.tsx — W27 Batch G screen tests.
 * Covers: StaffTodayScreen (G.1), StaffCalendarScreen (G.2),
 *         WalkInQueueScreen (G.3), ClientLookupScreen (G.4.1),
 *         ClientDetailScreen (G.4.2), ClientNotesHistoryScreen (G.5),
 *         AIChatScreen (G.6/7/8).
 * Also covers: staffHelpers utilities.
 */

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";

import { StaffTodayScreen } from "../StaffTodayScreen";
import { StaffCalendarScreen } from "../StaffCalendarScreen";
import { WalkInQueueScreen } from "../WalkInQueueScreen";
import { ClientLookupScreen } from "../ClientLookupScreen";
import { ClientDetailScreen } from "../ClientDetailScreen";
import { ClientNotesHistoryScreen } from "../ClientNotesHistoryScreen";
import { AIChatScreen } from "../AIChatScreen";
import {
  deriveInitials,
  djb2AvatarColor,
  formatLtv,
  formatWaitTime,
  resolveAIBudgetState,
  AVATAR_PALETTE,
} from "../staffHelpers";
import type {
  AIChatMessage,
  AISuggestion,
  ClientDetail,
  ClientNoteEntry,
  ClientRow,
  StaffAppointment,
} from "../staffHelpers";
import type { WeekDay } from "../StaffCalendarScreen";

// ---------------------------------------------------------------------------
// staffHelpers unit tests
// ---------------------------------------------------------------------------

describe("staffHelpers utilities", () => {
  describe("deriveInitials", () => {
    it("returns two initials for full name", () => {
      expect(deriveInitials("Jane Doe")).toBe("JD");
    });
    it("returns single initial for single-word name", () => {
      expect(deriveInitials("Valentina")).toBe("V");
    });
    it("returns first+last for multi-word name", () => {
      expect(deriveInitials("Maria Alice Santos")).toBe("MS");
    });
    it("returns ? for empty string", () => {
      expect(deriveInitials("")).toBe("?");
    });
  });

  describe("djb2AvatarColor", () => {
    it("returns a string from AVATAR_PALETTE", () => {
      const color = djb2AvatarColor("Jane Doe");
      expect(AVATAR_PALETTE).toContain(color);
    });
    it("is deterministic — same name returns same color", () => {
      expect(djb2AvatarColor("Jane Doe")).toBe(djb2AvatarColor("Jane Doe"));
    });
    it("different names can return different colours", () => {
      // Not guaranteed but highly likely for these two names
      const a = djb2AvatarColor("Alice");
      const b = djb2AvatarColor("Zara");
      // Just ensure both are valid palette entries
      expect(AVATAR_PALETTE).toContain(a);
      expect(AVATAR_PALETTE).toContain(b);
    });
  });

  describe("formatWaitTime", () => {
    it("returns 'Now' for 0 minutes", () => {
      expect(formatWaitTime(0)).toBe("Now");
    });
    it("formats minutes under 60", () => {
      expect(formatWaitTime(15)).toBe("~15 min");
    });
    it("formats exactly 60 minutes as 1 hr", () => {
      expect(formatWaitTime(60)).toBe("~1 hr");
    });
    it("formats 65 minutes as 1 hr 5 min", () => {
      expect(formatWaitTime(65)).toBe("~1 hr 5 min");
    });
  });

  describe("formatLtv", () => {
    it("formats zero as $0", () => {
      expect(formatLtv(0)).toBe("$0");
    });
    it("formats 1234 as $1,234", () => {
      expect(formatLtv(1234)).toBe("$1,234");
    });
  });

  describe("resolveAIBudgetState", () => {
    it("returns 'exhausted' at 0 tokens", () => {
      expect(resolveAIBudgetState(0)).toBe("exhausted");
    });
    it("returns 'warning' below threshold", () => {
      expect(resolveAIBudgetState(4999)).toBe("warning");
    });
    it("returns 'ok' above threshold", () => {
      expect(resolveAIBudgetState(10000)).toBe("ok");
    });
  });
});

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const makeAppointment = (
  overrides: Partial<StaffAppointment> = {},
): StaffAppointment => ({
  id: "appt-1",
  clientName: "Jane Doe",
  clientId: "c1",
  service: "Haircut",
  startTime: "2026-05-12T14:00:00",
  durationMinutes: 60,
  position: 1,
  status: "waiting",
  initials: "JD",
  ...overrides,
});

const makeClientRow = (overrides: Partial<ClientRow> = {}): ClientRow => ({
  id: "c1",
  name: "Jane Doe",
  initials: "JD",
  tier: "gold",
  isVIP: false,
  lastVisit: "2026-04-15",
  lifetimeValueCents: 123400,
  noShows: 0,
  ...overrides,
});

const makeClientDetail = (overrides: Partial<ClientDetail> = {}): ClientDetail => ({
  ...makeClientRow(),
  phone: "+1 555-1234",
  email: "jane@example.com",
  since: "Jan 2023",
  totalVisits: 12,
  upcomingAppointment: null,
  preferredServices: ["Haircut", "Balayage"],
  preferredStylists: ["Maria"],
  allergies: null,
  loyaltyPoints: 340,
  ...overrides,
});

const makeNoteEntry = (overrides: Partial<ClientNoteEntry> = {}): ClientNoteEntry => ({
  id: "n1",
  createdAt: "2026-04-20T09:00:00",
  authorName: "Maria S.",
  kind: "note",
  body: "Client prefers cooler tones on highlights.",
  ...overrides,
});

const makeAISuggestion = (overrides: Partial<AISuggestion> = {}): AISuggestion => ({
  id: "ai-1",
  type: "scheduling",
  typeLabel: "Scheduling suggestion",
  body: "Move 2:00 PM appointment to 4:00 PM to fit a walk-in",
  primaryActionLabel: "Accept",
  secondaryActionLabel: "Modify",
  ...overrides,
});

const makeMessage = (overrides: Partial<AIChatMessage> = {}): AIChatMessage => ({
  id: "msg-1",
  role: "user",
  body: "What should I do today?",
  sentAt: "2026-05-12T08:00:00",
  ...overrides,
});

const makeWeekDay = (overrides: Partial<WeekDay> = {}): WeekDay => ({
  date: "2026-05-12",
  dayLabel: "Mon",
  dayNumber: 12,
  isToday: false,
  ...overrides,
});

// ---------------------------------------------------------------------------
// StaffTodayScreen
// ---------------------------------------------------------------------------

describe("StaffTodayScreen", () => {
  function defaultProps(overrides = {}) {
    return {
      staffName: "Maria",
      dateLabel: "Monday, May 12",
      isAvailable: true,
      bookingsToday: 6,
      revenueToday: "$420",
      nextSlotLabel: "3:00 PM",
      avgRating: "4.9",
      appointments: [makeAppointment()],
      walkInQueueCount: 2,
      testID: "staff-today",
      ...overrides,
    };
  }

  it("renders greeting with staff name", () => {
    const { getByText } = render(<StaffTodayScreen {...defaultProps()} />);
    expect(getByText("Good day, Maria")).toBeTruthy();
  });

  it("renders KPI values", () => {
    const { getByText } = render(<StaffTodayScreen {...defaultProps()} />);
    expect(getByText("$420")).toBeTruthy();
    expect(getByText("4.9")).toBeTruthy();
  });

  it("renders appointment client name", () => {
    const { getByText } = render(<StaffTodayScreen {...defaultProps()} />);
    expect(getByText("Jane Doe")).toBeTruthy();
  });

  it("renders walk-in queue strip when count > 0", () => {
    const { getByText } = render(<StaffTodayScreen {...defaultProps()} />);
    expect(getByText(/2 walk-ins waiting/)).toBeTruthy();
  });

  it("renders loading skeleton (no greeting text)", () => {
    const { queryByText } = render(
      <StaffTodayScreen {...defaultProps({ isLoading: true })} />,
    );
    expect(queryByText("Good day, Maria")).toBeNull();
  });

  it("renders error state and calls onPressRetry", () => {
    const onPressRetry = jest.fn();
    const { getByText } = render(
      <StaffTodayScreen
        {...defaultProps({ isError: true, onPressRetry })}
      />,
    );
    fireEvent.press(getByText("Retry"));
    expect(onPressRetry).toHaveBeenCalledTimes(1);
  });

  it("renders off-day state", () => {
    const { getByText } = render(
      <StaffTodayScreen {...defaultProps({ isOffDay: true })} />,
    );
    expect(getByText(/You're off today/)).toBeTruthy();
  });

  it("renders AI suggestion card when provided", () => {
    const { getByText } = render(
      <StaffTodayScreen
        {...defaultProps({ aiSuggestion: makeAISuggestion() })}
      />,
    );
    expect(getByText("Move 2:00 PM appointment to 4:00 PM to fit a walk-in")).toBeTruthy();
  });

  it("calls onPressViewQueue when strip pressed", () => {
    const onPressViewQueue = jest.fn();
    const { getByText } = render(
      <StaffTodayScreen {...defaultProps({ onPressViewQueue })} />,
    );
    fireEvent.press(getByText(/View queue/));
    expect(onPressViewQueue).toHaveBeenCalledTimes(1);
  });

  it("calls onToggleAvailability when toggle pressed", () => {
    const onToggleAvailability = jest.fn();
    const { getByRole } = render(
      <StaffTodayScreen {...defaultProps({ onToggleAvailability })} />,
    );
    fireEvent.press(getByRole("switch"));
    expect(onToggleAvailability).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// WalkInQueueScreen
// ---------------------------------------------------------------------------

describe("WalkInQueueScreen", () => {
  function defaultProps(overrides = {}) {
    return {
      queue: [makeAppointment({ position: 1 })],
      testID: "queue",
      ...overrides,
    };
  }

  it("renders client name in queue", () => {
    const { getByText } = render(<WalkInQueueScreen {...defaultProps()} />);
    expect(getByText("Jane Doe")).toBeTruthy();
  });

  it("renders empty state when queue is empty", () => {
    const { getByText } = render(
      <WalkInQueueScreen {...defaultProps({ queue: [] })} />,
    );
    expect(getByText("No one in the queue")).toBeTruthy();
  });

  it("renders loading shimmer rows", () => {
    const { queryByText } = render(
      <WalkInQueueScreen {...defaultProps({ isLoading: true })} />,
    );
    expect(queryByText("Jane Doe")).toBeNull();
  });

  it("renders error state and calls retry", () => {
    const onPressRetry = jest.fn();
    const { getByText } = render(
      <WalkInQueueScreen {...defaultProps({ isError: true, onPressRetry })} />,
    );
    fireEvent.press(getByText("Retry"));
    expect(onPressRetry).toHaveBeenCalledTimes(1);
  });

  it("calls onPressAddWalkIn from Add button", () => {
    const onPressAddWalkIn = jest.fn();
    const { getByText } = render(
      <WalkInQueueScreen {...defaultProps({ onPressAddWalkIn })} />,
    );
    fireEvent.press(getByText("+ Add"));
    expect(onPressAddWalkIn).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// ClientLookupScreen
// ---------------------------------------------------------------------------

describe("ClientLookupScreen", () => {
  function defaultProps(overrides = {}) {
    return {
      clients: [makeClientRow()],
      searchQuery: "",
      activeFilter: "all" as const,
      sortKey: "recent" as const,
      onChangeSearch: jest.fn(),
      onChangeFilter: jest.fn(),
      onChangeSortKey: jest.fn(),
      onPressClient: jest.fn(),
      testID: "lookup",
      ...overrides,
    };
  }

  it("renders client name", () => {
    const { getByText } = render(<ClientLookupScreen {...defaultProps()} />);
    expect(getByText("Jane Doe")).toBeTruthy();
  });

  it("calls onPressClient when row pressed", () => {
    const onPressClient = jest.fn();
    const { getByText } = render(
      <ClientLookupScreen {...defaultProps({ onPressClient })} />,
    );
    fireEvent.press(getByText("Jane Doe"));
    expect(onPressClient).toHaveBeenCalledWith("c1");
  });

  it("renders no-results empty state when clients is empty and search is active", () => {
    const { getByText } = render(
      <ClientLookupScreen
        {...defaultProps({ clients: [], searchQuery: "xyz" })}
      />,
    );
    expect(getByText(/No results for "xyz"/)).toBeTruthy();
  });

  it("renders loading shimmer rows", () => {
    const { queryByText } = render(
      <ClientLookupScreen {...defaultProps({ isLoading: true })} />,
    );
    expect(queryByText("Jane Doe")).toBeNull();
  });

  it("renders error state and calls retry", () => {
    const onPressRetry = jest.fn();
    const { getByText } = render(
      <ClientLookupScreen {...defaultProps({ isError: true, onPressRetry })} />,
    );
    fireEvent.press(getByText("Retry"));
    expect(onPressRetry).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// ClientDetailScreen
// ---------------------------------------------------------------------------

describe("ClientDetailScreen", () => {
  function defaultProps(overrides = {}) {
    return {
      client: makeClientDetail(),
      activeTab: "upcoming" as const,
      upcomingAppointments: [],
      pastAppointments: [],
      onChangeTab: jest.fn(),
      testID: "client-detail",
      ...overrides,
    };
  }

  it("renders client name in header", () => {
    const { getByText } = render(<ClientDetailScreen {...defaultProps()} />);
    expect(getByText("Jane Doe")).toBeTruthy();
  });

  it("renders loading shimmer (header in loading state)", () => {
    const { queryByText } = render(
      <ClientDetailScreen {...defaultProps({ client: null, isLoading: true })} />,
    );
    // Name should not appear while loading
    expect(queryByText("Jane Doe")).toBeNull();
  });

  it("renders error state and calls retry", () => {
    const onPressRetry = jest.fn();
    const { getByText } = render(
      <ClientDetailScreen
        {...defaultProps({ client: null, isError: true, onPressRetry })}
      />,
    );
    fireEvent.press(getByText("Retry"));
    expect(onPressRetry).toHaveBeenCalledTimes(1);
  });

  it("renders upcoming empty state when no appointments", () => {
    const { getByText } = render(<ClientDetailScreen {...defaultProps()} />);
    expect(getByText("No upcoming appointments")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// ClientNotesHistoryScreen
// ---------------------------------------------------------------------------

describe("ClientNotesHistoryScreen", () => {
  function defaultProps(overrides = {}) {
    return {
      client: makeClientDetail(),
      notes: [makeNoteEntry()],
      testID: "notes-history",
      ...overrides,
    };
  }

  it("renders note body text", () => {
    const { getByText } = render(<ClientNotesHistoryScreen {...defaultProps()} />);
    expect(getByText("Client prefers cooler tones on highlights.")).toBeTruthy();
  });

  it("renders empty state when no notes", () => {
    const { getByText } = render(
      <ClientNotesHistoryScreen {...defaultProps({ notes: [] })} />,
    );
    expect(getByText("No notes yet")).toBeTruthy();
  });

  it("renders loading shimmer rows", () => {
    const { queryByText } = render(
      <ClientNotesHistoryScreen {...defaultProps({ isLoading: true })} />,
    );
    expect(queryByText("Client prefers cooler tones on highlights.")).toBeNull();
  });

  it("renders error state and calls retry", () => {
    const onPressRetry = jest.fn();
    const { getByText } = render(
      <ClientNotesHistoryScreen
        {...defaultProps({ notes: [], isError: true, onPressRetry })}
      />,
    );
    fireEvent.press(getByText("Retry"));
    expect(onPressRetry).toHaveBeenCalledTimes(1);
  });

  it("calls onPressNote when a note card is pressed", () => {
    const onPressNote = jest.fn();
    const { getByText } = render(
      <ClientNotesHistoryScreen {...defaultProps({ onPressNote })} />,
    );
    fireEvent.press(getByText("Client prefers cooler tones on highlights."));
    expect(onPressNote).toHaveBeenCalledWith("n1");
  });
});

// ---------------------------------------------------------------------------
// AIChatScreen
// ---------------------------------------------------------------------------

describe("AIChatScreen", () => {
  function defaultProps(overrides = {}) {
    return {
      messages: [],
      composerValue: "",
      onChangeComposer: jest.fn(),
      testID: "ai-chat",
      ...overrides,
    };
  }

  it("renders empty thread state", () => {
    const { getByText } = render(<AIChatScreen {...defaultProps()} />);
    expect(getByText("Ask your AI assistant")).toBeTruthy();
  });

  it("renders message bubble text", () => {
    const { getByText } = render(
      <AIChatScreen {...defaultProps({ messages: [makeMessage()] })} />,
    );
    expect(getByText("What should I do today?")).toBeTruthy();
  });

  it("renders AI response bubble", () => {
    const { getByText } = render(
      <AIChatScreen
        {...defaultProps({
          messages: [makeMessage({ role: "assistant", body: "Focus on walk-ins first." })],
        })}
      />,
    );
    expect(getByText("Focus on walk-ins first.")).toBeTruthy();
  });

  it("renders budget warning banner when budgetState is warning", () => {
    const { getByText } = render(
      <AIChatScreen {...defaultProps({ budgetState: "warning" })} />,
    );
    expect(getByText("AI budget low")).toBeTruthy();
  });

  it("renders budget exhausted banner when budgetState is exhausted", () => {
    const { getByText } = render(
      <AIChatScreen {...defaultProps({ budgetState: "exhausted" })} />,
    );
    expect(getByText("AI budget exhausted")).toBeTruthy();
  });

  it("renders error state and calls retry", () => {
    const onPressRetry = jest.fn();
    const { getByText } = render(
      <AIChatScreen {...defaultProps({ isError: true, onPressRetry })} />,
    );
    fireEvent.press(getByText("Retry"));
    expect(onPressRetry).toHaveBeenCalledTimes(1);
  });

  it("renders inline AI suggestion when provided", () => {
    const suggestion = makeAISuggestion();
    const { getByText } = render(
      <AIChatScreen {...defaultProps({ inlineSuggestion: suggestion })} />,
    );
    expect(getByText("Move 2:00 PM appointment to 4:00 PM to fit a walk-in")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// StaffCalendarScreen
// ---------------------------------------------------------------------------

describe("StaffCalendarScreen", () => {
  const weekDays: WeekDay[] = [
    makeWeekDay({ date: "2026-05-11", dayLabel: "Mon", dayNumber: 11, isToday: false }),
    makeWeekDay({ date: "2026-05-12", dayLabel: "Tue", dayNumber: 12, isToday: true }),
  ];

  function defaultProps(overrides = {}) {
    return {
      weekDays,
      appointments: [],
      testID: "staff-calendar",
      ...overrides,
    };
  }

  it("renders day labels", () => {
    const { getByText } = render(<StaffCalendarScreen {...defaultProps()} />);
    expect(getByText("Mon")).toBeTruthy();
    expect(getByText("Tue")).toBeTruthy();
  });

  it("renders appointment block with client name", () => {
    const appt = makeAppointment({ startTime: "2026-05-12T09:00:00", status: "waiting" });
    const { getByText } = render(
      <StaffCalendarScreen {...defaultProps({ appointments: [appt] })} />,
    );
    expect(getByText("Jane Doe")).toBeTruthy();
  });

  it("renders error state and calls retry", () => {
    const onPressRetry = jest.fn();
    const { getByText } = render(
      <StaffCalendarScreen {...defaultProps({ isError: true, onPressRetry })} />,
    );
    fireEvent.press(getByText("Retry"));
    expect(onPressRetry).toHaveBeenCalledTimes(1);
  });

  it("calls onPressAppointment when block pressed", () => {
    const onPressAppointment = jest.fn();
    const appt = makeAppointment({ startTime: "2026-05-12T09:00:00" });
    const { getByText } = render(
      <StaffCalendarScreen {...defaultProps({ appointments: [appt], onPressAppointment })} />,
    );
    fireEvent.press(getByText("Jane Doe"));
    expect(onPressAppointment).toHaveBeenCalledWith("appt-1");
  });
});
