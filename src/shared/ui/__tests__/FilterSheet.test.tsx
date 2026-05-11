import React from "react";
import { render, fireEvent } from "@testing-library/react-native";

import { FilterSheet } from "../FilterSheet";

describe("FilterSheet", () => {
  it("renders nothing when not visible", () => {
    const { queryByText } = render(
      <FilterSheet
        visible={false}
        onClose={jest.fn()}
        applyLabel="Apply"
        onApply={jest.fn()}
      >
        <></>
      </FilterSheet>,
    );
    expect(queryByText("Filters")).toBeNull();
  });

  it("invokes apply / reset / close handlers", () => {
    const onApply = jest.fn();
    const onReset = jest.fn();
    const onClose = jest.fn();
    const { getByTestId } = render(
      <FilterSheet
        visible
        onClose={onClose}
        onReset={onReset}
        applyLabel="Apply filters (3 results)"
        onApply={onApply}
        testID="fs"
      >
        <></>
      </FilterSheet>,
    );
    fireEvent.press(getByTestId("fs-reset"));
    expect(onReset).toHaveBeenCalled();
    fireEvent.press(getByTestId("fs-apply"));
    expect(onApply).toHaveBeenCalled();
    fireEvent.press(getByTestId("fs-scrim"));
    expect(onClose).toHaveBeenCalled();
  });
});
