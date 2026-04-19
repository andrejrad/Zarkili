import { fireEvent, render, screen } from "@testing-library/react-native";
import { PropsWithChildren } from "react";
import { Text, TouchableOpacity } from "react-native";

import { TenantProvider, useTenant } from "../TenantProvider";

function TenantProbe() {
  const { tenantId, setTenantId } = useTenant();

  return (
    <>
      <Text>tenant:{tenantId ?? "none"}</Text>
      <TouchableOpacity accessibilityRole="button" onPress={() => setTenantId("tenant-a")}>
        <Text>set-tenant</Text>
      </TouchableOpacity>
    </>
  );
}

type WrapperProps = PropsWithChildren<{
  authUserId?: string | null;
}>;

function Wrapper({ children, authUserId }: WrapperProps) {
  return <TenantProvider authUserId={authUserId}>{children}</TenantProvider>;
}

describe("TenantProvider", () => {
  it("clears tenant context when auth user changes", () => {
    const { rerender } = render(
      <Wrapper authUserId="user-a">
        <TenantProbe />
      </Wrapper>
    );

    fireEvent.press(screen.getByText("set-tenant"));
    expect(screen.getByText("tenant:tenant-a")).toBeTruthy();

    rerender(
      <Wrapper authUserId="user-b">
        <TenantProbe />
      </Wrapper>
    );

    expect(screen.getByText("tenant:none")).toBeTruthy();
  });

  it("clears tenant context when auth user signs out", () => {
    const { rerender } = render(
      <Wrapper authUserId="user-a">
        <TenantProbe />
      </Wrapper>
    );

    fireEvent.press(screen.getByText("set-tenant"));
    expect(screen.getByText("tenant:tenant-a")).toBeTruthy();

    rerender(
      <Wrapper authUserId={null}>
        <TenantProbe />
      </Wrapper>
    );

    expect(screen.getByText("tenant:none")).toBeTruthy();
  });
});
