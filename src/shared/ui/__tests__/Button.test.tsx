import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { Text } from "react-native";

import { Button } from "../Button";

describe("Button", () => {
  it("renders label and fires onPress", () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button label="Sign in" onPress={onPress} />);
    fireEvent.press(getByText("Sign in"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does not fire onPress when disabled", () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button label="Sign in" onPress={onPress} disabled />);
    fireEvent.press(getByText("Sign in"));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("does not fire onPress when loading", () => {
    const onPress = jest.fn();
    const { getByLabelText } = render(
      <Button label="Sign in" onPress={onPress} loading accessibilityLabel="Sign in" />,
    );
    fireEvent.press(getByLabelText("Sign in"));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("renders all variants without crashing", () => {
    const variants = ["primary", "secondary", "tertiary", "destructive"] as const;
    variants.forEach((variant) => {
      const { getByText, unmount } = render(<Button label={variant} variant={variant} />);
      expect(getByText(variant)).toBeTruthy();
      unmount();
    });
  });

  it("supports iconOnly variant with accessibilityLabel", () => {
    const onPress = jest.fn();
    const { getByLabelText } = render(
      <Button
        variant="iconOnly"
        accessibilityLabel="Close"
        leftIcon={<Text>X</Text>}
        onPress={onPress}
      />,
    );
    fireEvent.press(getByLabelText("Close"));
    expect(onPress).toHaveBeenCalled();
  });

  it("renders all sizes", () => {
    const sizes = ["large", "medium", "small"] as const;
    sizes.forEach((size) => {
      const { getByText, unmount } = render(<Button label={size} size={size} />);
      expect(getByText(size)).toBeTruthy();
      unmount();
    });
  });
});
