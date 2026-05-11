/**
 * Shared UI primitives barrel — W21 Batch A foundation.
 */

export * from "./tokens";
export { Button } from "./Button";
export type { ButtonProps, ButtonSize, ButtonVariant } from "./Button";
export { InputField } from "./InputField";
export type { InputFieldProps, InputFieldVariant } from "./InputField";
export { FormRow } from "./FormRow";
export type { FormRowProps } from "./FormRow";
export { SegmentedControl } from "./SegmentedControl";
export type { SegmentedControlProps, SegmentedOption } from "./SegmentedControl";
export { Stepper } from "./Stepper";
export type { StepperProps } from "./Stepper";
export { Banner } from "./Banner";
export type { BannerProps, BannerVariant } from "./Banner";
export { brandTypography } from "./brandTypography";

// W22 Batch B primitives
export { RatingStars } from "./RatingStars";
export type { RatingStarsProps, RatingStarsSize } from "./RatingStars";
export { RangeSlider } from "./RangeSlider";
export type {
  RangeSliderProps,
  SingleRangeSliderProps,
  DualRangeSliderProps,
} from "./RangeSlider";
export { FilterSheet } from "./FilterSheet";
export type { FilterSheetProps } from "./FilterSheet";
export { GalleryCarousel } from "./GalleryCarousel";
export type { GalleryCarouselItem, GalleryCarouselProps } from "./GalleryCarousel";
export { SalonHeroCard } from "./SalonHeroCard";
export type { SalonHeroCardProps } from "./SalonHeroCard";
export { StaffAvatarList } from "./StaffAvatarList";
export type { StaffAvatarItem, StaffAvatarListProps } from "./StaffAvatarList";
export { StickyCtaBar } from "./StickyCtaBar";
export type { StickyCtaBarProps } from "./StickyCtaBar";

// W23 Batch C primitives
export { CalendarGrid, toIsoDate } from "./CalendarGrid";
export type { CalendarGridProps, CalendarAvailability } from "./CalendarGrid";
export { TimeSlotChip } from "./TimeSlotChip";
export type { TimeSlotChipProps } from "./TimeSlotChip";
export { SummaryRow } from "./SummaryRow";
export type { SummaryRowProps } from "./SummaryRow";
export { StickyFooterCta } from "./StickyFooterCta";
export type { StickyFooterCtaProps } from "./StickyFooterCta";
export { ModalSheet } from "./ModalSheet";
export type { ModalSheetProps } from "./ModalSheet";
export { PolicyAcknowledgement } from "./PolicyAcknowledgement";
export type { PolicyAcknowledgementProps } from "./PolicyAcknowledgement";

// W24 Batch D primitives
export { PaymentMethodRow } from "./PaymentMethodRow";
export type { PaymentMethodRowProps } from "./PaymentMethodRow";
export { CurrencyInput } from "./CurrencyInput";
export type { CurrencyInputProps } from "./CurrencyInput";
export { TipPresetChipGroup } from "./TipPresetChipGroup";
export type { TipPresetChipGroupProps, TipPresetChipItem } from "./TipPresetChipGroup";
export { ReceiptLineItem } from "./ReceiptLineItem";
export type { ReceiptLineItemRowProps } from "./ReceiptLineItem";

// W25 Batch E primitives — Loyalty, Activities, Reviews
export { ProgressRing } from "./ProgressRing";
export type { ProgressRingProps, ProgressRingSize, ProgressRingState } from "./ProgressRing";
export { TierBadge } from "./TierBadge";
export type { TierBadgeProps, TierVariant } from "./TierBadge";
export { RewardCard } from "./RewardCard";
export type { RewardCardProps, RewardCardState } from "./RewardCard";
export { RatingSelector } from "./RatingSelector";
export type { RatingSelectorProps, RatingSelectorSize, RatingSelectorState } from "./RatingSelector";
export { PhotoUploadTile } from "./PhotoUploadTile";
export type { PhotoUploadTileProps, PhotoUploadTileState } from "./PhotoUploadTile";

// W26 Batch F primitives — Messaging, Notifications, Waitlist
export { ChatBubble } from "./ChatBubble";
export type { ChatBubbleProps, ChatBubbleDirection, ChatBubbleStatus } from "./ChatBubble";
export { AttachmentTile } from "./AttachmentTile";
export type { AttachmentTileProps, AttachmentTileType } from "./AttachmentTile";
export { QuickReplyChip } from "./QuickReplyChip";
export type { QuickReplyChipProps } from "./QuickReplyChip";
export { NotificationRow } from "./NotificationRow";
export type { NotificationRowProps, NotificationRowTone } from "./NotificationRow";
export { PreferenceToggleRow } from "./PreferenceToggleRow";
export type { PreferenceToggleRowProps } from "./PreferenceToggleRow";

// W27 Batch G primitives — Staff App + AI
export { QueueCard } from "./QueueCard";
export type { QueueCardProps } from "./QueueCard";
export { ClientHeader } from "./ClientHeader";
export type { ClientHeaderProps } from "./ClientHeader";
export { AISuggestionCard } from "./AISuggestionCard";
export type { AISuggestionCardProps, AISuggestionState } from "./AISuggestionCard";
export { AIChatComposer } from "./AIChatComposer";
export type { AIChatComposerProps, AIChatComposerState } from "./AIChatComposer";

// W28 Batch H primitives — Marketplace Consumer
export { PostCard } from "./PostCard";
export type { PostCardProps } from "./PostCard";
export { SaveToggle, SavedToast } from "./SaveToggle";
export type { SaveToggleProps, SavedToastProps } from "./SaveToggle";
export { ShareTargetRow } from "./ShareTargetRow";
export type { ShareTargetRowProps } from "./ShareTargetRow";

// W29 Batch I primitives — Legal, Lifecycle, Settings, Auth Edges
export { MfaOtpInput } from "./MfaOtpInput";
export type { MfaOtpInputProps } from "./MfaOtpInput";
export { LegalPageLayout } from "./LegalPageLayout";
export type { LegalPageLayoutProps, LegalJumpLink } from "./LegalPageLayout";
export { ConsentToggleList } from "./ConsentToggleList";
export type { ConsentToggleListProps, ConsentItem } from "./ConsentToggleList";
export { DeletionConfirmationModal } from "./DeletionConfirmationModal";
export type { DeletionConfirmationModalProps } from "./DeletionConfirmationModal";
export { DeviceRow } from "./DeviceRow";
export type { DeviceRowProps } from "./DeviceRow";
export { RecoveryCodesList } from "./RecoveryCodesList";
export type { RecoveryCodesListProps } from "./RecoveryCodesList";

// W30 Batch J primitives — Booking, Payments, Discovery, Reviews Edges
export { SearchSuggestionRow } from "./SearchSuggestionRow";
export type { SearchSuggestionRowProps, SearchSuggestionRowType } from "./SearchSuggestionRow";
export { HelpfulUnhelpfulChip } from "./HelpfulUnhelpfulChip";
export type { HelpfulUnhelpfulChipProps, HelpfulVote } from "./HelpfulUnhelpfulChip";
export { ConflictRecoveryModal } from "./ConflictRecoveryModal";
export type { ConflictRecoveryModalProps, ConflictRecoveryState } from "./ConflictRecoveryModal";
export { ThreeDsOverlay } from "./ThreeDsOverlay";
export type { ThreeDsOverlayProps, ThreeDsState } from "./ThreeDsOverlay";
export { MapCluster } from "./MapCluster";
export type { MapClusterProps } from "./MapCluster";

// W31 Batch K primitives — AI, Messaging, Notifications, Loyalty, Marketplace, Staff extras
export { AIFeedbackBar } from "./AIFeedbackBar";
export type { AIFeedbackBarProps, AIFeedbackVote } from "./AIFeedbackBar";
export { ExplainabilitySheet } from "./ExplainabilitySheet";
export type { ExplainabilitySheetProps, ExplainabilityReason } from "./ExplainabilitySheet";
export { ChannelPreferenceMatrix } from "./ChannelPreferenceMatrix";
export type {
  ChannelPreferenceMatrixProps,
  ChannelPreferenceMap,
  NotificationChannel,
  NotificationEventType,
} from "./ChannelPreferenceMatrix";
export { TierUpCelebration } from "./TierUpCelebration";
export type { TierUpCelebrationProps, LoyaltyTier } from "./TierUpCelebration";
export { FollowToggle } from "./FollowToggle";
export type { FollowToggleProps } from "./FollowToggle";
export { WalkInForm } from "./WalkInForm";
export type { WalkInFormProps, WalkInFormData, WalkInFormState, WalkInService } from "./WalkInForm";

// W32 Batch L primitives — Cross-cutting platform, i18n, store readiness, release
export { ForceUpdateGate } from "./ForceUpdateGate";
export type { ForceUpdateGateProps } from "./ForceUpdateGate";
export { OfflineBanner } from "./OfflineBanner";
export type { OfflineBannerProps, OfflineBannerStatus } from "./OfflineBanner";
export { CoachMark } from "./CoachMark";
export type { CoachMarkProps } from "./CoachMark";
export { RateTheAppPrompt } from "./RateTheAppPrompt";
export type { RateTheAppPromptProps } from "./RateTheAppPrompt";
export { LanguagePicker } from "./LanguagePicker";
export type { LanguagePickerProps, SupportedLocale } from "./LanguagePicker";
export { PermissionsGate } from "./PermissionsGate";
export type { PermissionsGateProps, PermissionType } from "./PermissionsGate";
