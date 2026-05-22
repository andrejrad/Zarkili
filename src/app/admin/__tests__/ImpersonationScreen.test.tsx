import { render, screen, fireEvent } from "@testing-library/react-native";

import { ImpersonationScreen } from "../ImpersonationScreen";
import type { ImpersonationSession } from "../platformAdminTypes";

function makeSession(overrides: Partial<ImpersonationSession> = {}): ImpersonationSession {
  return {
    sessionId: "sess-1",
    platformAdminId: "admin-1",
    targetTenantId: "tenant-abc",
    targetUserId: "user-xyz",
    targetUserEmail: "user@example.com",
    reason: "Investigating payment failure for client support ticket #1234",
    startedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    active: true,
    ...overrides,
  };
}

const noop = () => undefined;

describe("ImpersonationScreen — idle form", () => {
  it("renders tenant, user, reason fields and the acknowledgement checkbox", () => {
    render(
      <ImpersonationScreen
        loading={false}
        error={null}
        activeSession={null}
        onStartImpersonation={noop}
        onEndImpersonation={noop}
      />
    );
    expect(screen.getByTestId("impersonation-screen-tenant-id-input")).toBeTruthy();
    expect(screen.getByTestId("impersonation-screen-user-id-input")).toBeTruthy();
    expect(screen.getByTestId("impersonation-screen-reason-input")).toBeTruthy();
    expect(screen.getByTestId("impersonation-screen-acknowledge")).toBeTruthy();
    expect(screen.getByTestId("impersonation-screen-start-btn")).toBeTruthy();
  });

  it("Start button is disabled when form is empty", () => {
    render(
      <ImpersonationScreen
        loading={false}
        error={null}
        activeSession={null}
        onStartImpersonation={noop}
        onEndImpersonation={noop}
      />
    );
    expect(screen.getByTestId("impersonation-screen-start-btn").props.accessibilityState?.disabled).toBe(true);
  });

  it("Start button stays disabled with valid ids + reason but no acknowledgement", () => {
    render(
      <ImpersonationScreen
        loading={false}
        error={null}
        activeSession={null}
        onStartImpersonation={noop}
        onEndImpersonation={noop}
      />
    );
    fireEvent.changeText(screen.getByTestId("impersonation-screen-tenant-id-input"), "tenant-abc");
    fireEvent.changeText(screen.getByTestId("impersonation-screen-user-id-input"), "user-xyz");
    fireEvent.changeText(
      screen.getByTestId("impersonation-screen-reason-input"),
      "Investigating payment failure for support ticket"
    );
    expect(screen.getByTestId("impersonation-screen-start-btn").props.accessibilityState?.disabled).toBe(true);
  });

  it("Start button stays disabled when reason is too short", () => {
    render(
      <ImpersonationScreen
        loading={false}
        error={null}
        activeSession={null}
        onStartImpersonation={noop}
        onEndImpersonation={noop}
      />
    );
    fireEvent.changeText(screen.getByTestId("impersonation-screen-tenant-id-input"), "tenant-abc");
    fireEvent.changeText(screen.getByTestId("impersonation-screen-user-id-input"), "user-xyz");
    fireEvent.changeText(screen.getByTestId("impersonation-screen-reason-input"), "short");
    fireEvent.press(screen.getByTestId("impersonation-screen-acknowledge"));
    expect(screen.getByTestId("impersonation-screen-start-btn").props.accessibilityState?.disabled).toBe(true);
  });

  it("shows inline validation error when reason is non-empty but under 10 chars", () => {
    render(
      <ImpersonationScreen
        loading={false}
        error={null}
        activeSession={null}
        onStartImpersonation={noop}
        onEndImpersonation={noop}
      />
    );
    fireEvent.changeText(screen.getByTestId("impersonation-screen-reason-input"), "short");
    expect(screen.getByTestId("impersonation-screen-reason-error")).toBeTruthy();
  });

  it("enables Start button and calls onStartImpersonation with trimmed args on happy path", () => {
    const onStart = jest.fn();
    render(
      <ImpersonationScreen
        loading={false}
        error={null}
        activeSession={null}
        onStartImpersonation={onStart}
        onEndImpersonation={noop}
      />
    );
    fireEvent.changeText(screen.getByTestId("impersonation-screen-tenant-id-input"), "  tenant-abc  ");
    fireEvent.changeText(screen.getByTestId("impersonation-screen-user-id-input"), "  user-xyz  ");
    fireEvent.changeText(
      screen.getByTestId("impersonation-screen-reason-input"),
      "  Investigating payment failure for support ticket  "
    );
    fireEvent.press(screen.getByTestId("impersonation-screen-acknowledge"));

    expect(screen.getByTestId("impersonation-screen-start-btn").props.accessibilityState?.disabled).toBe(false);

    fireEvent.press(screen.getByTestId("impersonation-screen-start-btn"));
    expect(onStart).toHaveBeenCalledWith(
      "tenant-abc",
      "user-xyz",
      "Investigating payment failure for support ticket"
    );
  });

  it("pre-fills tenantId from defaultTenantId prop", () => {
    render(
      <ImpersonationScreen
        defaultTenantId="pre-filled-tenant"
        loading={false}
        error={null}
        activeSession={null}
        onStartImpersonation={noop}
        onEndImpersonation={noop}
      />
    );
    expect(screen.getByTestId("impersonation-screen-tenant-id-input").props.value).toBe("pre-filled-tenant");
  });

  it("displays error banner when error prop is set", () => {
    render(
      <ImpersonationScreen
        loading={false}
        error="Failed to start impersonation."
        activeSession={null}
        onStartImpersonation={noop}
        onEndImpersonation={noop}
      />
    );
    expect(screen.getByTestId("impersonation-screen-error")).toBeTruthy();
  });
});

describe("ImpersonationScreen — active session", () => {
  it("shows active session banner with tenant and user info", () => {
    render(
      <ImpersonationScreen
        loading={false}
        error={null}
        activeSession={makeSession()}
        onStartImpersonation={noop}
        onEndImpersonation={noop}
      />
    );
    expect(screen.getByTestId("impersonation-screen-active-banner")).toBeTruthy();
    expect(screen.getByTestId("impersonation-screen-end-session")).toBeTruthy();
  });

  it("calls onEndImpersonation when End Session is pressed", () => {
    const onEnd = jest.fn();
    render(
      <ImpersonationScreen
        loading={false}
        error={null}
        activeSession={makeSession()}
        onStartImpersonation={noop}
        onEndImpersonation={onEnd}
      />
    );
    fireEvent.press(screen.getByTestId("impersonation-screen-end-session"));
    expect(onEnd).toHaveBeenCalledTimes(1);
  });
});

describe("ImpersonationScreen — loading state", () => {
  it("renders loading indicator when loading=true", () => {
    render(
      <ImpersonationScreen
        loading={true}
        error={null}
        activeSession={null}
        onStartImpersonation={noop}
        onEndImpersonation={noop}
      />
    );
    expect(screen.getByTestId("impersonation-screen-loading")).toBeTruthy();
  });
});
