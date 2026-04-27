export type DiscoveryCategoryId =
  | "all"
  | "nails"
  | "hair"
  | "skin"
  | "lashes"
  | "brows"
  | "massage"
  | "makeup"
  | "barber"
  | "waxing"
  | "spa"
  | "injectables"
  | "wellness";

export type DiscoveryCategory = {
  id: DiscoveryCategoryId;
};

export type DiscoverySalonCard = {
  id: string;
  tenantId: string;
  name: string;
  city: string;
  categories: Exclude<DiscoveryCategoryId, "all">[];
  rating: number;
  reviewCount: number;
  priceFrom: number;
  currency: string;
  nextAvailableLabel: string;
  featuredService: string;
  member: boolean;
  bookingEnabled: boolean;
  messageEnabled: boolean;
};

export type DiscoveryRecentBooking = {
  id: string;
  salonName: string;
  serviceName: string;
  dateTimeLabel: string;
  statusLabel: string;
};

export type DiscoveryHomeFeed = {
  categories: DiscoveryCategory[];
  featuredSalons: DiscoverySalonCard[];
  recentBookings: DiscoveryRecentBooking[];
};

export type DiscoveryExploreFeed = {
  categories: DiscoveryCategory[];
  salons: DiscoverySalonCard[];
};