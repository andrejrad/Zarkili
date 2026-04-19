import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Text, TouchableOpacity } from "react-native";

import { LanguageProvider, useLanguage } from "../LanguageProvider";
import { TenantProvider, useTenant } from "../TenantProvider";

function LanguageProbe() {
  const { tenantId, setTenantId } = useTenant();
  const { language, setLanguage, setTenantDefaultLanguage, t } = useLanguage();

  return (
    <>
      <Text>tenant:{tenantId ?? "none"}</Text>
      <Text>language:{language}</Text>
      <Text>login-label:{t("action.login")}</Text>
      <TouchableOpacity accessibilityRole="button" onPress={() => setTenantId("tenant-a")}>
        <Text>set-tenant-a</Text>
      </TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" onPress={() => setTenantId("tenant-b")}>
        <Text>set-tenant-b</Text>
      </TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" onPress={() => setTenantDefaultLanguage("tenant-a", "hr")}>
        <Text>default-a-hr</Text>
      </TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" onPress={() => setTenantDefaultLanguage("tenant-b", "es")}>
        <Text>default-b-es</Text>
      </TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" onPress={() => setLanguage("es")}>
        <Text>override-current-es</Text>
      </TouchableOpacity>
    </>
  );
}

function Wrapper() {
  return (
    <TenantProvider>
      <LanguageProvider>
        <LanguageProbe />
      </LanguageProvider>
    </TenantProvider>
  );
}

describe("LanguageProvider", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("uses English fallback by default", async () => {
    render(<Wrapper />);

    await waitFor(() => {
      expect(screen.getByText("language:en")).toBeTruthy();
    });
    expect(screen.getByText("login-label:Login")).toBeTruthy();
  });

  it("applies tenant default language when no user override exists", async () => {
    render(<Wrapper />);

    fireEvent.press(screen.getByText("default-a-hr"));
    fireEvent.press(screen.getByText("set-tenant-a"));

    await waitFor(() => {
      expect(screen.getByText("tenant:tenant-a")).toBeTruthy();
      expect(screen.getByText("language:hr")).toBeTruthy();
      expect(screen.getByText("login-label:Prijava")).toBeTruthy();
    });
  });

  it("stores user override per tenant and restores it when switching back", async () => {
    render(<Wrapper />);

    fireEvent.press(screen.getByText("default-a-hr"));
    fireEvent.press(screen.getByText("default-b-es"));

    fireEvent.press(screen.getByText("set-tenant-a"));
    await waitFor(() => {
      expect(screen.getByText("language:hr")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("override-current-es"));
    await waitFor(() => {
      expect(screen.getByText("language:es")).toBeTruthy();
      expect(screen.getByText("login-label:Iniciar sesion")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("set-tenant-b"));
    await waitFor(() => {
      expect(screen.getByText("tenant:tenant-b")).toBeTruthy();
      expect(screen.getByText("language:es")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("set-tenant-a"));
    await waitFor(() => {
      expect(screen.getByText("tenant:tenant-a")).toBeTruthy();
      expect(screen.getByText("language:es")).toBeTruthy();
    });
  });
});
