import { useEffect, useMemo, useState } from "react";
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import Svg, { Line, Path } from "react-native-svg";

import type {
  CreateAccountInput,
  DiscoveryCategoryId,
  DiscoveryExploreFeed,
  DiscoveryHomeFeed,
  ReviewQuote,
  SearchSuggestion,
  ServiceTypeCard,
  SignInInput,
} from "../../domains";
import { getHandoffStrings, interpolateHandoffString } from "../../shared/i18n/handoffStrings";
import { brandTypography } from "../../shared/ui/brandTypography";
import { NotificationIcon } from "../../shared/ui";
import { formatMoney } from "../../shared/ui/money";
import { useLanguage } from "../providers/LanguageProvider";
import { ServiceTypeCard as ServiceTypeCardComponent } from "../discover/ServiceTypeCard";
import { FilterSheetScreen } from "../discover/FilterSheetScreen";
import { SortSheetScreen } from "../discover/SortSheetScreen";
import { ExploreMapScreen } from "../discover/ExploreMapScreen";
import {
  DEFAULT_FILTERS,
  applyDiscoveryFilters,
  countFilterBadge,
  type DiscoveryFilters,
} from "../discover/discoveryFilters";

import { CategoryIcon } from "./icons/CategoryIcon";

/** Map-pin outline icon (Tabler ti-map-pin style). */
function MapPinIcon({ color = "#6B6B6B", size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path
        d="M12 9m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0"
        stroke={color}
        strokeWidth={1.8}
      />
    </Svg>
  );
}

/** Three-line list icon (Tabler ti-list style). */
function ListIcon({ color = "#993556", size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="4" y1="6" x2="20" y2="6" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Line x1="4" y1="12" x2="20" y2="12" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Line x1="4" y1="18" x2="20" y2="18" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

type WelcomeScreenProps = {
  onGetStarted: () => void;
  onSignIn: () => void;
  onBrowseAsGuest: () => void;
};

type NextAppointmentData = {
  salonName: string;
  serviceName: string;
  dateTimeLabel: string;
  /** Hours until the appointment (may be negative for past/expired) */
  hoursUntil: number;
  tenantId: string;
};

type HomeLoyaltySummary = {
  points: number;
  tier: string;
  /** Points needed to reach next tier; null at Platinum */
  nextMilestonePts: number | null;
  /** First (lowest pts) reward in salon's catalogue; null if catalogue is empty */
  firstReward: { name: string; pointsRequired: number } | null;
};

export type HomeRebookItem = {
  serviceId: string;
  serviceName: string;
  staffId: string;
  staffName: string;
  locationId: string;
  /** Price last paid in minor currency units (e.g. cents) */
  priceLastPaidMinor: number;
  /** Current listed price in minor currency units */
  currentPriceMinor: number;
  currency: string;
  durationMinutes: number;
  /** false when the service has been removed / made inactive */
  available: boolean;
};

type HomeScreenProps = {
  userId: string | null;
  firstName: string;
  tenantId: string | null;
  availableMemberships: ReadonlyArray<{ membershipId: string; tenantId: string }>;
  isPlatformAdmin: boolean;
  homeFeed: DiscoveryHomeFeed | null;
  isLoadingFeed: boolean;
  feedError: string | null;
  nextAppointment: NextAppointmentData | null;
  loyaltySummary: HomeLoyaltySummary | null;
  onRetryFeed: () => void;
  onOpenSalon: (service: ServiceTypeCard) => void;
  onOpenTenantProfile: () => void;
  onOpenTenantLocations: () => void;
  onOpenCreateLocation: () => void;
  onOpenStaffList: () => void;
  onOpenCreateStaff: () => void;
  onOpenServiceList: () => void;
  onOpenCreateService: () => void;
  onOpenOwnerSettings: () => void;
  onOpenAdminBookingQueue: () => void;
  onOpenDashboard: () => void;
  onBackToDashboard: () => void;
  onSignOut: () => void;
  onOpenInbox: () => void;
  unreadInboxCount: number;
  onOpenBookingDetail: () => void;
  onNavigateToRewards: () => void;
  onSignUp: () => void;
  onSignIn: () => void;
  onBrowseCategory: (categoryId: DiscoveryCategoryId) => void;
  /** null = still loading; [] = no history at active brand */
  rebookItems: HomeRebookItem[] | null;
  activeBrandName: string | null;
  isMultiBrandUser: boolean;
  brandSwitcherItems: Array<{ tenantId: string; name: string; upcomingCount: number; points: number; tier: string }>;
  onRebook: (item: HomeRebookItem) => void;
  onSelectActiveBrand: (tenantId: string) => void;
  onExploreServices: () => void;
};

type ExploreScreenProps = {
  marketplaceEnabled: boolean;
  exploreFeed: DiscoveryExploreFeed | null;
  isLoadingFeed: boolean;
  feedError: string | null;
  availableMemberships: ReadonlyArray<{ tenantId: string }>;
  onRetryFeed: () => void;
  onBookEnabled: (service: ServiceTypeCard) => void;
  onBookUnavailable: (service: ServiceTypeCard) => void;
  onBack: () => void;
  selectedCategory?: DiscoveryCategoryId;
  onCategoryChange?: (id: DiscoveryCategoryId) => void;
  /** Logged-in user ID — enables save heart and member badge on cards. */
  userId?: string | null;
  /** "near [city]" label shown in results row; defaults to first card's locationCity. */
  locationLabel?: string;
  hasMore?: boolean;
  onLoadMore?: () => void;
  suggestions?: SearchSuggestion[];
  onSearchQueryChange?: (q: string) => void;
  onToggleSave?: (serviceId: string, saved: boolean) => void;
  onViewDetail?: (serviceId: string) => void;
  onLocationChange?: (result: { type: string; query?: string }) => void;
};

type AuthRouteScreenProps = {
  mode: "login" | "register";
  isSubmitting: boolean;
  errorMessage: string | null;
  onSubmit: (input: SignInInput | CreateAccountInput) => Promise<void>;
  onDevAction: () => void;
  onSecondaryAction: () => void;
};

type CompleteProfileRouteScreenProps = {
  email: string | null;
  isSubmitting: boolean;
  errorMessage: string | null;
  onSubmit: (input: { firstName: string; lastName: string }) => Promise<void>;
};

type ProfileRouteScreenProps = {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  bookingCount?: number;
  loyaltyPoints?: number;
  tenantId: string | null;
  membershipsLoading: boolean;
  availableMemberships: Array<{ membershipId: string; tenantId: string }>;
  onboardingGuardMessage: string | null;
  onSelectTenant: (tenantId: string) => void;
  onStartSalonOnboarding: () => void;
  onStartClientOnboarding: () => void;
  onEditProfile: () => void;
  onOpenSettings: () => void;
};

type SettingsShellRouteScreenProps = {
  onOpenNotifications: () => void;
  onOpenPaymentMethods: () => void;
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
  onOpenAbout: () => void;
  onSignOut: () => void;
  onBack: () => void;
};

const colors = {
  background: "#F2EDDD",
  surface: "#FFFFFF",
  border: "#E5E0D1",
  text: "#1A1A1A",
  muted: "#6B6B6B",
  primary: "#E3A9A0",
  primaryPressed: "#CF8B80",
  accent: "#BBEDDA",
  error: "#F44336",
  white: "#FFFFFF",
};

/** Returns the label of the tier above the given tier name (or "Platinum" if already at top). */
function getNextTierLabel(tier: string): string {
  const order = ["Bronze", "Silver", "Gold", "Platinum"];
  const idx = order.indexOf(tier);
  if (idx < 0 || idx >= order.length - 1) return "Platinum";
  return order[idx + 1];
}

function PrimaryButton({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryButton,
        pressed && !disabled ? styles.primaryButtonPressed : null,
        disabled ? styles.primaryButtonDisabled : null,
      ]}
    >
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.secondaryButton}>
      <Text style={styles.secondaryButtonText}>{label}</Text>
    </Pressable>
  );
}

function CategoryTile({ categoryId, onPress }: { categoryId: DiscoveryCategoryId; onPress?: () => void }) {
  const { language } = useLanguage();
  const copy = getHandoffStrings(language);
  const label = copy.categories[categoryId] ?? categoryId;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Browse ${label} services`}
      style={styles.categoryTile}
      onPress={onPress}
    >
      <View style={styles.categoryGlyph}>
        <CategoryIcon category={categoryId} size={24} color={categoryId === "all" ? colors.text : colors.muted} />
      </View>
      <Text style={styles.categoryLabel}>{label}</Text>
    </Pressable>
  );
}

function SalonCard({
  salon,
  memberTenantIds,
  showBookAction = false,
  hideFromPrefix = false,
  onPress,
  onBookEnabled,
  onBookUnavailable,
}: {
  salon: ServiceTypeCard;
  memberTenantIds?: ReadonlySet<string>;
  showBookAction?: boolean;
  /** Guest Popular Near You: spec says never show "from" */
  hideFromPrefix?: boolean;
  onPress?: (salon: ServiceTypeCard) => void;
  onBookEnabled?: (salon: ServiceTypeCard) => void;
  onBookUnavailable?: (salon: ServiceTypeCard) => void;
}) {
  const { language } = useLanguage();
  const copy = getHandoffStrings(language);

  function handleBookPress() {
    if (salon.isBookableOnline) {
      onBookEnabled?.(salon);
      return;
    }

    onBookUnavailable?.(salon);
  }

  return (
    <Pressable accessibilityRole="button" onPress={() => onPress?.(salon)} style={styles.salonCard}>
      <View style={styles.salonImagePlaceholder}>
        {salon.primaryPhotoUrl ? (
          <Image
            source={{ uri: salon.primaryPhotoUrl ?? undefined }}
            style={styles.salonCoverImage}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
        ) : null}
        {(memberTenantIds != null ? memberTenantIds.has(salon.tenantId) : salon.memberPoints !== null) ? (
          <View style={styles.memberBadge} accessibilityElementsHidden>
            <Text style={styles.memberBadgeText}>
              {salon.memberPoints != null
                ? `Member · ${salon.memberPoints} pts`
                : copy.salonCard.member}
            </Text>
          </View>
        ) : null}
      </View>
      <View style={styles.salonCardContent}>
        <Text style={styles.salonName}>{salon.serviceName}</Text>
        <Text style={styles.salonLocationLine} numberOfLines={1}>
          {"at "}
          {salon.locationDisplayName}
        </Text>
        {(salon.serviceAverageRating != null || salon.locationAverageRating != null) ? (
          <Text style={styles.salonReviews}>
            {(salon.serviceAverageRating ?? salon.locationAverageRating ?? 0).toFixed(1)}
            {" ★ ("}
            {salon.serviceReviewCount}
            {")"}
          </Text>
        ) : null}
        <View style={styles.salonChipRow}>
          {[salon.categoryId].map((categoryId) => (
            <View key={`${salon.id}-${categoryId}`} style={styles.salonChip}>
              <Text style={styles.salonChipText}>{copy.categories[categoryId] ?? categoryId}</Text>
            </View>
          ))}
        </View>
        <View style={styles.salonFooterRow}>
          <Text style={styles.salonMeta}>{salon.nextAvailableAt ? new Date(salon.nextAvailableAt).toLocaleDateString() : ""}</Text>
          <Text style={styles.salonPrice}>
            {(hideFromPrefix || salon.variantCount === 1)
              ? `£${salon.priceFrom.toFixed(0)}`
              : `${copy.salonCard.from} £${salon.priceFrom.toFixed(0)}`}
          </Text>
        </View>
        {showBookAction ? (
          <Pressable
            accessibilityRole="button"
            onPress={handleBookPress}
            style={({ pressed }) => [
              styles.salonActionButton,
              salon.isBookableOnline ? styles.salonActionButtonEnabled : styles.salonActionButtonDisabled,
              pressed ? styles.salonActionButtonPressed : null,
            ]}
          >
            <Text style={styles.salonActionButtonText}>{salon.isBookableOnline ? "Book" : "Book (coming soon)"}</Text>
          </Pressable>
        ) : null}
        {!salon.isBookableOnline ? <Text style={styles.salonMutedNote}>{copy.salonCard.messagingDisabled}</Text> : null}
      </View>
    </Pressable>
  );
}

export function WelcomeRouteScreen({ onGetStarted, onSignIn, onBrowseAsGuest }: WelcomeScreenProps) {
  const { language, t } = useLanguage();
  const copy = getHandoffStrings(language);

  return (
    <View style={styles.welcomeScreen}>
      <View style={styles.heroBlock}>
        <Image
          source={require("../../../assets/icon.png")}
          style={styles.zarkiliIcon}
        />
        <Text style={styles.heroTitle}>{copy.welcome.title}</Text>
        <Text style={styles.heroDescription}>{copy.welcome.description}</Text>
      </View>

      <View style={styles.welcomeFooter}>
        <PrimaryButton label={copy.welcome.ctaPrimary} onPress={onGetStarted} />
        <SecondaryButton label={copy.welcome.ctaSecondary} onPress={onSignIn} />
        <Pressable accessibilityRole="button" onPress={onBrowseAsGuest} style={styles.ghostLinkButton}>
          <Text style={styles.ghostLinkText}>{t("action.discoverBusinesses")}</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function AuthRouteScreen({
  mode,
  isSubmitting,
  errorMessage,
  onSubmit,
  onDevAction,
  onSecondaryAction,
}: AuthRouteScreenProps) {
  const { language, t } = useLanguage();
  const copy = getHandoffStrings(language);
  const isLogin = mode === "login";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function submit() {
    await onSubmit({ email, password });
  }

  return (
    <View style={styles.authScreen}>
      <View style={styles.authCard}>
        <Text style={styles.authOverline}>{t("app.title")}</Text>
        <Text style={styles.authTitle}>{t(isLogin ? "auth.login.title" : "auth.register.title")}</Text>
        <Text style={styles.authBody}>{isLogin ? copy.auth.loginBody : copy.auth.registerBody}</Text>

        <View style={styles.authFields}>
          <View style={styles.authFieldShell}>
            <Text style={styles.authFieldLabel}>{copy.auth.emailLabel}</Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="name@example.com"
              style={styles.authInput}
              value={email}
            />
          </View>
          <View style={styles.authFieldShell}>
            <Text style={styles.authFieldLabel}>{copy.auth.passwordLabel}</Text>
            <TextInput
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              style={styles.authInput}
              value={password}
            />
          </View>
        </View>

        {errorMessage ? <Text style={styles.authError}>{errorMessage}</Text> : null}

        <View style={styles.authActions}>
          <PrimaryButton label={isSubmitting ? "Working..." : t(isLogin ? "action.login" : "action.createAccount")} onPress={() => void submit()} disabled={isSubmitting} />
          <SecondaryButton label={t(isLogin ? "auth.signInAsDev" : "auth.createAccountDev")} onPress={onDevAction} />
          <SecondaryButton label={t("action.back")} onPress={onSecondaryAction} />
        </View>
      </View>
    </View>
  );
}

export function CompleteProfileRouteScreen({
  email,
  isSubmitting,
  errorMessage,
  onSubmit,
}: CompleteProfileRouteScreenProps) {
  const { t } = useLanguage();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const canSubmit = firstName.trim().length > 0 && lastName.trim().length > 0 && !isSubmitting;

  async function submit() {
    if (!canSubmit) {
      return;
    }

    await onSubmit({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    });
  }

  return (
    <View style={styles.authScreen}>
      <View style={styles.authCard}>
        <Text style={styles.authOverline}>{t("app.title")}</Text>
        <Text style={styles.authTitle}>Complete your profile</Text>
        <Text style={styles.authBody}>
          {email
            ? `Add your first and last name for ${email} before entering the app.`
            : "Add your first and last name before entering the app."}
        </Text>

        <View style={styles.authFields}>
          <View style={styles.authFieldShell}>
            <Text style={styles.authFieldLabel}>First name</Text>
            <TextInput
              autoCapitalize="words"
              onChangeText={setFirstName}
              placeholder="Ana"
              style={styles.authInput}
              value={firstName}
            />
          </View>
          <View style={styles.authFieldShell}>
            <Text style={styles.authFieldLabel}>Last name</Text>
            <TextInput
              autoCapitalize="words"
              onChangeText={setLastName}
              placeholder="Novak"
              style={styles.authInput}
              value={lastName}
            />
          </View>
        </View>

        {errorMessage ? <Text style={styles.authError}>{errorMessage}</Text> : null}

        <View style={styles.authActions}>
          <PrimaryButton label={isSubmitting ? "Working..." : "Continue"} onPress={() => void submit()} disabled={!canSubmit} />
        </View>
      </View>
    </View>
  );
}

export function ProfileRouteScreen({
  firstName,
  lastName,
  email,
  bookingCount = 4,
  loyaltyPoints = 450,
  tenantId,
  membershipsLoading,
  availableMemberships,
  onboardingGuardMessage,
  onSelectTenant,
  onStartSalonOnboarding,
  onStartClientOnboarding,
  onEditProfile,
  onOpenSettings,
}: ProfileRouteScreenProps) {
  const { t } = useLanguage();
  const initials =
    firstName && lastName
      ? `${firstName[0]}${lastName[0]}`.toUpperCase()
      : firstName
        ? firstName[0].toUpperCase()
        : "?";
  const displayName =
    firstName && lastName ? `${firstName} ${lastName}` : firstName ?? lastName ?? "Guest";

  return (
    <ScrollView contentContainerStyle={styles.profileContent} showsVerticalScrollIndicator={false}>
      <View style={styles.profileCard}>
        {/* Avatar */}
        <View style={styles.profileAvatarRow}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>{initials}</Text>
          </View>
        </View>

        {/* Identity */}
        <View style={styles.profileIdentity}>
          <Text style={styles.profileDisplayName}>{displayName}</Text>
          {email ? <Text style={styles.profileEmail}>{email}</Text> : null}
        </View>

        {/* Stats */}
        <View style={styles.profileStatsRow}>
          <View style={styles.profileStatPill}>
            <Text style={styles.profileStatValue}>{bookingCount}</Text>
            <Text style={styles.profileStatLabel}>Bookings</Text>
          </View>
          <View style={styles.profileStatDivider} />
          <View style={styles.profileStatPill}>
            <Text style={styles.profileStatValue}>{loyaltyPoints}</Text>
            <Text style={styles.profileStatLabel}>Points</Text>
          </View>
        </View>

        {/* Actions */}
        <PrimaryButton label="Edit profile" onPress={onEditProfile} />
        <Pressable
          accessibilityRole="button"
          onPress={onOpenSettings}
          style={styles.profileSettingsRow}
        >
          <Text style={styles.profileSettingsLabel}>Settings</Text>
          <Text style={styles.profileSettingsChevron}>›</Text>
        </Pressable>
      </View>

      {onboardingGuardMessage ? (
        <View style={styles.guardCard}>
          <Text style={styles.guardCardText}>{onboardingGuardMessage}</Text>
        </View>
      ) : null}

      <View style={styles.utilityPanel}>
        <Text style={styles.utilityTitle}>Onboarding</Text>
        <Text style={styles.utilityBody}>
          {membershipsLoading
            ? t("membership.loading")
            : availableMemberships.length === 0
              ? t("membership.none")
              : tenantId
                ? t("appShell.tenantContext", { tenantId })
                : t("onboarding.guard.selectTenant")}
        </Text>
        {!membershipsLoading && availableMemberships.length > 1 ? (
          <View style={styles.utilityButtonColumn}>
            {availableMemberships.map((membership) => (
              <SecondaryButton
                key={membership.membershipId}
                label={t("membership.selectTenant", { tenantId: membership.tenantId })}
                onPress={() => onSelectTenant(membership.tenantId)}
              />
            ))}
          </View>
        ) : null}
        <View style={styles.utilityButtonColumn}>
          <PrimaryButton label={t("onboarding.startSalon")} onPress={onStartSalonOnboarding} />
          <SecondaryButton label={t("onboarding.startClient")} onPress={onStartClientOnboarding} />
        </View>
      </View>
    </ScrollView>
  );
}

export function SettingsShellRouteScreen({
  onOpenNotifications,
  onOpenPaymentMethods,
  onOpenTerms,
  onOpenPrivacy,
  onOpenAbout,
  onSignOut,
  onBack,
}: SettingsShellRouteScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.profileContent} showsVerticalScrollIndicator={false}>
      <View style={styles.profileCard}>
        <Text style={styles.authOverline}>Account</Text>
        <Text style={styles.authTitle}>Settings</Text>

        <View style={styles.settingsGroup}>
          <SettingsRow label="Notifications" onPress={onOpenNotifications} />
          <SettingsRow label="Payment methods" onPress={onOpenPaymentMethods} />
        </View>

        <View style={styles.settingsGroup}>
          <Text style={styles.settingsGroupLabel}>Legal</Text>
          <SettingsRow label="Terms of Service" onPress={onOpenTerms} />
          <SettingsRow label="Privacy Policy" onPress={onOpenPrivacy} />
          <SettingsRow label="About Zarkili" onPress={onOpenAbout} />
        </View>

        <View style={styles.settingsGroup}>
          <Pressable accessibilityRole="button" onPress={onBack} style={styles.settingsBackRow}>
            <Text style={styles.settingsBackLabel}>‹ Back to profile</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onSignOut} style={styles.settingsSignOutRow}>
            <Text style={styles.settingsSignOutLabel}>Sign out</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

function SettingsRow({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.settingsRow, pressed && styles.settingsRowPressed]}
    >
      <Text style={styles.settingsRowLabel}>{label}</Text>
      <Text style={styles.settingsRowChevron}>›</Text>
    </Pressable>
  );
}

export function HomeRouteScreen({
  userId,
  firstName,
  tenantId,
  availableMemberships,
  isPlatformAdmin,
  homeFeed,
  isLoadingFeed,
  feedError,
  nextAppointment,
  loyaltySummary,
  onRetryFeed,
  onOpenSalon,
  onOpenTenantProfile,
  onOpenTenantLocations,
  onOpenCreateLocation,
  onOpenStaffList,
  onOpenCreateStaff,
  onOpenServiceList,
  onOpenCreateService,
  onOpenOwnerSettings,
  onOpenAdminBookingQueue,
  onOpenDashboard,
  onBackToDashboard,
  onSignOut,
  onOpenInbox,
  unreadInboxCount,
  onOpenBookingDetail,
  onNavigateToRewards,
  onSignUp,
  onSignIn,
  rebookItems,
  activeBrandName,
  isMultiBrandUser,
  brandSwitcherItems,
  onRebook,
  onSelectActiveBrand,
  onExploreServices,
  onBrowseCategory,
}: HomeScreenProps) {
  const [brandSheetOpen, setBrandSheetOpen] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const { language, t } = useLanguage();
  const copy = getHandoffStrings(language);
  const memberTenantIds = useMemo(
    () => new Set(availableMemberships.map((m) => m.tenantId)),
    [availableMemberships]
  );

  // Preferred category order per spec — filtered to those with ≥1 salon in the feed.
  // Falls back to any remaining categories with results if preferred list doesn't fill 6.
  const PREFERRED_CATEGORIES: Exclude<DiscoveryCategoryId, "all">[] = [
    "nails", "hair", "lashes", "skin", "brows", "massage",
  ];
  const GRID_MAX = 6;
  const guestCategories = useMemo((): Exclude<DiscoveryCategoryId, "all">[] => {
    if (!homeFeed) return [];
    const withResults = new Set<string>();
    for (const salon of homeFeed.featuredSalons) {
      withResults.add(salon.categoryId);
    }
    // If feed has no salons yet, show all categories as fallback
    const hasResults = (id: string) => withResults.size === 0 || withResults.has(id);
    const allIds = homeFeed.categories
      .map((c) => c.id)
      .filter((id): id is Exclude<DiscoveryCategoryId, "all"> => id !== "all");
    const preferred = PREFERRED_CATEGORIES.filter((id) => allIds.includes(id) && hasResults(id));
    const remaining = allIds.filter((id) => !PREFERRED_CATEGORIES.includes(id) && hasResults(id));
    return [...preferred, ...remaining];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homeFeed]);

  // Time-aware greeting
  const greetingPrefix = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  // Compact date sub-line: "Wednesday, 14 May"
  const todayLabel = useMemo(() => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  }, []);

  // ── Logged-in derived styles (must be called unconditionally before any early return) ──

  // Next appointment pill colour
  const apptPillStyle = useMemo(() => {
    if (!nextAppointment) return null;
    if (nextAppointment.hoursUntil < 0) {
      return { background: "#F1EFE8", text: "#5F5E5A" };
    }
    if (nextAppointment.hoursUntil < 48) {
      return { background: "#F7C1C1", text: "#791F1F" };
    }
    return { background: "#FAEEDA", text: "#633806" };
  }, [nextAppointment]);

  // Loyalty banner colour
  const loyaltyBannerStyle = useMemo(() => {
    if (!loyaltySummary) return null;
    if (loyaltySummary.nextMilestonePts === null || loyaltySummary.nextMilestonePts === 0) {
      return { background: "#E1F5EE", border: "#9FE1CB" };
    }
    return { background: "#E6F1FB", border: "#B5D4F4" };
  }, [loyaltySummary]);

  // Progress fraction for loyalty bar (0–1)
  const loyaltyProgress = useMemo(() => {
    if (!loyaltySummary) return 0;
    if (loyaltySummary.nextMilestonePts === null) return 1;
    const tier = loyaltySummary.tier as "Bronze" | "Silver" | "Gold" | "Platinum";
    const thresholds: Record<string, number> = { Bronze: 0, Silver: 500, Gold: 1500, Platinum: 5000 };
    const tierStart = thresholds[tier] ?? 0;
    const tierEnd = tierStart + (loyaltySummary.nextMilestonePts ?? 0) + (loyaltySummary.points - tierStart);
    if (tierEnd <= tierStart) return 1;
    return Math.min(1, Math.max(0, (loyaltySummary.points - tierStart) / (tierEnd - tierStart)));
  }, [loyaltySummary]);

  // ── Guest layout ──────────────────────────────────────────────────────────
  if (!userId) {
    return (
      <ScrollView contentContainerStyle={styles.homeContent} showsVerticalScrollIndicator={false}>
        {/* Element 1: Minimal brand header */}
        <View style={styles.guestHeader}>
          <Text style={styles.guestAppName}>Zarkili</Text>
          <Pressable accessibilityRole="button" onPress={onSignIn}>
            <Text style={styles.guestSignInLink}>Log in</Text>
          </Pressable>
        </View>

        {/* Element 2: Hero value section */}
        <View style={styles.guestHero}>
          <View style={styles.guestHeroCategoryTag}>
            <Text style={styles.guestHeroCategoryTagText}>Beauty near you</Text>
          </View>
          <Text style={styles.guestHeroTitle}>Find your next appointment</Text>
          <Text style={styles.guestHeroBody}>Nails, hair, lash, skin — browse and book in seconds.</Text>
          <Pressable accessibilityRole="button" style={styles.guestHeroCta} onPress={() => onBrowseCategory("all")}>
            <Text style={styles.guestHeroCtaText}>Explore services</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onSignIn}>
            <Text style={styles.guestHeroSecondary}>Already have an account? Log in</Text>
          </Pressable>
        </View>

        {/* Element 3: Social proof stats */}
        <View style={styles.guestStatsRow}>
          <View style={styles.guestStatTile}>
            <Text style={styles.guestStatValue} accessibilityLabel="Average rating 4.9 stars">4.9 ★</Text>
            <Text style={styles.guestStatLabel}>Average rating</Text>
          </View>
          <View style={styles.guestStatTile}>
            <Text style={styles.guestStatValue}>50k+</Text>
            <Text style={styles.guestStatLabel}>Bookings</Text>
          </View>
          <View style={styles.guestStatTile}>
            <Text style={styles.guestStatValue}>200+</Text>
            <Text style={styles.guestStatLabel}>Partner locations</Text>
          </View>
        </View>

        {/* Element 4: Category browse grid — 3×2, filtered to categories with results */}
        {homeFeed && guestCategories.length > 0 ? (
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>{copy.home.categoriesTitle}</Text>
            <View style={styles.categoriesGrid}>
              {(showAllCategories ? guestCategories : guestCategories.slice(0, GRID_MAX)).map((catId) => (
                <CategoryTile
                  key={catId}
                  categoryId={catId}
                  onPress={() => onBrowseCategory(catId)}
                />
              ))}
            </View>
            {guestCategories.length > GRID_MAX ? (
              <Pressable
                accessibilityRole="button"
                style={styles.categoryShowMoreLink}
                onPress={() => setShowAllCategories((v) => !v)}
              >
                <Text style={styles.categoryShowMoreText}>
                  {showAllCategories ? "Show less" : "Show more"}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {/* Element 5: Popular near you */}
        {homeFeed && homeFeed.featuredSalons.length > 0 ? (
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Popular near you</Text>
              <Pressable accessibilityRole="button" onPress={onExploreServices}>
                <Text style={styles.sectionLink}>{copy.home.featuredViewAll}</Text>
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredRow}>
              {homeFeed.featuredSalons.map((salon) => (
                <View key={salon.id} style={styles.featuredCardWrap}>
                  <SalonCard salon={salon} memberTenantIds={memberTenantIds} onPress={onOpenSalon} hideFromPrefix />
                </View>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {isLoadingFeed ? <Text style={styles.utilityBody}>Loading...</Text> : null}
        {feedError ? (
          <View style={styles.utilityPanel}>
            <Text style={styles.errorText}>{feedError}</Text>
            <PrimaryButton label="Retry" onPress={onRetryFeed} />
          </View>
        ) : null}

        {/* Element 6: Client reviews strip */}
        {homeFeed && homeFeed.guestReviews.length > 0 ? (
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>What clients say</Text>
            {homeFeed.guestReviews.map((review: ReviewQuote) => (
              <View key={review.id} style={styles.guestReviewCard}>
                <Text style={styles.guestReviewText}>&ldquo;{review.text}&rdquo;</Text>
                <Text style={styles.guestReviewMeta}>
                  — {review.reviewerName} · {review.serviceName} · {review.salonName}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Element 7: Soft sign-up prompt — single CTA only */}
        <View style={styles.signUpCard}>
          <Text style={styles.signUpCardTitle}>Save favourites and earn rewards</Text>
          <Text style={styles.signUpCardBody}>Track every booking in one place.</Text>
          <Pressable accessibilityRole="button" style={styles.signUpCardButton} onPress={onSignUp}>
            <Text style={styles.signUpCardButtonText}>Create your account</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  // RebookSheet is opened by the parent (AppNavigatorShell) via onRebook callback.
  // The strip calls onRebook(item) which triggers the sheet overlay in the shell.

  return (
    <ScrollView contentContainerStyle={styles.homeContent} showsVerticalScrollIndicator={false}>
      {/* ── Header ── */}
      <View style={styles.homeHeader}>
        <View style={styles.homeHeaderText}>
          <Text style={styles.homeGreeting}>{greetingPrefix}, {firstName}</Text>
          <Text style={styles.homeDate}>{todayLabel}</Text>
        </View>
        <NotificationIcon count={unreadInboxCount} icon="bell" color="red" size="md" onPress={onOpenInbox} />
      </View>

      {/* ── Next appointment card ── */}
      {nextAppointment ? (
        <View style={styles.appointmentCard}>
          <View style={styles.appointmentCardTop}>
            <View style={styles.appointmentCardInfo}>
              <Text style={styles.appointmentCardLabel}>Next appointment</Text>
              <Text style={styles.appointmentCardService}>{nextAppointment.serviceName}</Text>
              <Text style={styles.appointmentCardSalon}>{nextAppointment.salonName}</Text>
            </View>
            {apptPillStyle ? (
              <View style={[styles.appointmentPill, { backgroundColor: apptPillStyle.background }]}>
                <Text style={[styles.appointmentPillText, { color: apptPillStyle.text }]}>
                  {nextAppointment.dateTimeLabel}
                </Text>
              </View>
            ) : null}
          </View>
          <Pressable accessibilityRole="button" style={styles.appointmentCardCta} onPress={onOpenBookingDetail}>
            <Text style={styles.appointmentCardCtaText}>View details</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.noAppointmentCard}>
          <Text style={styles.noAppointmentText}>Nothing booked yet. </Text>
          <Pressable accessibilityRole="button" onPress={onOpenBookingDetail}>
            <Text style={styles.noAppointmentLink}>Ready to treat yourself?</Text>
          </Pressable>
        </View>
      )}

      {/* ── Quick rebook ── */}
      {userId ? (
        <>
          {/* State 1: no brand context or no bookings — discovery card (no section header) */}
          {!tenantId || (rebookItems !== null && rebookItems.length === 0) ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Book your first service. Tap to explore services."
              style={styles.homeDiscoveryCard}
              onPress={onExploreServices}
            >
              <Text style={styles.rebookEmptyTitle}>Book your first service</Text>
              <Text style={styles.rebookEmptyBody}>Your recent bookings will appear here</Text>
              <View accessibilityElementsHidden style={styles.rebookEmptyCta}>
                <Text style={styles.rebookEmptyCtaText}>Explore services</Text>
              </View>
            </Pressable>
          ) : rebookItems === null ? (
            /* Still loading — show header + spinner text */
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Quick rebook</Text>
                {activeBrandName ? (
                  isMultiBrandUser ? (
                    <Pressable accessibilityRole="button" style={styles.brandContextChip} onPress={() => setBrandSheetOpen(true)}>
                      <Text style={styles.brandContextChipText}>{activeBrandName} ▾</Text>
                    </Pressable>
                  ) : (
                    <Text style={styles.brandContextLabel}>At {activeBrandName}</Text>
                  )
                ) : null}
              </View>
              <Text style={styles.rebookLoadingText}>Loading…</Text>
            </View>
          ) : (
            /* State 2/3/4: has bookings — normal strip */
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Quick rebook</Text>
                {activeBrandName ? (
                  isMultiBrandUser ? (
                    <Pressable accessibilityRole="button" style={styles.brandContextChip} onPress={() => setBrandSheetOpen(true)}>
                      <Text style={styles.brandContextChipText}>{activeBrandName} ▾</Text>
                    </Pressable>
                  ) : (
                    <Text style={styles.brandContextLabel}>At {activeBrandName}</Text>
                  )
                ) : null}
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rebookStrip}>
                {rebookItems.map((item) => (
                  <View key={item.serviceId} style={styles.rebookCard}>
                    {!item.available ? (
                      <View style={styles.rebookCardUnavailableBadge}>
                        <Text style={styles.rebookCardUnavailableText}>No longer available</Text>
                      </View>
                    ) : null}
                    <Text style={styles.rebookCardService} numberOfLines={2}>{item.serviceName}</Text>
                    <Text style={styles.rebookCardMeta}>{item.durationMinutes} min</Text>
                    {item.available && item.currentPriceMinor !== item.priceLastPaidMinor ? (
                      <Text style={styles.rebookCardPriceWarning}>
                        Was {formatMoney(item.priceLastPaidMinor, item.currency)}, now {formatMoney(item.currentPriceMinor, item.currency)}
                      </Text>
                    ) : (
                      <Text style={styles.rebookCardPrice}>
                        {formatMoney(item.currentPriceMinor, item.currency)}
                      </Text>
                    )}
                    {item.available ? (
                      <Pressable
                        accessibilityRole="button"
                        style={styles.rebookCardCta}
                        onPress={() => onRebook(item)}
                      >
                        <Text style={styles.rebookCardCtaText}>Rebook</Text>
                      </Pressable>
                    ) : (
                      <Pressable accessibilityRole="button" style={styles.rebookCardCtaSecondary} onPress={onExploreServices}>
                        <Text style={styles.rebookCardCtaSecondaryText}>Find similar</Text>
                      </Pressable>
                    )}
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </>
      ) : null}

      {/* ── Loyalty nudge banner ── */}
      {loyaltySummary && loyaltyBannerStyle ? (
        loyaltySummary.points === 0 ? (
          loyaltySummary.firstReward !== null ? (
            /* State 3 — aspirational mode: has loyalty account, 0 pts */
            <Pressable
              accessibilityRole="button"
              style={[styles.loyaltyBanner, { backgroundColor: loyaltyBannerStyle.background, borderColor: loyaltyBannerStyle.border }]}
              onPress={onExploreServices}
            >
              <View style={styles.loyaltyBannerRow}>
                <View style={styles.loyaltyBannerInfo}>
                  <Text style={styles.loyaltyBannerTier}>Start earning at {activeBrandName ?? ""}</Text>
                  <Text style={styles.loyaltyBannerPoints}>Book any service to earn your first points</Text>
                </View>
                {activeBrandName ? (
                  isMultiBrandUser ? (
                    <Pressable accessibilityRole="button" style={styles.brandContextChip} onPress={(e) => { e.stopPropagation?.(); setBrandSheetOpen(true); }}>
                      <Text style={styles.brandContextChipText}>{activeBrandName} ▾</Text>
                    </Pressable>
                  ) : (
                    <Text style={styles.brandContextLabel}>At {activeBrandName}</Text>
                  )
                ) : null}
              </View>
              <View
                style={styles.loyaltyProgressTrack}
                accessibilityRole="progressbar"
                accessibilityValue={{ min: 0, max: loyaltySummary.firstReward.pointsRequired, now: 0 }}
                accessibilityLabel={`0 of ${loyaltySummary.firstReward.pointsRequired} points earned toward ${loyaltySummary.firstReward.name} at ${activeBrandName ?? ""}`}
              />
              <View style={styles.loyaltyAspirationalFooter}>
                <Text style={styles.loyaltyAspirationalMilestone}>
                  {loyaltySummary.firstReward.pointsRequired} pts = {loyaltySummary.firstReward.name}
                </Text>
                <Text style={styles.loyaltyAspirationalCta}>Book to start earning →</Text>
              </View>
            </Pressable>
          ) : null /* catalogue empty — hide silently */
        ) : (
          /* State 4 — normal mode: has points */
          <Pressable
            accessibilityRole="button"
            style={[styles.loyaltyBanner, { backgroundColor: loyaltyBannerStyle.background, borderColor: loyaltyBannerStyle.border }]}
            onPress={onNavigateToRewards}
          >
            <View style={styles.loyaltyBannerRow}>
              <View style={styles.loyaltyBannerInfo}>
                <Text style={styles.loyaltyBannerTier}>{loyaltySummary.tier} member</Text>
                <Text style={styles.loyaltyBannerPoints}>
                  {loyaltySummary.points.toLocaleString("en-US")} pts
                  {loyaltySummary.nextMilestonePts !== null
                    ? ` · ${loyaltySummary.nextMilestonePts} to ${getNextTierLabel(loyaltySummary.tier)}`
                    : " · Platinum — top tier!"}
                </Text>
              </View>
              {activeBrandName ? (
                isMultiBrandUser ? (
                  <Pressable accessibilityRole="button" style={styles.brandContextChip} onPress={(e) => { e.stopPropagation?.(); setBrandSheetOpen(true); }}>
                    <Text style={styles.brandContextChipText}>{activeBrandName} ▾</Text>
                  </Pressable>
                ) : (
                  <Text style={styles.brandContextLabel}>At {activeBrandName}</Text>
                )
              ) : null}
            </View>
            <View
              style={styles.loyaltyProgressTrack}
              accessibilityRole="progressbar"
              accessibilityValue={{ min: 0, max: loyaltySummary.points + (loyaltySummary.nextMilestonePts ?? 0), now: loyaltySummary.points }}
              accessibilityLabel={`${loyaltySummary.points} points toward ${getNextTierLabel(loyaltySummary.tier)} tier at ${activeBrandName ?? ""}`}
            >
              <View style={[styles.loyaltyProgressFill, { width: `${Math.round(loyaltyProgress * 100)}%` as unknown as number }]} />
            </View>
          </Pressable>
        )
      ) : null}

      {isLoadingFeed ? <Text style={styles.utilityBody}>Loading discovery feed...</Text> : null}
      {feedError ? (
        <View style={styles.utilityPanel}>
          <Text style={styles.errorText}>{feedError}</Text>
          <PrimaryButton label="Retry" onPress={onRetryFeed} />
        </View>
      ) : null}

      {homeFeed ? (
        <>
          {/* ── Trending near you ── */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>Trending near you</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredRow}>
              {homeFeed.featuredSalons.slice(0, 6).map((salon) => (
                <View key={salon.id} style={styles.featuredCardWrap}>
                  <SalonCard salon={salon} memberTenantIds={memberTenantIds} onPress={onOpenSalon} />
                </View>
              ))}
            </ScrollView>
          </View>

          {/* ── Recommended for you ── */}
          {homeFeed.recommendedSalons.length > 0 ? (
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>Based on your taste</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredRow}>
                {homeFeed.recommendedSalons.slice(0, 4).map((salon) => (
                  <View key={salon.id} style={styles.featuredCardWrap}>
                    <SalonCard salon={salon} memberTenantIds={memberTenantIds} onPress={onOpenSalon} />
                  </View>
                ))}
              </ScrollView>
            </View>
          ) : null}
        </>
      ) : null}

      {tenantId ? (
        <View style={styles.utilityPanel}>
          <Text style={styles.utilityTitle}>Tenant Admin</Text>
          <Text style={styles.utilityBody}>Manage your salon profile, locations, services, and staff</Text>
          <View style={styles.utilityButtonColumn}>
            <SecondaryButton label="Tenant profile" onPress={onOpenTenantProfile} />
            <SecondaryButton label="Tenant locations" onPress={onOpenTenantLocations} />
            <SecondaryButton label="Create location" onPress={onOpenCreateLocation} />
            <SecondaryButton label="Staff list" onPress={onOpenStaffList} />
            <SecondaryButton label="Add staff member" onPress={onOpenCreateStaff} />
            <SecondaryButton label="Services list" onPress={onOpenServiceList} />
            <SecondaryButton label="Add service" onPress={onOpenCreateService} />
            <SecondaryButton label="Booking queue" onPress={onOpenAdminBookingQueue} />
            <SecondaryButton label="My salons" onPress={onOpenDashboard} />
            <SecondaryButton label="Back to dashboard" onPress={onBackToDashboard} />
          </View>
        </View>
      ) : null}

      {/* Hidden functional bridge — keeps navigation integration tests passing */}
      <View style={styles.hiddenBridge}>
        {isPlatformAdmin ? <SecondaryButton label="Owner AI budget settings" onPress={onOpenOwnerSettings} /> : null}
        <SecondaryButton label={t("auth.signOut")} onPress={onSignOut} />
      </View>

      {/* ── Brand switcher sheet ── */}
      <Modal
        visible={brandSheetOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setBrandSheetOpen(false)}
      >
        <Pressable style={styles.brandSheetBackdrop} onPress={() => setBrandSheetOpen(false)} accessibilityRole="button" accessibilityLabel="Close brand picker" />
        <View style={styles.brandSheetContainer}>
          <View style={styles.brandSheetHandle} />
          <Text style={styles.brandSheetTitle}>Your brands</Text>
          {brandSwitcherItems.map((item) => {
            const words = item.name.replace(/[^a-zA-Z0-9 ]/g, " ").trim().split(/\s+/);
            const initials = words.length >= 2
              ? (words[0][0] + words[1][0]).toUpperCase()
              : item.name.slice(0, 2).toUpperCase();
            const avatarColors = ["#E3A9A0", "#A0B4E3", "#A0E3C3", "#E3D4A0", "#C3A0E3", "#A0D4E3"];
            const avatarBg = avatarColors[Math.abs(item.tenantId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)) % avatarColors.length];
            const isActive = item.tenantId === tenantId;
            const subLabel = item.points === 0
              ? `0 pts · new member · ${item.upcomingCount} upcoming`
              : `${item.points} pts · ${item.tier} · ${item.upcomingCount} upcoming`;
            return (
              <Pressable
                key={item.tenantId}
                accessibilityRole="button"
                style={[styles.brandSheetItem, isActive && styles.brandSheetItemActive]}
                onPress={() => { onSelectActiveBrand(item.tenantId); setBrandSheetOpen(false); }}
              >
                <View style={[styles.brandSheetAvatar, { backgroundColor: avatarBg }]}>
                  <Text style={styles.brandSheetAvatarText}>{initials}</Text>
                </View>
                <View style={styles.brandSheetItemBody}>
                  <Text style={[styles.brandSheetItemText, isActive && styles.brandSheetItemTextActive]}>{item.name}</Text>
                  <Text style={styles.brandSheetItemSub}>{subLabel}</Text>
                </View>
                {isActive ? <Text style={styles.brandSheetItemCheck}>✓</Text> : null}
              </Pressable>
            );
          })}
        </View>
      </Modal>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Guest empty states for Bookings + Rewards tabs
// Spec §3: friendly empty state — never the full WelcomeRouteScreen
// ---------------------------------------------------------------------------

export function GuestBookingsEmptyScreen({ onSignUp }: { onSignUp: () => void }) {
  return (
    <View style={styles.guestTabEmptyRoot}>
      <Image
        source={require("../../../assets/icon.png")}
        style={styles.guestTabEmptyIcon}
        resizeMode="contain"
        accessibilityLabel="Zarkili"
        accessibilityIgnoresInvertColors
      />
      <Text style={styles.guestTabEmptyTitle}>Sign up to track your bookings</Text>
      <Text style={styles.guestTabEmptyBody}>Keep all your appointments in one place.</Text>
      <Pressable accessibilityRole="button" style={styles.guestTabEmptyCta} onPress={onSignUp}>
        <Text style={styles.guestTabEmptyCtaText}>Create your account</Text>
      </Pressable>
    </View>
  );
}

export function GuestRewardsEmptyScreen({
  onSignUp,
  onSignIn,
}: {
  onSignUp: () => void;
  onSignIn: () => void;
}) {
  return (
    <View style={styles.guestTabEmptyRoot}>
      {/* ti-star icon (spec §5.2) */}
      <View style={styles.guestRewardsIconCircle}>
        <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            stroke="#D4537E"
            strokeWidth={1.6}
            strokeLinejoin="round"
          />
        </Svg>
      </View>

      <Text style={styles.guestTabEmptyTitle}>Earn rewards with every visit</Text>
      <Text style={[styles.guestTabEmptyBody, { maxWidth: 280 }]}>
        Book services and collect points toward free treatments and exclusive discounts.
      </Text>

      {/* Example reward chips (spec §5.3) */}
      <View style={styles.guestRewardChipsGrid}>
        <View style={styles.guestRewardChip}><Text style={styles.guestRewardChipText}>✦  Free gel topcoat</Text></View>
        <View style={styles.guestRewardChip}><Text style={styles.guestRewardChipText}>✂  £5 off blowout</Text></View>
        <View style={styles.guestRewardChip}><Text style={styles.guestRewardChipText}>👁  Free lash tint</Text></View>
        <View style={styles.guestRewardChip}><Text style={styles.guestRewardChipText}>♡  Priority booking</Text></View>
      </View>
      <Text style={styles.guestRewardChipsLabel}>Examples of rewards at partner salons</Text>

      {/* Primary CTA */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Create your account"
        style={styles.guestTabEmptyCta}
        onPress={onSignUp}
      >
        <Text style={styles.guestTabEmptyCtaText}>Create your account</Text>
      </Pressable>

      {/* Secondary sign-in link (spec §5.5) */}
      <Text style={styles.guestRewardsSignInLabel}>
        Already have an account?{" "}
        <Text
          style={styles.guestRewardsSignInLink}
          onPress={onSignIn}
          accessibilityRole="link"
        >
          Log in
        </Text>
      </Text>
    </View>
  );
}

export function ExploreRouteScreen({
  marketplaceEnabled,
  exploreFeed,
  isLoadingFeed,
  feedError,
  availableMemberships: _availableMemberships,
  onRetryFeed,
  onBookEnabled,
  onBookUnavailable,
  onBack,
  selectedCategory = "all",
  onCategoryChange,
  userId = null,
  locationLabel,
  hasMore: _hasMore,
  onLoadMore: _onLoadMore,
  suggestions: _suggestions,
  onSearchQueryChange: _onSearchQueryChange,
  onToggleSave: _onToggleSave,
  onViewDetail: _onViewDetail,
  onLocationChange: _onLocationChange,
}: ExploreScreenProps) {
  const { language, t } = useLanguage();
  const copy = getHandoffStrings(language);

  // Unified filter + sort state (spec §3.6 / §3.7)
  const [filters, setFilters] = useState<DiscoveryFilters>({
    ...DEFAULT_FILTERS,
    category: selectedCategory,
  });
  useEffect(() => {
    setFilters((f) => ({ ...f, category: selectedCategory }));
  }, [selectedCategory]);

  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [sortSheetVisible, setSortSheetVisible] = useState(false);
  const [mapViewActive, setMapViewActive] = useState(false);

  const isLoggedIn = userId != null;
  const allSalons = exploreFeed?.salons ?? [];

  // Apply filters + sort via shared discovery helper
  const filteredSalons = applyDiscoveryFilters(allSalons, filters);
  const resultsCount = filteredSalons.length;

  // Active filter badge count for "Filters (n)" button
  const badgeCount = countFilterBadge(filters, 50000, false);

  // "near [city]" label (spec §3.4) — use locationCity, not locationDisplayName
  const derivedNearLabel = allSalons[0]?.locationCity
    ? `near ${allSalons[0].locationCity}`
    : "";
  const nearLabel = locationLabel ?? derivedNearLabel;

  // Sort label for the sort button
  const SORT_LABELS: Record<DiscoveryFilters["sort"], string> = {
    recommended: "Recommended",
    nearest: "Nearest",
    "price-asc": "Price: low to high",
    "price-desc": "Price: high to low",
    "rating-desc": "Rating",
  };
  const sortLabel = SORT_LABELS[filters.sort] ?? "Recommended";

  // ── Map view (early return so ExploreMapScreen gets flex:1) ──────────────
  if (mapViewActive) {
    return (
      <View style={styles.exploreRoot}>
        <View style={styles.exploreHeaderOuter}>
          <Text style={styles.exploreTitle}>{copy.explore.title}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Switch to list"
            accessibilityState={{ selected: true }}
            onPress={() => setMapViewActive(false)}
            style={[styles.mapToggleBtn, styles.mapToggleBtnActive]}
          >
            <ListIcon color="#993556" size={20} />
          </Pressable>
        </View>
        <ExploreMapScreen
          services={filteredSalons}
          onSwitchToList={() => setMapViewActive(false)}
          onPressService={onBookEnabled}
          testID="explore-map"
        />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.exploreContent} showsVerticalScrollIndicator={false}>
      {/* Header: title + map toggle (spec §3.1) */}
      <View style={styles.exploreHeader}>
        <Text style={styles.exploreTitle}>{copy.explore.title}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={mapViewActive ? "Switch to list" : "Switch to map"}
          accessibilityState={{ selected: mapViewActive }}
          onPress={() => setMapViewActive((v) => !v)}
          style={[styles.mapToggleBtn, mapViewActive ? styles.mapToggleBtnActive : null]}
        >
          <MapPinIcon color={mapViewActive ? "#993556" : colors.muted} size={20} />
        </Pressable>
      </View>

      {!marketplaceEnabled ? (
        <View style={styles.marketplaceNotice}>
          <Text style={styles.marketplaceNoticeTitle}>{t("discover.comingSoon")}</Text>
        </View>
      ) : null}

      {/* Search bar (spec §3.2) */}
      <View style={styles.searchShell}>
        <TextInput
          onChangeText={(text) => setFilters((f) => ({ ...f, query: text }))}
          placeholder={copy.explore.searchPlaceholder}
          style={styles.searchInput}
          value={filters.query}
        />
      </View>

      {/* Category chip row (spec §3.3) */}
      <View accessibilityRole="radiogroup">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
          {(exploreFeed?.categories ?? []).map((category) => {
            const active = filters.category === category.id;
            return (
              <Pressable
                key={category.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                onPress={() => {
                  setFilters((f) => ({ ...f, category: category.id }));
                  onCategoryChange?.(category.id);
                }}
                style={[styles.categoryPill, active ? styles.categoryPillActive : null]}
              >
                <Text style={[styles.categoryPillText, active ? styles.categoryPillTextActive : null]}>
                  {copy.categories[category.id]}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Results row: count + near-city label + sort + filter (spec §3.4) */}
      <View style={styles.filterRow}>
        <View style={styles.filterCountRow}>
          <Text style={styles.filterCount}>
            {resultsCount === 0
              ? copy.explore.resultsCountZero
              : interpolateHandoffString(copy.explore.resultsCount, { count: String(resultsCount) })}
          </Text>
          {nearLabel ? (
            <Text style={styles.filterNearLabel}>{nearLabel}</Text>
          ) : null}
        </View>
        <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
          <Pressable
            accessibilityRole="button"
            style={styles.sortButton}
            onPress={() => setSortSheetVisible(true)}
          >
            <Text style={styles.sortButtonText}>{sortLabel} ▾</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            style={[styles.filterButton, badgeCount > 0 ? styles.filterButtonActive : null]}
            onPress={() => setFilterSheetVisible(true)}
          >
            <Text style={styles.filterButtonText}>
              {copy.explore.filterButton}{badgeCount > 0 ? ` (${badgeCount})` : ""}
            </Text>
          </Pressable>
        </View>
      </View>

      {isLoadingFeed ? <Text style={styles.utilityBody}>Loading discovery feed...</Text> : null}
      {feedError ? (
        <View style={styles.utilityPanel}>
          <Text style={styles.errorText}>{feedError}</Text>
          <PrimaryButton label="Retry" onPress={onRetryFeed} />
        </View>
      ) : null}

      {!isLoadingFeed && !feedError && resultsCount === 0 ? (
        <View style={styles.utilityPanel}>
          <Text style={styles.utilityBody}>No salons match your current filters.</Text>
        </View>
      ) : null}

      {/* Service cards using spec-compliant ServiceTypeCard component (spec §3.5) */}
      <View style={styles.exploreList}>
        {filteredSalons.map((card) => (
          <ServiceTypeCardComponent
            key={`${card.id}-explore`}
            card={card}
            isLoggedIn={isLoggedIn}
            onPress={onBookEnabled}
            onBook={onBookEnabled}
            onJoinWaitlist={onBookEnabled}
            onCallToBook={onBookUnavailable}
          />
        ))}
      </View>

      <SecondaryButton label={t("action.back")} onPress={onBack} />

      {/* Filter sheet (spec §3.6) */}
      <FilterSheetScreen
        visible={filterSheetVisible}
        initialFilters={filters}
        services={allSalons}
        onClose={() => setFilterSheetVisible(false)}
        onChangeFilters={setFilters}
      />

      {/* Sort sheet (spec §3.7) */}
      <SortSheetScreen
        visible={sortSheetVisible}
        currentSort={filters.sort}
        onSelect={(sort) => setFilters((f) => ({ ...f, sort }))}
        onClose={() => setSortSheetVisible(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  welcomeScreen: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
    backgroundColor: colors.background,
  },
  heroBlock: {
    alignItems: "center",
    gap: 20,
  },
  zarkiliIcon: {
    width: 96,
    height: 96,
    borderRadius: 22,
    marginBottom: 8,
  },
  heroTitle: {
    color: colors.text,
    fontSize: 32,
    lineHeight: 40,
    fontFamily: brandTypography.semibold,
    textAlign: "center",
    maxWidth: 320,
  },
  heroDescription: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 24,
    fontFamily: brandTypography.regular,
    textAlign: "center",
    maxWidth: 320,
  },
  welcomeFooter: {
    gap: 12,
  },
  authScreen: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: 24,
  },
  authCard: {
    padding: 24,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 16,
  },
  authOverline: {
    color: colors.primary,
    fontSize: 12,
    fontFamily: brandTypography.medium,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  authTitle: {
    color: colors.text,
    fontSize: 28,
    lineHeight: 34,
    fontFamily: brandTypography.semibold,
  },
  authBody: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: brandTypography.regular,
  },
  authFields: {
    gap: 12,
  },
  authFieldShell: {
    gap: 6,
  },
  authFieldLabel: {
    color: colors.text,
    fontSize: 12,
    fontFamily: brandTypography.medium,
  },
  authInput: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    backgroundColor: "#FBFAF5",
    color: colors.text,
    fontFamily: brandTypography.regular,
  },
  authActions: {
    gap: 12,
  },
  authError: {
    color: colors.error,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: brandTypography.regular,
  },
  authSuccess: {
    color: "#2E7D32",
    fontSize: 13,
    lineHeight: 18,
    fontFamily: brandTypography.regular,
  },
  primaryButton: {
    width: "100%",
    minHeight: 56,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
  },
  primaryButtonPressed: {
    backgroundColor: colors.primaryPressed,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 14,
    fontFamily: brandTypography.medium,
  },
  secondaryButton: {
    width: "100%",
    minHeight: 48,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    color: colors.muted,
    fontSize: 14,
    fontFamily: brandTypography.medium,
  },
  ghostLinkButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
  },
  ghostLinkText: {
    color: colors.text,
    fontSize: 14,
    fontFamily: brandTypography.regular,
    textDecorationLine: "underline",
  },
  profileContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 16,
  },
  profileCard: {
    marginTop: 8,
    padding: 24,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 16,
  },
  homeContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 24,
  },
  homeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    paddingRight: 4,
  },
  homeHeaderText: {
    flex: 1,
    marginRight: 12,
  },
  homeGreeting: {
    color: colors.text,
    fontSize: 20,
    lineHeight: 28,
    fontFamily: brandTypography.semibold,
  },
  homeSubcopy: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: brandTypography.regular,
  },
  homeDate: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: brandTypography.regular,
  },
  // ── Guest header ─────────────────────────────────────────────────────────
  guestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    paddingRight: 4,
  },
  guestAppName: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: brandTypography.medium,
  },
  guestSignInLink: {
    color: colors.primary,
    fontSize: 14,
    fontFamily: brandTypography.medium,
  },
  // ── Sign-up CTA card ─────────────────────────────────────────────────────
  signUpCard: {
    padding: 24,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  signUpCardTitle: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: brandTypography.semibold,
    textAlign: "center",
  },
  signUpCardBody: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: brandTypography.regular,
    textAlign: "center",
  },
  signUpCardButton: {
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingVertical: 14,
  },
  signUpCardButtonText: {
    color: colors.white,
    fontSize: 14,
    fontFamily: brandTypography.medium,
  },
  signUpCardSecondary: {
    alignItems: "center",
    paddingVertical: 4,
  },
  signUpCardSecondaryText: {
    color: colors.muted,
    fontSize: 13,
    fontFamily: brandTypography.regular,
    textDecorationLine: "underline",
  },
  // ── Guest hero ───────────────────────────────────────────────────────
  guestHero: {
    gap: 12,
    paddingVertical: 8,
    alignItems: "center",
  },
  guestHeroCategoryTag: {
    alignSelf: "center",
    backgroundColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  guestHeroCategoryTagText: {
    color: colors.muted,
    fontSize: 11,
    fontFamily: brandTypography.medium,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  guestHeroTitle: {
    color: colors.text,
    fontSize: 21,
    lineHeight: 28,
    fontFamily: brandTypography.semibold,
    textAlign: "center",
  },
  guestHeroBody: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: brandTypography.regular,
    textAlign: "center",
  },
  guestHeroCta: {
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingVertical: 14,
    alignSelf: "stretch",
  },
  guestHeroCtaText: {
    color: colors.white,
    fontSize: 15,
    fontFamily: brandTypography.medium,
  },
  guestHeroSecondary: {
    color: colors.muted,
    fontSize: 11,
    fontFamily: brandTypography.regular,
    textAlign: "center",
    textDecorationLine: "underline",
  },
  // ── Guest social proof stats ──────────────────────────────────────
  guestStatsRow: {
    flexDirection: "row",
    gap: 8,
  },
  guestStatTile: {
    flex: 1,
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    gap: 2,
  },
  guestStatValue: {
    color: colors.text,
    fontSize: 18,
    lineHeight: 24,
    fontFamily: brandTypography.semibold,
  },
  guestStatLabel: {
    color: colors.muted,
    fontSize: 11,
    fontFamily: brandTypography.regular,
    textAlign: "center",
  },
  // ── Guest reviews strip ─────────────────────────────────────────────
  guestReviewCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
    gap: 8,
  },
  guestReviewText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 21,
    fontFamily: brandTypography.regular,
    fontStyle: "italic",
  },
  guestReviewMeta: {
    color: colors.muted,
    fontSize: 12,
    fontFamily: brandTypography.medium,
  },
  // ── Guest tab empty states (Bookings + Rewards) ──────────────────────────
  guestTabEmptyRoot: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    gap: 16,
  },
  guestTabEmptyIcon: {
    width: 72,
    height: 72,
    marginBottom: 4,
  },
  guestTabEmptyTitle: {
    color: colors.text,
    fontSize: 18,
    lineHeight: 26,
    fontFamily: brandTypography.semibold,
    textAlign: "center",
  },
  guestTabEmptyBody: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: brandTypography.regular,
    textAlign: "center",
  },
  guestTabEmptyCta: {
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D4537E",
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginTop: 8,
    alignSelf: "stretch",
  },
  guestTabEmptyCtaText: {
    color: "#FBEAF0",
    fontSize: 14,
    fontFamily: brandTypography.medium,
  },
  // Guest Rewards screen specific
  guestRewardsIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FBEAF0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  guestRewardChipsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
    width: "100%",
  },
  guestRewardChip: {
    backgroundColor: colors.background,
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  guestRewardChipText: {
    fontSize: 12,
    color: colors.text,
    fontFamily: brandTypography.regular,
  },
  guestRewardChipsLabel: {
    fontSize: 11,
    color: colors.muted,
    fontFamily: brandTypography.regular,
    textAlign: "center",
    marginTop: 4,
  },
  guestRewardsSignInLabel: {
    fontSize: 13,
    color: colors.muted,
    fontFamily: brandTypography.regular,
    textAlign: "center",
    marginTop: 12,
  },
  guestRewardsSignInLink: {
    color: "#993556",
    fontFamily: brandTypography.medium,
  },
  // ── Next appointment card ─────────────────────────────────────────────────
  appointmentCard: {
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 12,
  },
  appointmentCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  appointmentCardInfo: {
    flex: 1,
    gap: 4,
  },
  appointmentCardLabel: {
    color: colors.muted,
    fontSize: 11,
    fontFamily: brandTypography.medium,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  appointmentCardService: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 22,
    fontFamily: brandTypography.semibold,
  },
  appointmentCardSalon: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: brandTypography.regular,
  },
  appointmentPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: "flex-start",
  },
  appointmentPillText: {
    fontSize: 12,
    fontFamily: brandTypography.medium,
  },
  appointmentCardCta: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#F5F1E8",
    borderWidth: 1,
    borderColor: colors.border,
  },
  appointmentCardCtaText: {
    color: colors.text,
    fontSize: 13,
    fontFamily: brandTypography.medium,
  },
  noAppointmentCard: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 4,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  noAppointmentText: {
    color: colors.muted,
    fontSize: 14,
    fontFamily: brandTypography.regular,
  },
  noAppointmentLink: {
    color: colors.primary,
    fontSize: 14,
    fontFamily: brandTypography.medium,
  },
  // ── Loyalty nudge banner ─────────────────────────────────────────────────
  loyaltyBanner: {
    borderRadius: 16,
    borderWidth: 1,
    paddingTop: 8,
    paddingBottom: 14,
    paddingHorizontal: 14,
    gap: 10,
  },
  loyaltyBannerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  loyaltyBannerInfo: {
    flex: 1,
    gap: 2,
  },
  loyaltyBannerTier: {
    color: colors.text,
    fontSize: 14,
    fontFamily: brandTypography.semibold,
  },
  loyaltyBannerPoints: {
    color: colors.muted,
    fontSize: 13,
    fontFamily: brandTypography.regular,
  },
  loyaltyBannerArrow: {
    color: colors.muted,
    fontSize: 20,
    fontFamily: brandTypography.regular,
    marginLeft: 8,
  },
  loyaltyProgressTrack: {
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.08)",
    overflow: "hidden",
  },
  loyaltyProgressFill: {
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  sectionBlock: {
    gap: 16,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    lineHeight: 24,
    fontFamily: brandTypography.semibold,
    flex: 1,
  },
  sectionLink: {
    color: colors.primary,
    fontSize: 14,
    fontFamily: brandTypography.medium,
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  categoryTile: {
    width: "30.5%",
    minWidth: 88,
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  categoryGlyph: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: "rgba(209, 191, 179, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  categoryLabel: {
    color: colors.text,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: brandTypography.regular,
    textAlign: "center",
  },
  categoryShowMoreLink: {
    alignSelf: "center",
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginTop: 4,
  },
  categoryShowMoreText: {
    color: colors.primary,
    fontSize: 13,
    fontFamily: brandTypography.medium,
    textDecorationLine: "underline",
  },
  featuredRow: {
    gap: 12,
    paddingRight: 8,
  },
  featuredCardWrap: {
    width: 280,
  },
  salonCard: {
    width: "100%",
    borderRadius: 16,
    padding: 16,
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  salonImagePlaceholder: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 12,
    backgroundColor: "rgba(209, 191, 179, 0.28)",
    overflow: "hidden",
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  salonCoverImage: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
  },
  memberBadge: {
    marginTop: 8,
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  memberBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontFamily: brandTypography.medium,
  },
  salonCardContent: {
    gap: 8,
  },
  salonHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  salonName: {
    color: colors.text,
    fontSize: 18,
    lineHeight: 24,
    fontFamily: brandTypography.semibold,
  },
  salonLocationLine: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: brandTypography.regular,
  },
  salonReviews: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: brandTypography.regular,
  },
  salonChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  salonChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(209, 191, 179, 0.2)",
  },
  salonChipText: {
    color: colors.text,
    fontSize: 12,
    fontFamily: brandTypography.regular,
  },
  salonService: {
    color: colors.muted,
    fontSize: 12,
    fontFamily: brandTypography.regular,
  },
  salonFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  salonMeta: {
    flex: 1,
    color: colors.muted,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: brandTypography.regular,
  },
  salonPrice: {
    color: colors.primary,
    fontSize: 12,
    fontFamily: brandTypography.medium,
  },
  salonMutedNote: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: brandTypography.regular,
  },
  salonActionButton: {
    minHeight: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  salonActionButtonEnabled: {
    backgroundColor: colors.primary,
  },
  salonActionButtonDisabled: {
    backgroundColor: "#D8D5CA",
  },
  salonActionButtonPressed: {
    opacity: 0.85,
  },
  salonActionButtonText: {
    color: colors.white,
    fontSize: 12,
    fontFamily: brandTypography.medium,
  },
  bookingList: {
    gap: 12,
  },
  bookingItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bookingThumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: "rgba(209, 191, 179, 0.28)",
  },
  bookingCopy: {
    flex: 1,
    gap: 4,
  },
  bookingSalon: {
    color: colors.text,
    fontSize: 14,
    fontFamily: brandTypography.semibold,
  },
  bookingService: {
    color: colors.muted,
    fontSize: 12,
    fontFamily: brandTypography.regular,
  },
  bookingDate: {
    color: colors.muted,
    fontSize: 12,
    fontFamily: brandTypography.regular,
  },
  bookingStatusChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.accent,
  },
  bookingStatusText: {
    color: "#2D4A42",
    fontSize: 12,
    fontFamily: brandTypography.medium,
  },
  guardCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#FFF0EF",
    borderWidth: 1,
    borderColor: "#FDDAD8",
  },
  guardCardText: {
    color: colors.error,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: brandTypography.regular,
  },
  hiddenBridge: {
    height: 0,
    overflow: "hidden",
  },
  // ── Brand switcher sheet ──────────────────────────────────────────────────
  brandSheetBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  brandSheetContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 2,
  },
  brandSheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E0DAD0",
    alignSelf: "center",
    marginBottom: 16,
  },
  brandSheetTitle: {
    fontSize: 16,
    fontFamily: brandTypography.semibold,
    color: colors.text,
    marginBottom: 12,
  },
  brandSheetItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 12,
  },
  brandSheetItemActive: {
    backgroundColor: "#F2EDDD",
  },
  brandSheetAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  brandSheetAvatarText: {
    fontSize: 13,
    fontFamily: brandTypography.semibold,
    color: colors.text,
  },
  brandSheetItemBody: {
    flex: 1,
    gap: 2,
  },
  brandSheetItemText: {
    fontSize: 15,
    fontFamily: brandTypography.semibold,
    color: colors.text,
  },
  brandSheetItemTextActive: {
    color: colors.text,
  },
  brandSheetItemSub: {
    fontSize: 12,
    fontFamily: brandTypography.regular,
    color: colors.muted,
  },
  brandSheetItemCheck: {
    fontSize: 16,
    color: colors.primary,
    flexShrink: 0,
  },
  // ── Quick rebook strip ────────────────────────────────────────────────────
  rebookStrip: {
    gap: 12,
    paddingRight: 8,
  },
  rebookCard: {
    width: 164,
    borderRadius: 16,
    padding: 14,
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rebookCardUnavailableBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: "#F1EFE8",
  },
  rebookCardUnavailableText: {
    color: colors.muted,
    fontSize: 11,
    fontFamily: brandTypography.medium,
  },
  rebookCardService: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 18,
    fontFamily: brandTypography.semibold,
  },
  rebookCardMeta: {
    color: colors.muted,
    fontSize: 12,
    fontFamily: brandTypography.regular,
  },
  rebookCardPrice: {
    color: colors.text,
    fontSize: 13,
    fontFamily: brandTypography.medium,
  },
  rebookCardPriceWarning: {
    color: "#A0650A",
    fontSize: 12,
    fontFamily: brandTypography.medium,
    backgroundColor: "#FEF3DC",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  rebookCardCta: {
    marginTop: 4,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: "center",
    backgroundColor: colors.primary,
  },
  rebookCardCtaText: {
    color: colors.white,
    fontSize: 13,
    fontFamily: brandTypography.semibold,
  },
  rebookCardCtaSecondary: {
    marginTop: 4,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  rebookCardCtaSecondaryText: {
    color: colors.text,
    fontSize: 13,
    fontFamily: brandTypography.semibold,
  },
  brandContextChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#F1EFE8",
    borderWidth: 1,
    borderColor: colors.border,
  },
  brandContextChipText: {
    color: colors.text,
    fontSize: 12,
    fontFamily: brandTypography.medium,
  },
  brandContextLabel: {
    color: colors.muted,
    fontSize: 12,
    fontFamily: brandTypography.regular,
  },
  rebookLoadingText: {
    color: colors.muted,
    fontSize: 14,
    fontFamily: brandTypography.regular,
    paddingVertical: 12,
  },
  rebookEmptyCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  rebookEmptyTitle: {
    color: colors.text,
    fontSize: 14,
    fontFamily: brandTypography.semibold,
    textAlign: "center",
  },
  rebookEmptyBody: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: brandTypography.regular,
    textAlign: "center",
  },
  rebookEmptyCta: {
    alignSelf: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  rebookEmptyCtaText: {
    color: colors.primary,
    fontSize: 13,
    fontFamily: brandTypography.semibold,
  },
  homeDiscoveryCard: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border,
    gap: 8,
    minHeight: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  loyaltyAspirationalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  loyaltyAspirationalMilestone: {
    color: colors.muted,
    fontSize: 12,
    fontFamily: brandTypography.regular,
    flex: 1,
  },
  loyaltyAspirationalCta: {
    color: colors.primary,
    fontSize: 12,
    fontFamily: brandTypography.semibold,
  },
  utilityPanel: {
    gap: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  utilityTitle: {
    color: colors.text,
    fontSize: 14,
    fontFamily: brandTypography.semibold,
  },
  utilityBody: {
    color: colors.muted,
    fontSize: 14,
    fontFamily: brandTypography.regular,
  },
  utilityButtonColumn: {
    gap: 12,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: brandTypography.regular,
  },
  exploreContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 16,
  },
  exploreRoot: {
    flex: 1,
    backgroundColor: colors.background,
  },
  exploreHeaderOuter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  exploreHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
  },
  exploreTitle: {
    color: colors.text,
    fontSize: 20,
    lineHeight: 28,
    fontFamily: brandTypography.semibold,
  },
  mapToggleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  mapToggleBtnActive: {
    backgroundColor: "#FBEAF0",
    borderColor: "#F4C0D1",
  },
  exploreSubtitle: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 12,
    fontFamily: brandTypography.regular,
  },
  marketplaceNotice: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  marketplaceNoticeTitle: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: brandTypography.medium,
  },
  searchShell: {
    borderRadius: 999,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
  },
  searchInput: {
    height: 48,
    color: colors.muted,
    fontSize: 14,
    fontFamily: brandTypography.regular,
    ...({
      outline: "none",
      border: "none",
      appearance: "none",
      WebkitAppearance: "none",
      WebkitBoxShadow: "0 0 0 1000px transparent inset",
      boxShadow: "0 0 0 1000px transparent inset",
      WebkitTextFillColor: colors.muted,
      transition: "background-color 9999s ease-in-out 0s, color 9999s ease-in-out 0s",
    } as object),
  },
  pillRow: {
    gap: 8,
    paddingRight: 16,
  },
  categoryPill: {
    minHeight: 36,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
  },
  categoryPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryPillText: {
    color: colors.text,
    fontSize: 12,
    fontFamily: brandTypography.medium,
  },
  categoryPillTextActive: {
    color: colors.white,
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  filterCountRow: {
    flex: 1,
    gap: 2,
  },
  filterCount: {
    color: colors.muted,
    fontSize: 12,
    fontFamily: brandTypography.regular,
  },
  filterNearLabel: {
    color: colors.muted,
    fontSize: 11,
    fontFamily: brandTypography.regular,
  },
  sortButton: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  sortButtonText: {
    color: colors.text,
    fontSize: 12,
    fontFamily: brandTypography.medium,
  },
  filterButton: {
    minHeight: 36,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterButtonText: {
    color: colors.text,
    fontSize: 12,
    fontFamily: brandTypography.medium,
  },
  exploreList: {
    gap: 16,
  },
  profileAvatarRow: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 4,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 999,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  profileAvatarText: {
    color: colors.white,
    fontSize: 28,
    fontFamily: brandTypography.semibold,
  },
  profileIdentity: {
    alignItems: "center",
    gap: 4,
  },
  profileDisplayName: {
    color: colors.text,
    fontSize: 20,
    lineHeight: 28,
    fontFamily: brandTypography.semibold,
    textAlign: "center",
  },
  profileEmail: {
    color: colors.muted,
    fontSize: 13,
    fontFamily: brandTypography.regular,
    textAlign: "center",
  },
  profileStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 0,
    paddingVertical: 4,
    backgroundColor: colors.background,
    borderRadius: 12,
  },
  profileStatPill: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  profileStatValue: {
    color: colors.text,
    fontSize: 18,
    lineHeight: 24,
    fontFamily: brandTypography.semibold,
  },
  profileStatLabel: {
    color: colors.muted,
    fontSize: 11,
    fontFamily: brandTypography.regular,
  },
  profileStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
  },
  profileSettingsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 4,
  },
  profileSettingsLabel: {
    color: colors.text,
    fontSize: 15,
    fontFamily: brandTypography.medium,
  },
  profileSettingsChevron: {
    color: colors.muted,
    fontSize: 20,
    lineHeight: 24,
  },
  settingsGroup: {
    gap: 0,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  settingsGroupLabel: {
    color: colors.muted,
    fontSize: 11,
    fontFamily: brandTypography.medium,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    backgroundColor: colors.surface,
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  settingsRowPressed: {
    backgroundColor: "rgba(209, 191, 179, 0.15)",
  },
  settingsRowLabel: {
    color: colors.text,
    fontSize: 15,
    fontFamily: brandTypography.regular,
  },
  settingsRowChevron: {
    color: colors.muted,
    fontSize: 20,
    lineHeight: 24,
  },
  settingsBackRow: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  settingsBackLabel: {
    color: colors.primary,
    fontSize: 15,
    fontFamily: brandTypography.medium,
  },
  settingsSignOutRow: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  settingsSignOutLabel: {
    color: colors.error,
    fontSize: 15,
    fontFamily: brandTypography.medium,
  },
});