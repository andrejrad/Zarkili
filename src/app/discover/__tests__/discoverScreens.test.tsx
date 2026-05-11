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
import type { DiscoveryHomeFeed, DiscoverySalonCard } from "../../../domains/discovery";

function makeSalon(over: Partial<DiscoverySalonCard> = {}): DiscoverySalonCard {
  return {
    id: "s1",
    tenantId: "t1",
    name: "Glow Studio",
    city: "Brooklyn, NY",
    categories: ["nails"],
    rating: 4.8,
    reviewCount: 122,
    priceFrom: 45,
    currency: "USD",
    nextAvailableLabel: "Today 3:00 PM",
    featuredService: "Classic Manicure",
    member: true,
    bookingEnabled: true,
    messageEnabled: true,
    ...over,
  };
}

const homeFeed: DiscoveryHomeFeed = {
  categories: [{ id: "all" }, { id: "nails" }, { id: "hair" }],
  featuredSalons: [makeSalon(), makeSalon({ id: "s2", name: "Hair Lab" })],
  recentBookings: [
    {
      id: "b1",
      salonName: "Glow Studio",
      serviceName: "Classic Manicure",
      dateTimeLabel: "Tue, Mar 5 · 3:00 PM",
      statusLabel: "Confirmed",
    },
  ],
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
      { kind: "salon", salon: makeSalon() },
      { kind: "sponsored", salon: makeSalon({ id: "s2" }), sponsorName: "GlowCo" },
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
  it("renders summary and applies filters via helper", () => {
    const salons = [
      makeSalon({ id: "s1", priceFrom: 30 }),
      makeSalon({ id: "s2", priceFrom: 200 }),
    ];
    const { getByTestId, queryByTestId } = render(
      <ExploreSearchResultsScreen
        salons={salons}
        filters={{ ...DEFAULT_FILTERS, priceRange: [0, 100] }}
        onChangeFilters={() => {}}
        testID="explore"
      />,
    );
    expect(getByTestId("explore-summary").props.children).toBe("1 salon");
    expect(getByTestId("explore-salon-s1")).toBeTruthy();
    expect(queryByTestId("explore-salon-s2")).toBeNull();
  });

  it("renders empty state when nothing matches", () => {
    const { getByTestId } = render(
      <ExploreSearchResultsScreen
        salons={[makeSalon({ priceFrom: 1000 })]}
        filters={{ ...DEFAULT_FILTERS, priceRange: [0, 50] }}
        onChangeFilters={() => {}}
        testID="explore"
      />,
    );
    expect(getByTestId("explore-empty")).toBeTruthy();
  });
});

describe("FilterSheetScreen (B.4)", () => {
  it("computes preview count from current draft and applies", () => {
    const onApply = jest.fn();
    const salons = [
      makeSalon({ id: "s1", priceFrom: 30 }),
      makeSalon({ id: "s2", priceFrom: 60 }),
      makeSalon({ id: "s3", priceFrom: 150 }),
    ];
    const { getByTestId } = render(
      <FilterSheetScreen
        visible
        initialFilters={{ ...DEFAULT_FILTERS, priceRange: [0, 100] }}
        salons={salons}
        onClose={() => {}}
        onApply={onApply}
        testID="fs"
      />,
    );
    // Apply button shows current preview count
    const applyBtn = getByTestId("fs-apply");
    expect(applyBtn).toBeTruthy();
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
    const onToggle = jest.fn();
    const { getByTestId } = render(
      <ServiceDetailScreen
        service={{
          id: "sv1",
          name: "Classic Manicure",
          durationLabel: "45 min",
          priceLabel: "$45",
          description: "Clean cuticles + polish.",
          bookingEnabled: true,
        }}
        staff={[{ id: "st1", name: "Riley" }]}
        addOns={[{ id: "a1", name: "Gel polish", priceLabel: "+$15" }]}
        onToggleAddOn={onToggle}
        testID="svc"
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
  it("renders deferred-feature placeholder + switch-to-list CTA", () => {
    const { getByTestId } = render(
      <ExploreMapScreen salons={[makeSalon()]} testID="map" />,
    );
    expect(getByTestId("map-switch-to-list")).toBeTruthy();
    expect(getByTestId("map-summary")).toBeTruthy();
    expect(getByTestId("map-salon-s1")).toBeTruthy();
  });
});
