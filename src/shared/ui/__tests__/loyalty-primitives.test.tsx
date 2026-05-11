/**
 * loyalty-primitives.test.tsx
 * Tests for W25 Batch E shared-UI primitives:
 *   ProgressRing, TierBadge, RewardCard, RatingSelector, PhotoUploadTile
 */

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";

import { ProgressRing, TierBadge, RewardCard, RatingSelector, PhotoUploadTile } from "../index";

/* ─────────────────────── ProgressRing ─────────────────────── */
describe("ProgressRing", () => {
  it("renders with default props", () => {
    const { getByRole } = render(<ProgressRing progress={0.5} testID="pr" />);
    expect(getByRole("progressbar")).toBeTruthy();
  });

  it("sets accessibilityValue.now from progress", () => {
    const { getByRole } = render(<ProgressRing progress={0.75} testID="pr" />);
    const el = getByRole("progressbar");
    expect(el.props.accessibilityValue.now).toBe(75);
  });

  it("renders center label and sub-label", () => {
    const { getByText } = render(
      <ProgressRing progress={0.4} centerLabel="400" centerSubLabel="pts" testID="pr" />,
    );
    expect(getByText("400")).toBeTruthy();
    expect(getByText("pts")).toBeTruthy();
  });

  it("shows loading indicator in loading state", () => {
    const { getByTestId } = render(
      <ProgressRing progress={0} state="loading" testID="pr" />,
    );
    // In loading state a spinner element is rendered
    expect(getByTestId("pr-loading")).toBeTruthy();
  });

  it("shows error glyph in error state", () => {
    const { getByTestId } = render(
      <ProgressRing progress={0} state="error" testID="pr" />,
    );
    expect(getByTestId("pr-error")).toBeTruthy();
  });
});

/* ─────────────────────── TierBadge ─────────────────────── */
describe("TierBadge", () => {
  it("renders tier label text", () => {
    const { getByText } = render(<TierBadge tier="gold" />);
    expect(getByText("Gold")).toBeTruthy();
  });

  it("renders locked badge", () => {
    const { getByText } = render(<TierBadge tier="locked" />);
    expect(getByText(/locked/i)).toBeTruthy();
  });

  it("calls onPress when interactive", () => {
    const onPress = jest.fn();
    const { getByRole } = render(<TierBadge tier="bronze" interactive onPress={onPress} />);
    fireEvent.press(getByRole("button"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("renders as text when not interactive", () => {
    const { queryByRole } = render(<TierBadge tier="silver" />);
    // Non-interactive badge must NOT expose a button accessible role
    expect(queryByRole("button")).toBeNull();
  });

  it("renders platinum label", () => {
    const { getByText } = render(<TierBadge tier="platinum" />);
    expect(getByText("Platinum")).toBeTruthy();
  });
});

/* ─────────────────────── RewardCard ─────────────────────── */
describe("RewardCard", () => {
  it("renders title and points cost", () => {
    const { getByText } = render(
      <RewardCard title="Free Coffee" points={200} imageAlt="coffee" state="unlocked" testID="rc" />,
    );
    expect(getByText("Free Coffee")).toBeTruthy();
    expect(getByText(/200/)).toBeTruthy();
  });

  it("fires onPress when unlocked", () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <RewardCard title="Free Coffee" points={200} state="unlocked" onPress={onPress} testID="rc" />,
    );
    fireEvent.press(getByTestId("rc"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("shows locked overlay for locked state", () => {
    const { getByTestId } = render(
      <RewardCard title="Locked Reward" points={1000} state="locked" testID="rc" />,
    );
    expect(getByTestId("rc-locked-overlay")).toBeTruthy();
  });

  it("shows redeemed badge for redeemed state", () => {
    const { getByTestId } = render(
      <RewardCard title="Used Reward" points={500} state="redeemed" testID="rc" />,
    );
    expect(getByTestId("rc-redeemed-badge")).toBeTruthy();
  });

  it("renders compact variant without crashing", () => {
    const { getByText } = render(
      <RewardCard title="Compact Reward" points={100} state="unlocked" compact testID="rc" />,
    );
    expect(getByText("Compact Reward")).toBeTruthy();
  });
});

/* ─────────────────────── RatingSelector ─────────────────────── */
describe("RatingSelector", () => {
  it("renders 5 stars", () => {
    const { getByTestId } = render(
      <RatingSelector value={0} onChange={jest.fn()} testID="rs" />,
    );
    // Stars are hidden from accessibility tree but accessible by testID
    for (let i = 1; i <= 5; i++) {
      expect(getByTestId(`rs-star-${i}`)).toBeTruthy();
    }
  });

  it("calls onChange when a star is pressed", () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <RatingSelector value={0} onChange={onChange} testID="rs" />,
    );
    fireEvent.press(getByTestId("rs-star-3"));
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it("clears rating when same star is tapped again", () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <RatingSelector value={3} onChange={onChange} testID="rs" />,
    );
    fireEvent.press(getByTestId("rs-star-3"));
    expect(onChange).toHaveBeenCalledWith(0);
  });

  it("shows error text in error state", () => {
    const { getByText } = render(
      <RatingSelector value={0} onChange={jest.fn()} state="error" errorText="Required" testID="rs" />,
    );
    expect(getByText("Required")).toBeTruthy();
  });

  it("disabled state prevents interaction", () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <RatingSelector value={0} onChange={onChange} state="disabled" testID="rs" />,
    );
    expect(getByTestId("rs").props.accessibilityState?.disabled).toBe(true);
  });
});

/* ─────────────────────── PhotoUploadTile ─────────────────────── */
describe("PhotoUploadTile", () => {
  it("renders in empty state without crashing", () => {
    const { getByTestId } = render(<PhotoUploadTile state="empty" testID="put" />);
    expect(getByTestId("put")).toBeTruthy();
  });

  it("calls onPress when empty tile is pressed", () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <PhotoUploadTile state="empty" onPress={onPress} testID="put" />,
    );
    fireEvent.press(getByTestId("put"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("calls onRemove when remove button is pressed in filled state", () => {
    const onRemove = jest.fn();
    const { getByTestId } = render(
      <PhotoUploadTile state="filled" onRemove={onRemove} testID="put" />,
    );
    fireEvent.press(getByTestId("put-remove"));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("shows max-reached state message", () => {
    const { getByText } = render(<PhotoUploadTile state="max-reached" testID="put" />);
    expect(getByText(/Max/i)).toBeTruthy();
  });

  it("shows uploading state as progressbar", () => {
    const { getByRole } = render(<PhotoUploadTile state="uploading" testID="put" />);
    expect(getByRole("progressbar")).toBeTruthy();
  });
});
