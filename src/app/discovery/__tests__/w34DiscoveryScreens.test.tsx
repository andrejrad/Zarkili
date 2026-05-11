/**
 * w34DiscoveryScreens.test.tsx — W34 Stream B.
 *
 * Smoke tests for the 8 W22 discovery screens. Verifies render, prop
 * rendering, and key interaction handlers. Real data integration is deferred
 * to Phase 2.3.
 */

import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

import { DiscoverHomeScreen } from "../DiscoverHomeScreen";
import { DiscoverFeedScreen } from "../DiscoverFeedScreen";
import { ExploreResultsScreen } from "../ExploreResultsScreen";
import { ExploreMapScreen } from "../ExploreMapScreen";
import { DiscoverFiltersScreen } from "../DiscoverFiltersScreen";
import { SalonProfileScreen } from "../SalonProfileScreen";
import { ServiceDetailScreen } from "../ServiceDetailScreen";
import { StaffDetailScreen } from "../StaffDetailScreen";
import {
  DEFAULT_DISCOVERY_FILTERS,
  type DiscoveryCategory,
  type DiscoveryFeedPost,
  type DiscoveryFilters,
  type FeaturedSalon,
  type SalonProfile,
  type SalonReviewSnippet,
  type SalonServiceSummary,
  type SalonStaffSummary,
} from "../discoveryHelpers";

const CATEGORIES: DiscoveryCategory[] = [
  { id: "hair", label: "Hair" },
  { id: "nails", label: "Nails" },
];

const FEATURED: FeaturedSalon[] = [
  { id: "s1", name: "Demo Salon", city: "SF", rating: 4.8, reviewCount: 100, distanceMiles: 1.0 },
  { id: "s2", name: "Glow", city: "Oakland", rating: 4.5, reviewCount: 50 },
];

const POSTS: DiscoveryFeedPost[] = [
  {
    id: "p1",
    salonId: "s1",
    salonName: "Demo Salon",
    caption: "New menu",
    likeCount: 5,
    postedAt: "1h",
  },
];

const SALON_PROFILE: SalonProfile = {
  id: "s1",
  name: "Demo Salon",
  city: "SF",
  addressLine: "123 Demo",
  rating: 4.8,
  reviewCount: 100,
  description: "Demo description",
};

const SERVICES: SalonServiceSummary[] = [
  { id: "svc1", name: "Cut", durationMinutes: 60, priceCents: 8500 },
];

const STAFF: SalonStaffSummary[] = [{ id: "st1", name: "Alex", role: "Stylist", rating: 4.9 }];

const REVIEWS: SalonReviewSnippet[] = [
  { id: "r1", authorName: "Jordan", rating: 5, text: "Loved it", postedAt: "Apr 22" },
];

// ---------------------------------------------------------------------------
// DiscoverHomeScreen
// ---------------------------------------------------------------------------

describe("DiscoverHomeScreen", () => {
  it("renders categories and featured salons", () => {
    const { getByText, getByTestId } = render(
      <DiscoverHomeScreen
        featuredSalons={FEATURED}
        categories={CATEGORIES}
        onSelectSalon={jest.fn()}
        onSelectCategory={jest.fn()}
      />,
    );
    expect(getByTestId("discover-home")).toBeTruthy();
    expect(getByText("Hair")).toBeTruthy();
    expect(getByText("Demo Salon")).toBeTruthy();
  });

  it("invokes onSelectCategory when a chip is pressed", () => {
    const onSelectCategory = jest.fn();
    const { getByTestId } = render(
      <DiscoverHomeScreen
        featuredSalons={FEATURED}
        categories={CATEGORIES}
        onSelectSalon={jest.fn()}
        onSelectCategory={onSelectCategory}
      />,
    );
    fireEvent.press(getByTestId("discover-home-category-hair"));
    expect(onSelectCategory).toHaveBeenCalledWith("hair");
  });

  it("invokes onSelectSalon when a salon card is pressed", () => {
    const onSelectSalon = jest.fn();
    const { getByTestId } = render(
      <DiscoverHomeScreen
        featuredSalons={FEATURED}
        categories={CATEGORIES}
        onSelectSalon={onSelectSalon}
        onSelectCategory={jest.fn()}
      />,
    );
    fireEvent.press(getByTestId("discover-home-salon-s1"));
    expect(onSelectSalon).toHaveBeenCalledWith("s1");
  });
});

// ---------------------------------------------------------------------------
// DiscoverFeedScreen
// ---------------------------------------------------------------------------

describe("DiscoverFeedScreen", () => {
  it("renders posts and filter chips", () => {
    const { getByTestId, getByText } = render(
      <DiscoverFeedScreen
        posts={POSTS}
        activeFilter="all"
        onFilterChange={jest.fn()}
        onSelectPost={jest.fn()}
        onSelectSalon={jest.fn()}
      />,
    );
    expect(getByTestId("discover-feed")).toBeTruthy();
    expect(getByText("New menu")).toBeTruthy();
  });

  it("calls onFilterChange when a non-active filter is pressed", () => {
    const onFilterChange = jest.fn();
    const { getByTestId } = render(
      <DiscoverFeedScreen
        posts={POSTS}
        activeFilter="all"
        onFilterChange={onFilterChange}
        onSelectPost={jest.fn()}
        onSelectSalon={jest.fn()}
      />,
    );
    fireEvent.press(getByTestId("discover-feed-filter-trending"));
    expect(onFilterChange).toHaveBeenCalledWith("trending");
  });

  it("calls onSelectPost when post body is tapped", () => {
    const onSelectPost = jest.fn();
    const { getByTestId } = render(
      <DiscoverFeedScreen
        posts={POSTS}
        activeFilter="all"
        onFilterChange={jest.fn()}
        onSelectPost={onSelectPost}
        onSelectSalon={jest.fn()}
      />,
    );
    fireEvent.press(getByTestId("discover-feed-post-p1"));
    expect(onSelectPost).toHaveBeenCalledWith("p1");
  });
});

// ---------------------------------------------------------------------------
// ExploreResultsScreen
// ---------------------------------------------------------------------------

describe("ExploreResultsScreen", () => {
  it("renders results and the filter summary", () => {
    const { getByTestId, getByText } = render(
      <ExploreResultsScreen
        query="balayage"
        results={FEATURED}
        filters={DEFAULT_DISCOVERY_FILTERS}
        onSelectSalon={jest.fn()}
        onChangeFilters={jest.fn()}
      />,
    );
    expect(getByTestId("explore-results")).toBeTruthy();
    expect(getByText(/balayage/i)).toBeTruthy();
    expect(getByTestId("explore-results-filter-summary")).toBeTruthy();
  });

  it("renders empty state when no results", () => {
    const { getByTestId } = render(
      <ExploreResultsScreen
        query=""
        results={[]}
        filters={DEFAULT_DISCOVERY_FILTERS}
        onSelectSalon={jest.fn()}
        onChangeFilters={jest.fn()}
      />,
    );
    expect(getByTestId("explore-results-empty")).toBeTruthy();
  });

  it("invokes onChangeFilters when Filters button pressed", () => {
    const onChangeFilters = jest.fn();
    const { getByTestId } = render(
      <ExploreResultsScreen
        query=""
        results={FEATURED}
        filters={DEFAULT_DISCOVERY_FILTERS}
        onSelectSalon={jest.fn()}
        onChangeFilters={onChangeFilters}
      />,
    );
    fireEvent.press(getByTestId("explore-results-filters-cta"));
    expect(onChangeFilters).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// ExploreMapScreen
// ---------------------------------------------------------------------------

describe("ExploreMapScreen", () => {
  it("renders the map view and pin list", () => {
    const { getByTestId } = render(
      <ExploreMapScreen
        results={FEATURED}
        selectedSalonId={null}
        onSelectSalon={jest.fn()}
        onPressBack={jest.fn()}
      />,
    );
    expect(getByTestId("explore-map-mapview")).toBeTruthy();
    expect(getByTestId("explore-map-pin-s1")).toBeTruthy();
  });

  it("calls onSelectSalon on pin tap", () => {
    const onSelectSalon = jest.fn();
    const { getByTestId } = render(
      <ExploreMapScreen
        results={FEATURED}
        selectedSalonId={null}
        onSelectSalon={onSelectSalon}
        onPressBack={jest.fn()}
      />,
    );
    fireEvent.press(getByTestId("explore-map-pin-s1"));
    expect(onSelectSalon).toHaveBeenCalledWith("s1");
  });

  it("calls onPressBack on Back button", () => {
    const onPressBack = jest.fn();
    const { getByTestId } = render(
      <ExploreMapScreen
        results={FEATURED}
        selectedSalonId={null}
        onSelectSalon={jest.fn()}
        onPressBack={onPressBack}
      />,
    );
    fireEvent.press(getByTestId("explore-map-back"));
    expect(onPressBack).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// DiscoverFiltersScreen
// ---------------------------------------------------------------------------

describe("DiscoverFiltersScreen", () => {
  function renderFilters(overrides: Partial<DiscoveryFilters> = {}) {
    const onChange = jest.fn();
    const onApply = jest.fn();
    const onReset = jest.fn();
    const utils = render(
      <DiscoverFiltersScreen
        filters={{ ...DEFAULT_DISCOVERY_FILTERS, ...overrides }}
        categories={CATEGORIES}
        onChange={onChange}
        onApply={onApply}
        onReset={onReset}
      />,
    );
    return { ...utils, onChange, onApply, onReset };
  }

  it("renders all filter sections", () => {
    const { getByTestId } = renderFilters();
    expect(getByTestId("discover-filters")).toBeTruthy();
    expect(getByTestId("discover-filters-rating-4")).toBeTruthy();
    expect(getByTestId("discover-filters-price-2")).toBeTruthy();
    expect(getByTestId("discover-filters-category-hair")).toBeTruthy();
  });

  it("toggles price level via onChange", () => {
    const { getByTestId, onChange } = renderFilters();
    fireEvent.press(getByTestId("discover-filters-price-2"));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ priceLevels: [2] }),
    );
  });

  it("invokes onApply and onReset", () => {
    const { getByTestId, onApply, onReset } = renderFilters();
    fireEvent.press(getByTestId("discover-filters-apply"));
    fireEvent.press(getByTestId("discover-filters-reset"));
    expect(onApply).toHaveBeenCalled();
    expect(onReset).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// SalonProfileScreen
// ---------------------------------------------------------------------------

describe("SalonProfileScreen", () => {
  function renderProfile() {
    const onSelectService = jest.fn();
    const onSelectStaff = jest.fn();
    const onBook = jest.fn();
    const onBack = jest.fn();
    const utils = render(
      <SalonProfileScreen
        salon={SALON_PROFILE}
        services={SERVICES}
        staff={STAFF}
        reviews={REVIEWS}
        onSelectService={onSelectService}
        onSelectStaff={onSelectStaff}
        onBook={onBook}
        onBack={onBack}
      />,
    );
    return { ...utils, onSelectService, onSelectStaff, onBook, onBack };
  }

  it("renders salon name, services, staff and reviews", () => {
    const { getByTestId, getByText } = renderProfile();
    expect(getByTestId("salon-profile")).toBeTruthy();
    expect(getByText("Demo Salon")).toBeTruthy();
    expect(getByText("Cut")).toBeTruthy();
    expect(getByText("Alex")).toBeTruthy();
    expect(getByText(/Loved it/)).toBeTruthy();
  });

  it("invokes onBook and onBack handlers", () => {
    const { getByTestId, onBook, onBack } = renderProfile();
    fireEvent.press(getByTestId("salon-profile-book"));
    fireEvent.press(getByTestId("salon-profile-back"));
    expect(onBook).toHaveBeenCalled();
    expect(onBack).toHaveBeenCalled();
  });

  it("forwards service and staff selection ids", () => {
    const { getByTestId, onSelectService, onSelectStaff } = renderProfile();
    fireEvent.press(getByTestId("salon-profile-service-svc1"));
    fireEvent.press(getByTestId("salon-profile-staff-st1"));
    expect(onSelectService).toHaveBeenCalledWith("svc1");
    expect(onSelectStaff).toHaveBeenCalledWith("st1");
  });
});

// ---------------------------------------------------------------------------
// ServiceDetailScreen
// ---------------------------------------------------------------------------

describe("ServiceDetailScreen", () => {
  it("renders service details and CTAs", () => {
    const onBook = jest.fn();
    const onBack = jest.fn();
    const { getByTestId, getByText } = render(
      <ServiceDetailScreen
        service={{ ...SERVICES[0], description: "Premium" }}
        salon={SALON_PROFILE}
        onBook={onBook}
        onBack={onBack}
      />,
    );
    expect(getByTestId("service-detail")).toBeTruthy();
    expect(getByText("Cut")).toBeTruthy();
    expect(getByText("Premium")).toBeTruthy();
    fireEvent.press(getByTestId("service-detail-book"));
    fireEvent.press(getByTestId("service-detail-back"));
    expect(onBook).toHaveBeenCalled();
    expect(onBack).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// StaffDetailScreen
// ---------------------------------------------------------------------------

describe("StaffDetailScreen", () => {
  it("renders staff and services and CTAs", () => {
    const onSelectService = jest.fn();
    const onBook = jest.fn();
    const onBack = jest.fn();
    const { getByTestId, getByText } = render(
      <StaffDetailScreen
        staff={{ ...STAFF[0], bio: "10y experience", salonName: "Demo Salon" }}
        services={SERVICES}
        onSelectService={onSelectService}
        onBook={onBook}
        onBack={onBack}
      />,
    );
    expect(getByTestId("staff-detail")).toBeTruthy();
    expect(getByText("Alex")).toBeTruthy();
    expect(getByText("10y experience")).toBeTruthy();
    fireEvent.press(getByTestId("staff-detail-service-svc1"));
    fireEvent.press(getByTestId("staff-detail-book"));
    fireEvent.press(getByTestId("staff-detail-back"));
    expect(onSelectService).toHaveBeenCalledWith("svc1");
    expect(onBook).toHaveBeenCalled();
    expect(onBack).toHaveBeenCalled();
  });
});
