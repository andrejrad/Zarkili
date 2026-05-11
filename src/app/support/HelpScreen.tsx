/**
 * HelpScreen.tsx — I.10 Help / FAQ / Contact Support.
 *
 * States:
 *  - "default"        → category grid + featured articles
 *  - "search-results" → filtered article list
 *  - "no-results"     → empty state
 *  - "sending"        → contact form submitting
 *  - "sent"           → ticket confirmation (ticket number shown)
 *  - "error"          → error state
 */

import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Banner, Button, InputField, ModalSheet, colors, radius, spacing, textStyles } from "../../shared/ui";

export type HelpScreenState =
  | "default"
  | "search-results"
  | "no-results"
  | "sending"
  | "sent"
  | "error";

export type HelpArticle = {
  id: string;
  title: string;
  category: string;
};

export type HelpCategory = {
  id: string;
  label: string;
  icon: string;
};

export type HelpScreenProps = {
  state?: HelpScreenState;
  articles?: HelpArticle[];
  searchQuery?: string;
  ticketNumber?: string;
  contactEmail?: string;
  contactError?: string | null;
  onSearchChange: (query: string) => void;
  onSelectArticle: (id: string) => void;
  onSelectCategory: (id: string) => void;
  onSubmitContact: (subject: string, body: string) => void;
  testID?: string;
};

const DEFAULT_CATEGORIES: HelpCategory[] = [
  { id: "getting-started", label: "Getting started", icon: "🚀" },
  { id: "bookings", label: "Bookings", icon: "📅" },
  { id: "payments", label: "Payments", icon: "💳" },
  { id: "loyalty", label: "Loyalty", icon: "⭐" },
  { id: "account", label: "Account", icon: "👤" },
  { id: "privacy", label: "Privacy", icon: "🔒" },
];

export function HelpScreen({
  state = "default",
  articles = [],
  searchQuery = "",
  ticketNumber,
  contactEmail = "",
  contactError,
  onSearchChange,
  onSelectArticle,
  onSelectCategory,
  onSubmitContact,
  testID,
}: HelpScreenProps) {
  const [contactVisible, setContactVisible] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  function handleSubmitContact() {
    onSubmitContact(subject, body);
  }

  if (state === "sent") {
    return (
      <View style={styles.centered} testID={testID}>
        <Text style={styles.sentIcon}>{"✉️"}</Text>
        <Text style={styles.sentTitle}>Message sent</Text>
        {ticketNumber ? (
          <Text
            style={styles.sentTicket}
            testID={testID ? `${testID}-ticket` : undefined}
          >
            {`Ticket #${ticketNumber}`}
          </Text>
        ) : null}
        <Text style={styles.sentBody}>
          We'll get back to you via email within 1–2 business days.
        </Text>
        <Button
          label="Back to Help"
          variant="tertiary"
          onPress={() => onSearchChange("")}
          testID={testID ? `${testID}-back` : undefined}
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      testID={testID}
    >
      {/* Search bar */}
      <InputField
        label=""
        placeholder="Search help articles…"
        value={searchQuery}
        onChangeText={onSearchChange}
        testID={testID ? `${testID}-search` : undefined}
      />

      {(state === "error" || contactError) ? (
        <Banner
          variant="error"
          message={contactError ?? "Something went wrong. Please try again."}
          testID={testID ? `${testID}-error-banner` : undefined}
        />
      ) : null}

      {state === "no-results" ? (
        <View style={styles.noResults} testID={testID ? `${testID}-no-results` : undefined}>
          <Text style={styles.noResultsTitle}>No results found</Text>
          <Text style={styles.noResultsBody}>
            Try different keywords or contact support below.
          </Text>
        </View>
      ) : state === "search-results" ? (
        <View>
          <Text style={styles.sectionLabel}>Results</Text>
          {articles.map((article) => (
            <Pressable
              key={article.id}
              style={styles.articleRow}
              onPress={() => onSelectArticle(article.id)}
              accessibilityRole="button"
              testID={testID ? `${testID}-article-${article.id}` : undefined}
            >
              <Text style={styles.articleCategory}>{article.category}</Text>
              <Text style={styles.articleTitle}>{article.title}</Text>
              <Text style={styles.articleChevron}>{"›"}</Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <>
          {/* Category grid */}
          <Text style={styles.sectionLabel}>Browse by topic</Text>
          <View style={styles.categoryGrid}>
            {DEFAULT_CATEGORIES.map((cat) => (
              <Pressable
                key={cat.id}
                style={styles.categoryCard}
                onPress={() => onSelectCategory(cat.id)}
                accessibilityRole="button"
                testID={testID ? `${testID}-category-${cat.id}` : undefined}
              >
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                <Text style={styles.categoryLabel}>{cat.label}</Text>
              </Pressable>
            ))}
          </View>

          {/* Featured articles */}
          {articles.length > 0 ? (
            <View>
              <Text style={styles.sectionLabel}>Featured articles</Text>
              {articles.map((article) => (
                <Pressable
                  key={article.id}
                  style={styles.articleRow}
                  onPress={() => onSelectArticle(article.id)}
                  accessibilityRole="button"
                  testID={testID ? `${testID}-article-${article.id}` : undefined}
                >
                  <Text style={styles.articleCategory}>{article.category}</Text>
                  <Text style={styles.articleTitle}>{article.title}</Text>
                  <Text style={styles.articleChevron}>{"›"}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </>
      )}

      {/* Contact support CTA */}
      <Button
        label="Contact support"
        variant="tertiary"
        onPress={() => setContactVisible(true)}
        testID={testID ? `${testID}-contact-cta` : undefined}
      />

      {/* Contact form modal */}
      <ModalSheet
        visible={contactVisible}
        onClose={() => setContactVisible(false)}
        title="Contact support"
        testID={testID ? `${testID}-contact-modal` : undefined}
        footer={
          <Button
            label={state === "sending" ? "Sending..." : "Send"}
            variant="primary"
            disabled={!subject.trim() || !body.trim() || state === "sending"}
            loading={state === "sending"}
            onPress={handleSubmitContact}
            testID={testID ? `${testID}-send` : undefined}
          />
        }
      >
        <View style={styles.contactForm}>
          <InputField
            label="Subject"
            value={subject}
            onChangeText={setSubject}
            testID={testID ? `${testID}-subject` : undefined}
          />
          <View style={styles.gap} />
          <InputField
            label="Message"
            value={body}
            onChangeText={setBody}
            testID={testID ? `${testID}-body` : undefined}
          />
          {contactEmail ? (
            <Text style={styles.replyTo}>We'll reply to {contactEmail}</Text>
          ) : null}
        </View>
      </ModalSheet>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.pageHorizontal,
    paddingBottom: spacing.s12,
    gap: spacing.s4,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.pageHorizontal,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.s4,
  },
  sectionLabel: {
    ...textStyles.label,
    color: colors.foreground,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.s3,
  },
  categoryCard: {
    width: "30%",
    aspectRatio: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.s2,
    padding: spacing.s2,
  },
  categoryIcon: {
    fontSize: 24,
  },
  categoryLabel: {
    ...textStyles.bodySmall,
    color: colors.foreground,
    textAlign: "center",
  },
  articleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.s3,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.s2,
  },
  articleCategory: {
    ...textStyles.labelSmall,
    color: colors.textMuted,
    width: 80,
  },
  articleTitle: {
    ...textStyles.body,
    color: colors.foreground,
    flex: 1,
  },
  articleChevron: {
    ...textStyles.heading4,
    color: colors.textMuted,
  },
  noResults: {
    alignItems: "center",
    padding: spacing.s6,
    gap: spacing.s2,
  },
  noResultsTitle: {
    ...textStyles.heading4,
    color: colors.foreground,
  },
  noResultsBody: {
    ...textStyles.body,
    color: colors.textMuted,
    textAlign: "center",
  },
  contactForm: {
    paddingBottom: spacing.s4,
  },
  gap: {
    height: spacing.s4,
  },
  replyTo: {
    ...textStyles.bodySmall,
    color: colors.textMuted,
    marginTop: spacing.s3,
  },
  sentIcon: {
    fontSize: 48,
  },
  sentTitle: {
    ...textStyles.heading3,
    color: colors.foreground,
    textAlign: "center",
  },
  sentTicket: {
    ...textStyles.labelLarge,
    color: colors.primary,
  },
  sentBody: {
    ...textStyles.body,
    color: colors.textMuted,
    textAlign: "center",
  },
});
