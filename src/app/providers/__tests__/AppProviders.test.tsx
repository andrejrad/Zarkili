import { fireEvent, render, screen } from "@testing-library/react-native";
import { PropsWithChildren } from "react";
import { Text, TouchableOpacity } from "react-native";

import { AppProviders } from "../AppProviders";
import { useAuth } from "../AuthProvider";
import { useTenant } from "../TenantProvider";

function Wrapper({ children }: PropsWithChildren) {
  return <AppProviders>{children}</AppProviders>;
}

function AuthTenantProbe() {
  const { userId, signInAsDev, signOut } = useAuth();
  const { tenantId, setTenantId } = useTenant();

  return (
    <>
      <Text>user:{userId ?? "none"}</Text>
      <Text>tenant:{tenantId ?? "none"}</Text>
      <TouchableOpacity accessibilityRole="button" onPress={signInAsDev}>
        <Text>sign-in</Text>
      </TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" onPress={() => setTenantId("tenant-dev")}>
        <Text>set-tenant</Text>
      </TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" onPress={signOut}>
        <Text>sign-out</Text>
      </TouchableOpacity>
    </>
  );
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

  it("clears tenant context after sign-out", () => {
    render(
      <Wrapper>
        <AuthTenantProbe />
      </Wrapper>
    );

    fireEvent.press(screen.getByText("sign-in"));
    fireEvent.press(screen.getByText("set-tenant"));

    expect(screen.getByText("tenant:tenant-dev")).toBeTruthy();

    fireEvent.press(screen.getByText("sign-out"));

    expect(screen.getByText("user:none")).toBeTruthy();
    expect(screen.getByText("tenant:none")).toBeTruthy();
  });
});
