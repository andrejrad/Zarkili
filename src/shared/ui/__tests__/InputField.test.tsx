import React from "react";
import { render, fireEvent } from "@testing-library/react-native";

import { InputField } from "../InputField";

describe("InputField", () => {
  it("renders label and helper", () => {
    const { getByText } = render(
      <InputField
        label="Email"
        value=""
        onChangeText={() => {}}
        helper="We'll never share your email"
      />,
    );
    expect(getByText("Email")).toBeTruthy();
    expect(getByText("We'll never share your email")).toBeTruthy();
  });

  it("calls onChangeText when text changes", () => {
    const onChangeText = jest.fn();
    const { getByDisplayValue } = render(
      <InputField label="Email" value="hi" onChangeText={onChangeText} />,
    );
    fireEvent.changeText(getByDisplayValue("hi"), "hi@example.com");
    expect(onChangeText).toHaveBeenCalledWith("hi@example.com");
  });

  it("renders error message in place of helper", () => {
    const { getByText, queryByText } = render(
      <InputField
        label="Email"
        value=""
        onChangeText={() => {}}
        helper="Helper text"
        error="Email is required"
      />,
    );
    expect(getByText("Email is required")).toBeTruthy();
    expect(queryByText("Helper text")).toBeNull();
  });

  it("toggles password visibility on Show/Hide press", () => {
    const { getByLabelText } = render(
      <InputField label="Password" value="secret" onChangeText={() => {}} variant="password" />,
    );
    const toggle = getByLabelText("Show password");
    fireEvent.press(toggle);
    // After press it should announce as Hide
    expect(getByLabelText("Hide password")).toBeTruthy();
  });

  it("disables input when disabled prop is true", () => {
    const { getByDisplayValue } = render(
      <InputField label="Email" value="x" onChangeText={() => {}} disabled />,
    );
    expect(getByDisplayValue("x").props.editable).toBe(false);
  });
});
