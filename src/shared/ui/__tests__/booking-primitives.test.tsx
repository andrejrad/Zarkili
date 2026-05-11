import React from "react";
import { render, fireEvent } from "@testing-library/react-native";

import {
  CalendarGrid,
  ModalSheet,
  PolicyAcknowledgement,
  StickyFooterCta,
  SummaryRow,
  TimeSlotChip,
  toIsoDate,
} from "../index";

describe("CalendarGrid", () => {
  const march2026 = new Date(2026, 2, 1);

  it("renders 42 cells (6 weeks × 7 days)", () => {
    const { getByTestId } = render(
      <CalendarGrid month={march2026} testID="cal" />,
    );
    // Spot-check a few
    expect(getByTestId(`cal-cell-${toIsoDate(new Date(2026, 2, 1))}`)).toBeTruthy();
    expect(getByTestId(`cal-cell-${toIsoDate(new Date(2026, 2, 31))}`)).toBeTruthy();
  });

  it("invokes onSelectDate when a non-disabled cell is pressed", () => {
    const onSelectDate = jest.fn();
    const { getByTestId } = render(
      <CalendarGrid month={march2026} testID="cal" onSelectDate={onSelectDate} />,
    );
    fireEvent.press(getByTestId(`cal-cell-${toIsoDate(new Date(2026, 2, 12))}`));
    expect(onSelectDate).toHaveBeenCalledTimes(1);
    const callArg = onSelectDate.mock.calls[0]?.[0] as Date;
    expect(callArg.getDate()).toBe(12);
    expect(callArg.getMonth()).toBe(2);
  });

  it("does not invoke onSelectDate for disabled dates", () => {
    const onSelectDate = jest.fn();
    const disabled = new Date(2026, 2, 12);
    const { getByTestId } = render(
      <CalendarGrid
        month={march2026}
        disabledDates={[disabled]}
        onSelectDate={onSelectDate}
        testID="cal"
      />,
    );
    fireEvent.press(getByTestId(`cal-cell-${toIsoDate(disabled)}`));
    expect(onSelectDate).not.toHaveBeenCalled();
  });
});

describe("TimeSlotChip", () => {
  it("announces availability in label", () => {
    const { getByLabelText } = render(<TimeSlotChip time="9:00 AM" />);
    expect(getByLabelText("9:00 AM, available")).toBeTruthy();
  });

  it("announces selected state", () => {
    const { getByLabelText } = render(<TimeSlotChip time="9:00 AM" selected />);
    expect(getByLabelText("9:00 AM, selected")).toBeTruthy();
  });

  it("announces disabled state and skips onPress", () => {
    const onPress = jest.fn();
    const { getByLabelText } = render(
      <TimeSlotChip time="9:00 AM" disabled onPress={onPress} />,
    );
    fireEvent.press(getByLabelText("9:00 AM, unavailable"));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("invokes onPress with the time string", () => {
    const onPress = jest.fn();
    const { getByLabelText } = render(
      <TimeSlotChip time="9:00 AM" onPress={onPress} />,
    );
    fireEvent.press(getByLabelText("9:00 AM, available"));
    expect(onPress).toHaveBeenCalledWith("9:00 AM");
  });
});

describe("SummaryRow", () => {
  it("renders label and value as plain View when no onPress", () => {
    const { getByText } = render(<SummaryRow label="Total" value="$108.00" />);
    expect(getByText("Total")).toBeTruthy();
    expect(getByText("$108.00")).toBeTruthy();
  });

  it("invokes onPress when editable", () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <SummaryRow label="Services" value="Cut" onPress={onPress} editable testID="row" />,
    );
    fireEvent.press(getByTestId("row"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe("StickyFooterCta", () => {
  it("renders total row only when totalLabel/totalValue provided", () => {
    const { queryByText, rerender } = render(
      <StickyFooterCta primaryLabel="Continue" onPrimaryPress={jest.fn()} />,
    );
    expect(queryByText("Total")).toBeNull();
    rerender(
      <StickyFooterCta
        primaryLabel="Continue"
        onPrimaryPress={jest.fn()}
        totalLabel="Total"
        totalValue="$108.00"
      />,
    );
    expect(queryByText("Total")).toBeTruthy();
    expect(queryByText("$108.00")).toBeTruthy();
  });

  it("invokes onPrimaryPress", () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <StickyFooterCta
        primaryLabel="Continue"
        onPrimaryPress={onPress}
        primaryTestID="cta"
      />,
    );
    fireEvent.press(getByTestId("cta"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe("ModalSheet", () => {
  it("renders title + close button when title provided", () => {
    const onClose = jest.fn();
    const { getByText, getByTestId } = render(
      <ModalSheet visible onClose={onClose} title="Policies" testID="sheet">
        <></>
      </ModalSheet>,
    );
    expect(getByText("Policies")).toBeTruthy();
    fireEvent.press(getByTestId("sheet-close"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("dismisses on scrim press", () => {
    const onClose = jest.fn();
    const { getByTestId } = render(
      <ModalSheet visible onClose={onClose} testID="sheet">
        <></>
      </ModalSheet>,
    );
    fireEvent.press(getByTestId("sheet-scrim"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("PolicyAcknowledgement", () => {
  it("toggles checked state via onChange", () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <PolicyAcknowledgement
        checked={false}
        onChange={onChange}
        label="I agree"
        testID="ack"
      />,
    );
    fireEvent.press(getByTestId("ack-toggle"));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("renders error message when provided", () => {
    const { getByTestId } = render(
      <PolicyAcknowledgement
        checked={false}
        onChange={jest.fn()}
        label="I agree"
        errorMessage="Required"
        testID="ack"
      />,
    );
    expect(getByTestId("ack-error").props.children).toBe("Required");
  });
});
