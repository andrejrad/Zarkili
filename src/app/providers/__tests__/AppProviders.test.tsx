import { render, screen } from "@testing-library/react-native";
import { PropsWithChildren } from "react";
import { Text } from "react-native";

import { AppProviders } from "../AppProviders";

function Wrapper({ children }: PropsWithChildren) {
  return <AppProviders>{children}</AppProviders>;
}

describe("AppProviders", () => {
  it("renders children", () => {
    render(
      <Wrapper>
        <Text>provider-shell-ok</Text>
      </Wrapper>
    );

    expect(screen.getByText("provider-shell-ok")).toBeTruthy();
  });
});
