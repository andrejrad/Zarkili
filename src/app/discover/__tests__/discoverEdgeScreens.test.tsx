/**
 * discoverEdgeScreens.test.tsx — W30 Batch J discover edge screens.
 * J.8 SearchHelpersScreen / SearchSortSheet
 * J.9 NearMeSalonMapScreen
 * J.10 SalonActionsSheet
 */

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";

import {
  SearchHelpersScreen,
  SearchSortSheet,
} from "../SearchHelpersScreen";
import { NearMeSalonMapScreen } from "../NearMeSalonMapScreen";
import { SalonActionsSheet } from "../SalonActionsSheet";

// ---------------------------------------------------------------------------
// J.8 — SearchHelpersScreen
// ---------------------------------------------------------------------------

describe("SearchHelpersScreen", () => {
  it("renders recent and saved searches in default state", () => {
    const { getByTestId } = render(
      <SearchHelpersScreen
        recentSearches={["Haircut near me", "Brow shaping"]}
        savedSearches={[{ id: "ss1", label: "Nail salons" }]}
        onSelectRecent={jest.fn()}
        onSelectSaved={jest.fn()}
        onSelectSuggestion={jest.fn()}
        onRemoveRecent={jest.fn()}
        onRemoveSaved={jest.fn()}
        onClearAllRecents={jest.fn()}
        testID="sh"
      />,
    );
    expect(getByTestId("sh-recent-Haircut near me")).toBeTruthy();
    expect(getByTestId("sh-saved-ss1")).toBeTruthy();
    expect(getByTestId("sh-clear-all")).toBeTruthy();
  });

  it("calls onClearAllRecents", () => {
    const onClear = jest.fn();
    const { getByTestId } = render(
      <SearchHelpersScreen
        recentSearches={["Something"]}
        savedSearches={[]}
        onSelectRecent={jest.fn()}
        onSelectSaved={jest.fn()}
        onSelectSuggestion={jest.fn()}
        onRemoveRecent={jest.fn()}
        onRemoveSaved={jest.fn()}
        onClearAllRecents={onClear}
        testID="sh"
      />,
    );
    fireEvent.press(getByTestId("sh-clear-all"));
    expect(onClear).toHaveBeenCalled();
  });

  it("renders suggestions in typing state", () => {
    const { getByTestId } = render(
      <SearchHelpersScreen
        recentSearches={[]}
        savedSearches={[]}
        suggestions={["Hair salon", "Hair spa"]}
        query="hair"
        state="typing"
        onSelectRecent={jest.fn()}
        onSelectSaved={jest.fn()}
        onSelectSuggestion={jest.fn()}
        onRemoveRecent={jest.fn()}
        onRemoveSaved={jest.fn()}
        onClearAllRecents={jest.fn()}
        testID="sh"
      />,
    );
    expect(getByTestId("sh-suggestions")).toBeTruthy();
    expect(getByTestId("sh-sugg-Hair salon")).toBeTruthy();
  });

  it("renders no-results state with expand button", () => {
    const onExpand = jest.fn();
    const { getByTestId } = render(
      <SearchHelpersScreen
        recentSearches={[]}
        savedSearches={[]}
        query="xyzzy"
        state="no-results"
        onSelectRecent={jest.fn()}
        onSelectSaved={jest.fn()}
        onSelectSuggestion={jest.fn()}
        onRemoveRecent={jest.fn()}
        onRemoveSaved={jest.fn()}
        onClearAllRecents={jest.fn()}
        onExpandSearch={onExpand}
        testID="sh"
      />,
    );
    expect(getByTestId("sh-no-results")).toBeTruthy();
    fireEvent.press(getByTestId("sh-expand"));
    expect(onExpand).toHaveBeenCalled();
  });

  it("renders empty state when no recents or saved", () => {
    const { getByTestId } = render(
      <SearchHelpersScreen
        recentSearches={[]}
        savedSearches={[]}
        onSelectRecent={jest.fn()}
        onSelectSaved={jest.fn()}
        onSelectSuggestion={jest.fn()}
        onRemoveRecent={jest.fn()}
        onRemoveSaved={jest.fn()}
        onClearAllRecents={jest.fn()}
        testID="sh"
      />,
    );
    expect(getByTestId("sh-empty")).toBeTruthy();
  });
});

describe("SearchSortSheet", () => {
  it("renders all sort options", () => {
    const { getByTestId } = render(
      <SearchSortSheet
        visible
        selected="recommended"
        onSelect={jest.fn()}
        onClose={jest.fn()}
        testID="sort"
      />,
    );
    expect(getByTestId("sort-sort-recommended")).toBeTruthy();
    expect(getByTestId("sort-sort-distance")).toBeTruthy();
    expect(getByTestId("sort-sort-rating")).toBeTruthy();
    expect(getByTestId("sort-sort-price-asc")).toBeTruthy();
  });

  it("calls onSelect when an option is tapped", () => {
    const onSelect = jest.fn();
    const { getByTestId } = render(
      <SearchSortSheet
        visible
        selected="recommended"
        onSelect={onSelect}
        onClose={jest.fn()}
        testID="sort"
      />,
    );
    fireEvent.press(getByTestId("sort-sort-rating"));
    expect(onSelect).toHaveBeenCalledWith("rating");
  });
});

// ---------------------------------------------------------------------------
// J.9 — NearMeSalonMapScreen
// ---------------------------------------------------------------------------

const MAP_PINS = [
  { id: "p1", name: "Glow Studio", rating: 4.8, reviewCount: 120, distanceMiles: 0.4 },
  { id: "p2", name: "Cluster", rating: 4.5, reviewCount: 88, clusterCount: 5 },
];

describe("NearMeSalonMapScreen", () => {
  it("renders map area in granted state", () => {
    const { getByTestId } = render(
      <NearMeSalonMapScreen
        locationState="granted"
        pins={MAP_PINS}
        onSelectPin={jest.fn()}
        onRequestLocation={jest.fn()}
        onEnterZip={jest.fn()}
        testID="map"
      />,
    );
    expect(getByTestId("map-map")).toBeTruthy();
    expect(getByTestId("map-pin-p1")).toBeTruthy();
    expect(getByTestId("map-pin-p2")).toBeTruthy();
  });

  it("renders cluster with count > 1", () => {
    const { getByTestId } = render(
      <NearMeSalonMapScreen
        locationState="granted"
        pins={MAP_PINS}
        onSelectPin={jest.fn()}
        onRequestLocation={jest.fn()}
        onEnterZip={jest.fn()}
        testID="map"
      />,
    );
    expect(getByTestId("map-cluster-p2")).toBeTruthy();
  });

  it("renders single pin (no cluster) for single salon", () => {
    const { getByTestId } = render(
      <NearMeSalonMapScreen
        locationState="granted"
        pins={[MAP_PINS[0]]}
        onSelectPin={jest.fn()}
        onRequestLocation={jest.fn()}
        onEnterZip={jest.fn()}
        testID="map"
      />,
    );
    expect(getByTestId("map-cluster-p1")).toBeTruthy();
  });

  it("renders location-denied overlay", () => {
    const onRequest = jest.fn();
    const { getByTestId } = render(
      <NearMeSalonMapScreen
        locationState="denied"
        onSelectPin={jest.fn()}
        onRequestLocation={onRequest}
        onEnterZip={jest.fn()}
        testID="map"
      />,
    );
    expect(getByTestId("map-denied")).toBeTruthy();
    fireEvent.press(getByTestId("map-allow-location"));
    expect(onRequest).toHaveBeenCalled();
  });

  it("renders no-results-in-view banner", () => {
    const { getByTestId } = render(
      <NearMeSalonMapScreen
        locationState="no-results-in-view"
        pins={[]}
        onSelectPin={jest.fn()}
        onRequestLocation={jest.fn()}
        onEnterZip={jest.fn()}
        testID="map"
      />,
    );
    expect(getByTestId("map-no-results")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// J.10 — SalonActionsSheet
// ---------------------------------------------------------------------------

describe("SalonActionsSheet", () => {
  it("renders all core actions in default state", () => {
    const { getByTestId } = render(
      <SalonActionsSheet
        visible
        salonName="Glow Studio"
        onClose={jest.fn()}
        onBlock={jest.fn()}
        onReport={jest.fn()}
        testID="sa"
      />,
    );
    expect(getByTestId("sa-body")).toBeTruthy();
    expect(getByTestId("sa-directions")).toBeTruthy();
    expect(getByTestId("sa-share")).toBeTruthy();
    expect(getByTestId("sa-report")).toBeTruthy();
    expect(getByTestId("sa-block")).toBeTruthy();
  });

  it("expands hours panel when hours-toggle pressed", () => {
    const { getByTestId } = render(
      <SalonActionsSheet
        visible
        salonName="Glow Studio"
        hours={[
          { day: "Monday", hours: "9 AM – 6 PM" },
          { day: "Sunday", hours: "Closed" },
        ]}
        onClose={jest.fn()}
        onBlock={jest.fn()}
        onReport={jest.fn()}
        testID="sa"
      />,
    );
    fireEvent.press(getByTestId("sa-hours-toggle"));
    expect(getByTestId("sa-hours-panel")).toBeTruthy();
  });

  it("shows report form when report is tapped", () => {
    const { getByTestId } = render(
      <SalonActionsSheet
        visible
        salonName="Glow Studio"
        onClose={jest.fn()}
        onBlock={jest.fn()}
        onReport={jest.fn()}
        testID="sa"
      />,
    );
    fireEvent.press(getByTestId("sa-report"));
    expect(getByTestId("sa-report-form")).toBeTruthy();
  });

  it("submits report and shows reported toast", () => {
    const onReport = jest.fn();
    const { getByTestId } = render(
      <SalonActionsSheet
        visible
        salonName="Glow Studio"
        onClose={jest.fn()}
        onBlock={jest.fn()}
        onReport={onReport}
        testID="sa"
      />,
    );
    fireEvent.press(getByTestId("sa-report"));
    fireEvent.changeText(getByTestId("sa-report-input"), "Spam");
    fireEvent.press(getByTestId("sa-report-submit"));
    expect(onReport).toHaveBeenCalledWith("Spam");
    expect(getByTestId("sa-reported-toast")).toBeTruthy();
  });
});
