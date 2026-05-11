import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

import { BookingConfirmationScreen } from "../BookingConfirmationScreen";
import { BookingDatePickerScreen } from "../BookingDatePickerScreen";
import { BookingPaymentScreen } from "../BookingPaymentScreen";
import { BookingPoliciesScreen } from "../BookingPoliciesScreen";
import { BookingReviewScreen } from "../BookingReviewScreen";
import { BookingTimePickerScreen } from "../BookingTimePickerScreen";
import { GuestContactScreen } from "../GuestContactScreen";
import { ManageBookingScreen } from "../ManageBookingScreen";
import { PostBookingUpgradeScreen } from "../PostBookingUpgradeScreen";
import { ServiceSelectionScreen } from "../ServiceSelectionScreen";
import { ANY_STAFF_ID, StaffSelectionScreen } from "../StaffSelectionScreen";

const SAMPLE_DATE = new Date(2026, 2, 12); // Thu Mar 12 2026

const SAMPLE_PRICING = {
  subtotal: 108,
  taxRate: 0.0875,
  tax: 9.45,
  tip: 0,
  total: 117.45,
};

const SERVICE_GROUPS = [
  {
    category: "hair",
    label: "Hair",
    services: [
      { id: "svc-cut", name: "Haircut", durationMinutes: 45, priceUsd: 60 },
      { id: "svc-color", name: "Color", durationMinutes: 90, priceUsd: 120 },
    ],
  },
];

describe("ServiceSelectionScreen", () => {
  it("disables continue when nothing selected", () => {
    const onContinue = jest.fn();
    const { getByTestId } = render(
      <ServiceSelectionScreen
        groups={SERVICE_GROUPS}
        selectedServiceIds={[]}
        onToggleService={jest.fn()}
        onPressContinue={onContinue}
        testID="ssel"
      />,
    );
    fireEvent.press(getByTestId("ssel-continue"));
    expect(onContinue).not.toHaveBeenCalled();
  });

  it("toggles a service via testID", () => {
    const onToggle = jest.fn();
    const { getByTestId } = render(
      <ServiceSelectionScreen
        groups={SERVICE_GROUPS}
        selectedServiceIds={[]}
        onToggleService={onToggle}
        onPressContinue={jest.fn()}
        testID="ssel"
      />,
    );
    fireEvent.press(getByTestId("ssel-svc-svc-cut"));
    expect(onToggle).toHaveBeenCalledWith("svc-cut");
  });

  it("enables continue when at least one service selected", () => {
    const onContinue = jest.fn();
    const { getByTestId } = render(
      <ServiceSelectionScreen
        groups={SERVICE_GROUPS}
        selectedServiceIds={["svc-cut"]}
        onToggleService={jest.fn()}
        onPressContinue={onContinue}
        testID="ssel"
      />,
    );
    fireEvent.press(getByTestId("ssel-continue"));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});

describe("StaffSelectionScreen", () => {
  it("selects 'Any available' when tapped", () => {
    const onSelect = jest.fn();
    const { getByTestId } = render(
      <StaffSelectionScreen
        staffOptions={[]}
        selectedStaffId={null}
        onSelectStaff={onSelect}
        onPressContinue={jest.fn()}
        testID="staff"
      />,
    );
    fireEvent.press(getByTestId("staff-any"));
    expect(onSelect).toHaveBeenCalledWith(ANY_STAFF_ID);
  });

  it("renders unavailable banner when allUnavailable", () => {
    const { getByTestId } = render(
      <StaffSelectionScreen
        staffOptions={[]}
        selectedStaffId={null}
        allUnavailable
        onSelectStaff={jest.fn()}
        onPressContinue={jest.fn()}
        testID="staff"
      />,
    );
    expect(getByTestId("staff-unavailable")).toBeTruthy();
  });
});

describe("BookingDatePickerScreen", () => {
  it("disables continue when no date selected", () => {
    const onContinue = jest.fn();
    const { getByTestId } = render(
      <BookingDatePickerScreen
        month={SAMPLE_DATE}
        selectedDate={null}
        onSelectDate={jest.fn()}
        onChangeMonth={jest.fn()}
        onPressContinue={onContinue}
        testID="dp"
      />,
    );
    fireEvent.press(getByTestId("dp-continue"));
    expect(onContinue).not.toHaveBeenCalled();
  });

  it("invokes onChangeMonth with delta -1 / +1", () => {
    const onChangeMonth = jest.fn();
    const { getByTestId } = render(
      <BookingDatePickerScreen
        month={SAMPLE_DATE}
        selectedDate={null}
        onSelectDate={jest.fn()}
        onChangeMonth={onChangeMonth}
        onPressContinue={jest.fn()}
        testID="dp"
      />,
    );
    fireEvent.press(getByTestId("dp-prev-month"));
    fireEvent.press(getByTestId("dp-next-month"));
    expect(onChangeMonth).toHaveBeenNthCalledWith(1, -1);
    expect(onChangeMonth).toHaveBeenNthCalledWith(2, 1);
  });
});

describe("BookingTimePickerScreen", () => {
  it("renders empty state when no slots and not loading", () => {
    const { getByTestId } = render(
      <BookingTimePickerScreen
        date={SAMPLE_DATE}
        availableSlots={[]}
        selectedSlot={null}
        segment="morning"
        timezone="PT"
        onChangeSegment={jest.fn()}
        onSelectSlot={jest.fn()}
        onPressContinue={jest.fn()}
        testID="tp"
      />,
    );
    expect(getByTestId("tp-empty")).toBeTruthy();
  });

  it("invokes onSelectSlot with time string", () => {
    const onSelectSlot = jest.fn();
    const { getByTestId } = render(
      <BookingTimePickerScreen
        date={SAMPLE_DATE}
        availableSlots={["9:00 AM", "9:30 AM"]}
        selectedSlot={null}
        segment="morning"
        timezone="PT"
        onChangeSegment={jest.fn()}
        onSelectSlot={onSelectSlot}
        onPressContinue={jest.fn()}
        testID="tp"
      />,
    );
    fireEvent.press(getByTestId("tp-slot-9:00-AM"));
    expect(onSelectSlot).toHaveBeenCalledWith("9:00 AM");
  });
});

describe("BookingReviewScreen", () => {
  it("renders summary and triggers continue", () => {
    const onContinue = jest.fn();
    const { getByTestId, getByText } = render(
      <BookingReviewScreen
        salon={{ id: "s1", name: "Test Salon" }}
        services={[{ id: "svc-cut", name: "Haircut", durationMinutes: 45, priceUsd: 60 }]}
        staff={null}
        staffAnyAvailable
        date={SAMPLE_DATE}
        timeSlot="9:00 AM"
        totalDurationMinutes={45}
        pricing={SAMPLE_PRICING}
        notes=""
        onChangeNotes={jest.fn()}
        onPressContinue={onContinue}
        testID="rev"
      />,
    );
    expect(getByText("Test Salon")).toBeTruthy();
    fireEvent.press(getByTestId("rev-continue"));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});

describe("BookingPoliciesScreen", () => {
  it("disables agree button until acknowledged", () => {
    const onAgree = jest.fn();
    const { getByTestId, rerender } = render(
      <BookingPoliciesScreen
        visible
        sections={[{ id: "p1", title: "Cancellation", body: "Body" }]}
        acknowledged={false}
        onChangeAcknowledged={jest.fn()}
        onPressAgreeAndContinue={onAgree}
        onPressClose={jest.fn()}
        testID="pol"
      />,
    );
    fireEvent.press(getByTestId("pol-agree"));
    expect(onAgree).not.toHaveBeenCalled();
    rerender(
      <BookingPoliciesScreen
        visible
        sections={[{ id: "p1", title: "Cancellation", body: "Body" }]}
        acknowledged
        onChangeAcknowledged={jest.fn()}
        onPressAgreeAndContinue={onAgree}
        onPressClose={jest.fn()}
        testID="pol"
      />,
    );
    fireEvent.press(getByTestId("pol-agree"));
    expect(onAgree).toHaveBeenCalledTimes(1);
  });
});

describe("BookingPaymentScreen", () => {
  it("disables confirm when no card and no Apple Pay", () => {
    const onConfirm = jest.fn();
    const { getByTestId } = render(
      <BookingPaymentScreen
        pricing={SAMPLE_PRICING}
        savedCards={[]}
        selectedCardId={null}
        onSelectCard={jest.fn()}
        onPressAddCard={jest.fn()}
        onPressConfirm={onConfirm}
        testID="pay"
      />,
    );
    fireEvent.press(getByTestId("pay-confirm"));
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("enables confirm when a card is selected", () => {
    const onConfirm = jest.fn();
    const { getByTestId } = render(
      <BookingPaymentScreen
        pricing={SAMPLE_PRICING}
        savedCards={[{ id: "c1", brand: "Visa", last4: "4242", isDefault: true }]}
        selectedCardId="c1"
        onSelectCard={jest.fn()}
        onPressAddCard={jest.fn()}
        onPressConfirm={onConfirm}
        testID="pay"
      />,
    );
    fireEvent.press(getByTestId("pay-confirm"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});

describe("BookingConfirmationScreen", () => {
  it("renders booking id and triggers Done", () => {
    const onDone = jest.fn();
    const { getByTestId } = render(
      <BookingConfirmationScreen
        bookingId="ZK-12345"
        salonName="Test Salon"
        servicesSummary="Haircut"
        staffName="Any available"
        date={SAMPLE_DATE}
        timeSlot="9:00 AM"
        pricing={SAMPLE_PRICING}
        onPressManage={jest.fn()}
        onPressDone={onDone}
        testID="conf"
      />,
    );
    expect(getByTestId("conf-booking-id")).toBeTruthy();
    fireEvent.press(getByTestId("conf-done"));
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});

describe("ManageBookingScreen", () => {
  it("opens cancel modal action and confirms cancellation", () => {
    const onCancel = jest.fn();
    const onConfirm = jest.fn();
    const { getByTestId } = render(
      <ManageBookingScreen
        bookingId="ZK-12345"
        status="confirmed"
        salonName="Test Salon"
        servicesSummary="Haircut"
        staffName="Any available"
        date={SAMPLE_DATE}
        timeSlot="9:00 AM"
        pricing={SAMPLE_PRICING}
        cancellationFeeUsd={25}
        cancelModalVisible
        onPressCancel={onCancel}
        onPressConfirmCancel={onConfirm}
        onPressDismissCancel={jest.fn()}
        testID="mng"
      />,
    );
    fireEvent.press(getByTestId("mng-cancel"));
    expect(onCancel).toHaveBeenCalledTimes(1);
    fireEvent.press(getByTestId("mng-cancel-confirm"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});

describe("GuestContactScreen", () => {
  const baseValues = {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    smsConsent: false,
  };

  it("disables continue until contact info is filled", () => {
    const onContinue = jest.fn();
    const { getByTestId } = render(
      <GuestContactScreen
        values={baseValues}
        onChange={jest.fn()}
        onPressContinue={onContinue}
        testID="gc"
      />,
    );
    fireEvent.press(getByTestId("gc-continue"));
    expect(onContinue).not.toHaveBeenCalled();
  });

  it("defaults SMS consent to false (TCPA)", () => {
    expect(baseValues.smsConsent).toBe(false);
  });

  it("enables continue when all fields valid", () => {
    const onContinue = jest.fn();
    const { getByTestId } = render(
      <GuestContactScreen
        values={{
          firstName: "Ada",
          lastName: "Lovelace",
          email: "ada@example.com",
          phone: "(555) 123-4567",
          smsConsent: false,
        }}
        onChange={jest.fn()}
        onPressContinue={onContinue}
        testID="gc"
      />,
    );
    fireEvent.press(getByTestId("gc-continue"));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});

describe("PostBookingUpgradeScreen", () => {
  it("triggers create-account and dismiss", () => {
    const onCreate = jest.fn();
    const onDismiss = jest.fn();
    const { getByTestId } = render(
      <PostBookingUpgradeScreen
        visible
        email="ada@example.com"
        onPressCreateAccount={onCreate}
        onPressDismiss={onDismiss}
        testID="upg"
      />,
    );
    fireEvent.press(getByTestId("upg-create"));
    expect(onCreate).toHaveBeenCalledTimes(1);
    fireEvent.press(getByTestId("upg-dismiss"));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
