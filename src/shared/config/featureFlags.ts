export const featureFlags = {
  marketplaceEnabled: true,
} as const;

export type FeatureFlags = typeof featureFlags;
