import React from "react";
import { render, fireEvent } from "@testing-library/react-native";

import { SegmentedControl } from "../SegmentedControl";
import { Stepper } from "../Stepper";
import { Banner } from "../Banner";
import { FormRow } from "../FormRow";
import { Text } from "react-native";

describe("SegmentedControl", () => {
  const options = [
    { value: "email", label: "Email" },
    { value: "phone", label: "Phone" },
  ] as const;

  it("renders both segments and calls onChange when pressed", () => {
    const onChange = jest.fn();
    const { getByText } = render(
      <SegmentedControl options={options} value="email" onChange={onChange} />,
    );
    expect(getByText("Email")).toBeTruthy();
    fireEvent.press(getByText("Phone"));
    expect(onChange).toHaveBeenCalledWith("phone");
  });

  it("does not call onChange when disabled", () => {
    const onChange = jest.fn();
    const { getByText } = render(
      <SegmentedControl options={options} value="email" onChange={onChange} disabled />,
    );
    fireEvent.press(getByText("Phone"));
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("Stepper", () => {
  it("renders accessibilityValue with current/total", () => {
    const { getByLabelText } = render(<Stepper totalSteps={4} currentStep={2} />);
    const node = getByLabelText("Step 2 of 4");
    expect(node.props.accessibilityValue).toEqual({ min: 1, max: 4, now: 2 });
  });

  it("renders all dots", () => {
    const { getByTestId } = render(
      <Stepper totalSteps={3} currentStep={2} testID="step" />,
    );
    expect(getByTestId("step-dot-1")).toBeTruthy();
    expect(getByTestId("step-dot-2")).toBeTruthy();
    expect(getByTestId("step-dot-3")).toBeTruthy();
  });
});

describe("Banner", () => {
  it("renders message and fires onAction", () => {
    const onAction = jest.fn();
    const { getByText } = render(
      <Banner variant="error" message="Something went wrong" actionLabel="Retry" onAction={onAction} />,
    );
    expect(getByText("Something went wrong")).toBeTruthy();
    fireEvent.press(getByText("Retry"));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("fires onDismiss", () => {
    const onDismiss = jest.fn();
    const { getByLabelText } = render(
      <Banner variant="info" message="Heads up" onDismiss={onDismiss} />,
    );
    fireEvent.press(getByLabelText("Dismiss"));
    expect(onDismiss).toHaveBeenCalled();
  });
});

describe("FormRow", () => {
  it("renders children", () => {
    const { getByText } = render(
      <FormRow>
        <Text>child</Text>
      </FormRow>,
    );
    expect(getByText("child")).toBeTruthy();
  });
});
