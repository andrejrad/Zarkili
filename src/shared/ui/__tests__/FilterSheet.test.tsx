import React from "react";
import { render, fireEvent } from "@testing-library/react-native";

import { FilterSheet } from "../FilterSheet";

describe("FilterSheet", () => {
  it("renders nothing when not visible", () => {
    const { queryByText } = render(
      <FilterSheet
        visible={false}
        onClose={jest.fn()}
      >
        <></>
      </FilterSheet>,
    );
    expect(queryByText("Filters")).toBeNull();
  });

  it("invokes reset and close handlers", () => {
    const onReset = jest.fn();
    const onClose = jest.fn();
    const { getByTestId } = render(
      <FilterSheet
        visible
        onClose={onClose}
        onReset={onReset}
        testID="fs"
      >
        <></>
      </FilterSheet>,
    );
    fireEvent.press(getByTestId("fs-reset"));
    expect(onReset).toHaveBeenCalled();
    fireEvent.press(getByTestId("fs-scrim"));
    expect(onClose).toHaveBeenCalled();
  });
});
