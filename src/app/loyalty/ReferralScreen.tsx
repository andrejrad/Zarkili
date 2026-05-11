/**
 * ReferralScreen.tsx — E.9 Referral / Invite Friends.
 *
 * Hero illustration + heading "Give $10, get $10" + offer description.
 * Referral code box (copyable, formatted) + Share button.
 * Stats row: invited / joined / earned. FAQ collapsible.
 * States: default | copied | error.
 */

import { Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";

import { Banner, colors, radius, spacing, textStyles } from "../../shared/ui";
import { formatReferralCode, type ReferralStats } from "./loyaltyHelpers";

export type ReferralScreenState = "default" | "copied" | "error";

export type FaqItem = {
  question: string;
  answer: string;
};

export type ReferralScreenProps = {
  rawCode: string; // e.g. "ZARK12AB" → formatted by formatReferralCode
  stats: ReferralStats;
  faqItems?: readonly FaqItem[];
  screenState?: ReferralScreenState;
  errorMessage?: string;
  onCopy: () => void;
  onPressBack?: () => void;
  onRetry?: () => void;
  testID?: string;
};

const DEFAULT_FAQ: FaqItem[] = [
  {
    question: "How do I earn the $10?",
    answer: "Once a friend you invited books their first appointment, you both receive $10 in credits.",
  },
  {
    question: "Is there a limit?",
    answer: "You can earn up to $200 in referral credits per year.",
  },
  {
    question: "When do credits expire?",
    answer: "Credits expire 12 months after they are issued.",
  },
];

export function ReferralScreen({
  rawCode,
  stats,
  faqItems = DEFAULT_FAQ,
  screenState = "default",
  errorMessage,
  onCopy,
  onPressBack,
  onRetry,
  testID,
}: ReferralScreenProps) {
  const formattedCode = formatReferralCode(rawCode);
  const isCopied = screenState === "copied";
  const isError = screenState === "error";

  async function handleShare() {
    try {
      await Share.share({
        message: `Join me on Zarkili and we both get $10! Use my code: ${formattedCode}`,
        title: "Invite a friend to Zarkili",
      });
    } catch {
      // User cancelled — no-op
    }
  }

  return (
    <View style={styles.root} testID={testID}>
      {/* Header */}
      <View style={styles.header}>
        {onPressBack ? (
          <Pressable
            onPress={onPressBack}
            accessibilityRole="button"
            accessibilityLabel="Back"
            style={styles.backBtn}
          >
            <Text style={styles.backGlyph}>←</Text>
          </Pressable>
        ) : null}
        <Text style={styles.headerTitle}>Invite Friends</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {isError && (
          <Banner
            variant="error"
            message={errorMessage ?? "Unable to load your referral code. Try again."}
          />
        )}

        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroEmoji} accessible={false}>🎁</Text>
          <Text style={styles.heroHeading}>Give $10, get $10</Text>
          <Text style={styles.heroBody}>
            Share your code with friends. When they book their first appointment,
            you each receive $10 in credits. Terms apply.
          </Text>
        </View>

        {/* Referral code */}
        <View style={styles.codeSection}>
          <Text style={styles.codeSectionLabel}>Your referral code</Text>
          <View style={styles.codeBox}>
            <Text style={styles.codeText} accessibilityLabel={`Referral code: ${rawCode}`} selectable>
              {formattedCode}
            </Text>
            <Pressable
              onPress={onCopy}
              style={[styles.copyBtn, isCopied ? styles.copyBtnDone : null]}
              accessibilityRole="button"
              accessibilityLabel={isCopied ? "Copied!" : "Copy code"}
              testID={testID ? `${testID}-copy` : undefined}
            >
              <Text style={[styles.copyBtnText, isCopied ? styles.copyBtnTextDone : null]}>
                {isCopied ? "Copied!" : "Copy"}
              </Text>
            </Pressable>
          </View>

          <Pressable
            onPress={handleShare}
            style={styles.shareBtn}
            accessibilityRole="button"
            accessibilityLabel="Share referral code"
            testID={testID ? `${testID}-share` : undefined}
          >
            <Text style={styles.shareText}>Share</Text>
          </Pressable>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow} accessible accessibilityLabel={`Referral stats: ${stats.invited} invited, ${stats.joined} joined, $${stats.earned} earned`}>
          <StatBox label="Invited" value={String(stats.invited)} />
          <View style={styles.statsDivider} />
          <StatBox label="Joined" value={String(stats.joined)} />
          <View style={styles.statsDivider} />
          <StatBox label="Earned" value={`$${stats.earned}`} highlight />
        </View>

        {/* FAQ */}
        {faqItems.length > 0 ? (
          <View style={styles.faqSection}>
            <Text style={styles.faqTitle}>Frequently asked questions</Text>
            {faqItems.map((item, i) => (
              // eslint-disable-next-line react/no-array-index-key
              <FaqRow key={i} item={item} />
            ))}
          </View>
        ) : null}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

/* ---------- Support ---------- */

function StatBox({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statValue, highlight ? styles.statValueHighlight : null]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function FaqRow({ item }: { item: FaqItem }) {
  return (
    <View style={styles.faqRow}>
      <Text style={styles.faqQ}>{item.question}</Text>
      <Text style={styles.faqA}>{item.answer}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    height: 56,
    paddingHorizontal: spacing.s4,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s3,
    backgroundColor: colors.background,
  },
  backBtn: { width: 44, height: 44, alignItems: "flex-start", justifyContent: "center" },
  backGlyph: { fontSize: 20, color: colors.foreground },
  headerTitle: { ...textStyles.heading3, color: colors.foreground, flex: 1 },
  scroll: { padding: spacing.s4, gap: spacing.s6, paddingBottom: 32 },
  hero: { alignItems: "center", gap: spacing.s3 },
  heroEmoji: { fontSize: 72 },
  heroHeading: { ...textStyles.heading2, color: colors.foreground, textAlign: "center" },
  heroBody: { ...textStyles.body, color: colors.textMuted, textAlign: "center" },
  codeSection: { gap: spacing.s3 },
  codeSectionLabel: { ...textStyles.label, color: colors.foreground },
  codeBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.s4,
    gap: spacing.s3,
  },
  codeText: {
    ...textStyles.heading3,
    color: colors.foreground,
    flex: 1,
    letterSpacing: 4,
  },
  copyBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.s4,
    paddingVertical: spacing.s2,
    minWidth: 72,
    alignItems: "center",
  },
  copyBtnDone: { backgroundColor: colors.accent },
  copyBtnText: { ...textStyles.label, color: colors.white },
  copyBtnTextDone: { color: colors.accentForeground },
  shareBtn: {
    height: spacing.touchTarget,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  shareText: { ...textStyles.label, color: colors.primary },
  statsRow: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.s4,
  },
  statBox: { flex: 1, alignItems: "center", gap: 4 },
  statsDivider: { width: 1, backgroundColor: colors.border },
  statValue: { ...textStyles.heading3, color: colors.foreground },
  statValueHighlight: { color: colors.accentForeground },
  statLabel: { ...textStyles.bodySmall, color: colors.textMuted },
  faqSection: { gap: spacing.s3 },
  faqTitle: { ...textStyles.label, color: colors.foreground },
  faqRow: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.s4,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.s2,
  },
  faqQ: { ...textStyles.label, color: colors.foreground },
  faqA: { ...textStyles.body, color: colors.textMuted },
});
