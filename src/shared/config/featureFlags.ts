export const featureFlags = {
  marketplaceEnabled: false,
} as const;

export type FeatureFlags = typeof featureFlags;
