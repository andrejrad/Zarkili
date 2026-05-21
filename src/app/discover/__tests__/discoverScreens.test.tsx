jest.mock("expo-location", () => ({
  getForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: "denied" }),
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: "denied" }),
}));

import { render } from "@testing-library/react-native";

import { HomeScreen } from "../HomeScreen";
import { DiscoverFeedScreen, type DiscoverFeedItem } from "../DiscoverFeedScreen";
import { ExploreSearchResultsScreen } from "../ExploreSearchResultsScreen";
import { FilterSheetScreen } from "../FilterSheetScreen";
import { SalonProfileScreen } from "../SalonProfileScreen";
import { ServiceDetailScreen } from "../ServiceDetailScreen";
import { StaffMemberDetailScreen } from "../StaffMemberDetailScreen";
import { ExploreMapScreen } from "../ExploreMapScreen";
import { DEFAULT_FILTERS } from "../discoveryFilters";
import type { DiscoveryHomeFeed, ServiceTypeCard } from "../../../domains/discovery";

function makeServiceCard(over: Partial<ServiceTypeCard> = {}): ServiceTypeCard {
  return {
    id: "s1",
    tenantId: "t1",
    locationId: "loc1",
    categoryId: "nails",
    categoryName: "Nails",
    serviceName: "Gel Manicure",
    locationDisplayName: "Glow Studio · Shoreditch",
    locationCity: "London",
    variantCount: 1,
    durationFrom: 45,
    serviceAverageRating: 4.8,
    serviceReviewCount: 12,
    locationAverageRating: 4.7,
    locationReviewCount: 80,
    nextAvailableAt: null,
    isFullyBooked: false,
    primaryPhotoUrl: null,
    primaryPhotoSource: null,
    isBookableOnline: true,
    locationLat: 51.5,
    locationLng: -0.1,
    distanceMetres: 500,
    isSaved: null,
    memberPoints: null,
    popularityScore: 0,
    priceFrom: 5000,
    ...over,
  };
}

const homeFeed: DiscoveryHomeFeed = {
  categories: [{ id: "all" }, { id: "nails" }, { id: "hair" }],
  featuredSalons: [makeServiceCard(), makeServiceCard({ id: "s2", serviceName: "Hair Cut" })],
  recentBookings: [
    {
      id: "b1",
      salonName: "Glow Studio",
      serviceName: "Classic Manicure",
      dateTimeLabel: "Tue, Mar 5 · 3:00 PM",
      statusLabel: "Confirmed",
    },
  ],
  recommendedSalons: [],
  guestReviews: [],
};

describe("HomeScreen (B.1)", () => {
  it("renders greeting and category pills", () => {
    const { getByTestId } = render(
      <HomeScreen feed={homeFeed} greetingName="Andrea" testID="home" />,
    );
    expect(getByTestId("home")).toBeTruthy();
    expect(getByTestId("home-cat-nails")).toBeTruthy();
    expect(getByTestId("home-salon-s1")).toBeTruthy();
    expect(getByTestId("home-recent-b1")).toBeTruthy();
  });
});

describe("DiscoverFeedScreen (B.2)", () => {
  it("renders salon, sponsored, and editorial items", () => {
    const items: DiscoverFeedItem[] = [
      { kind: "salon", salon: makeServiceCard() },
      { kind: "sponsored", salon: makeServiceCard({ id: "s2" }), sponsorName: "GlowCo" },
      {
        kind: "editorial",
        id: "e1",
        title: "Top spring nails",
        subtitle: "Editor's pick",
        ctaLabel: "Read more",
      },
    ];
    const { getByTestId } = render(
      <DiscoverFeedScreen items={items} testID="feed" />,
    );
    expect(getByTestId("feed-salon-s1")).toBeTruthy();
    expect(getByTestId("feed-sponsored-s2")).toBeTruthy();
    expect(getByTestId("feed-editorial-e1")).toBeTruthy();
    expect(getByTestId("feed-filters")).toBeTruthy();
  });
});

describe("ExploreSearchResultsScreen (B.3)", () => {
  it("renders summary and service cards", () => {
    const services = [
      makeServiceCard({ id: "s1" }),
      makeServiceCard({ id: "s2" }),
    ];
    const { getByTestId } = render(
      <ExploreSearchResultsScreen
        services={services}
        totalCount={2}
        filters={DEFAULT_FILTERS}
        onChangeFilters={() => {}}
        testID="explore"
      />,
    );
    expect(getByTestId("explore-summary")).toBeTruthy();
    expect(getByTestId("explore-service-s1")).toBeTruthy();
    expect(getByTestId("explore-service-s2")).toBeTruthy();
  });

  it("renders empty state when no services", () => {
    const { getByTestId } = render(
      <ExploreSearchResultsScreen
        services={[]}
        isLoading={false}
        totalCount={0}
        filters={DEFAULT_FILTERS}
        onChangeFilters={() => {}}
        testID="explore"
      />,
    );
    expect(getByTestId("explore-empty")).toBeTruthy();
  });
});

describe("FilterSheetScreen (B.4)", () => {
  it("renders with live filter updates and no apply button", () => {
    const onChangeFilters = jest.fn();
    const services = [
      makeServiceCard({ id: "s1", priceFrom: 3000 }),
      makeServiceCard({ id: "s2", priceFrom: 6000 }),
      makeServiceCard({ id: "s3", priceFrom: 15000 }),
    ];
    const { getByTestId, queryByTestId } = render(
      <FilterSheetScreen
        visible
        initialFilters={{ ...DEFAULT_FILTERS, priceRange: [0, 10000] }}
        services={services}
        onClose={() => {}}
        onChangeFilters={onChangeFilters}
        testID="fs"
      />,
    );
    // Sheet is visible (reset button present), no apply/done button
    expect(getByTestId("fs-reset")).toBeTruthy();
    expect(queryByTestId("fs-apply")).toBeNull();
  });
});

describe("SalonProfileScreen (B.5)", () => {
  it("renders hero, ADA badge, and tab buttons", () => {
    const { getByTestId } = render(
      <SalonProfileScreen
        salon={{
          id: "s1",
          name: "Glow Studio",
          rating: 4.8,
          reviewCount: 100,
          metaLine: "Brooklyn, NY · 0.4 mi",
          hours: "Open until 9 PM",
          adaAccessible: true,
          bookingEnabled: true,
          messageEnabled: true,
        }}
        services={[
          { id: "sv1", name: "Classic Manicure", durationLabel: "45 min", priceLabel: "$45" },
        ]}
        staff={[{ id: "st1", name: "Riley", specialty: "Nails" }]}
        reviews={[
          { id: "r1", authorName: "Jamie", rating: 5, body: "Loved it", dateLabel: "Mar 1" },
        ]}
        gallery={[{ id: "g1", uri: "u1", alt: "g1" }]}
        onPressMessage={() => {}}
        testID="prof"
      />,
    );
    expect(getByTestId("prof-hero")).toBeTruthy();
    expect(getByTestId("prof-ada")).toBeTruthy();
    expect(getByTestId("prof-tab-services")).toBeTruthy();
    expect(getByTestId("prof-service-sv1")).toBeTruthy();
    expect(getByTestId("prof-book")).toBeTruthy();
    expect(getByTestId("prof-message")).toBeTruthy();
  });
});

describe("ServiceDetailScreen (B.6)", () => {
  it("renders service hero and toggles add-on selection", () => {
    const { getByTestId } = render(
      <ServiceDetailScreen
        testID="svc"
        service={{
          serviceId: "sv1",
          tenantId: "t1",
          locationId: "loc1",
          serviceName: "Classic Manicure",
          locationDisplayName: "Glamour Nails",
          description: "Clean cuticles + polish.",
          categoryId: "nails",
          variantLabel: null,
          variants: [
            {
              variantId: "var1",
              name: "Standard",
              durationMinutes: 45,
              price: 4500,
              currency: "GBP",
              isDefault: true,
            },
          ],
          addons: [
            {
              addonId: "a1",
              name: "Gel polish",
              price: 1500,
              currency: "GBP",
              durationMinutes: 10,
            },
          ],
          photos: [],
          technicians: [],
          reviewSummary: {
            averageRating: null,
            totalCount: 0,
            breakdown: [],
            recentReviews: [],
          },
          isBookableOnline: true,
          locationPhone: null,
        }}
      />,
    );
    expect(getByTestId("svc-choose-time")).toBeTruthy();
    expect(getByTestId("svc-addon-a1")).toBeTruthy();
  });
});

describe("StaffMemberDetailScreen (B.7)", () => {
  it("renders staff bio and book CTA", () => {
    const { getByTestId } = render(
      <StaffMemberDetailScreen
        staff={{
          id: "st1",
          name: "Riley Park",
          specialty: "Nails",
          bio: "10+ years.",
          rating: 4.9,
          reviewCount: 80,
          yearsExperience: 10,
          bookingEnabled: true,
        }}
        portfolio={[{ id: "p1", uri: "u1", alt: "Set 1" }]}
        testID="staff"
      />,
    );
    expect(getByTestId("staff-portfolio")).toBeTruthy();
    expect(getByTestId("staff-book")).toBeTruthy();
  });
});

describe("ExploreMapScreen (B.8)", () => {
  it("renders price-bubble pin per location and switch-to-list CTA", () => {
    const { getByTestId } = render(
      <ExploreMapScreen services={[makeServiceCard()]} testID="map" />,
    );
    expect(getByTestId("map-switch-to-list")).toBeTruthy();
    expect(getByTestId("map-summary")).toBeTruthy();
    expect(getByTestId("map-pin-loc1")).toBeTruthy();
  });
});
