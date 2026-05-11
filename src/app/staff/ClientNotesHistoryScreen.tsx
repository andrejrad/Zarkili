/**
 * ClientNotesHistoryScreen.tsx — W27 Batch G screen G.5.
 *
 * Staff-facing notes and visit history feed for a client.
 * Sections:
 *  – ClientHeader (with loading shimmer)
 *  – "Add note" FAB sticky bar
 *  – Chronological feed: note entries and auto-generated visit summaries
 *
 * States: default | loading | error | empty
 */

import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  ClientHeader,
  colors,
  radius,
  spacing,
  textStyles,
} from "../../shared/ui";
import type { ClientDetail, ClientNoteEntry } from "./staffHelpers";
import { formatLtv } from "./staffHelpers";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ClientNotesHistoryScreenProps = {
  client: ClientDetail | null;
  notes: ClientNoteEntry[];
  isLoading?: boolean;
  isError?: boolean;
  onPressRetry?: () => void;
  onPressAddNote?: () => void;
  onPressNote?: (noteId: string) => void;
  testID?: string;
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export function ClientNotesHistoryScreen({
  client,
  notes,
  isLoading = false,
  isError = false,
  onPressRetry,
  onPressAddNote,
  onPressNote,
  testID,
}: ClientNotesHistoryScreenProps) {
  if (isError) {
    return (
      <View style={[styles.root, styles.centered]} testID={testID}>
        <Text style={styles.errorTitle}>Couldn't load notes</Text>
        <Text style={styles.errorBody}>Check your connection and try again.</Text>
        {onPressRetry && (
          <Pressable style={styles.primaryBtn} onPress={onPressRetry} accessibilityRole="button">
            <Text style={styles.primaryBtnText}>Retry</Text>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <View style={styles.root} testID={testID}>
      {/* ClientHeader — handles own shimmer */}
      <ClientHeader
        clientName={client?.name ?? ""}
        initials={client?.initials ?? ""}
        tier={client?.tier ?? "locked"}
        isVIP={client?.isVIP ?? false}
        phone={client?.phone ?? null}
        email={client?.email ?? null}
        since={client?.since ?? "—"}
        visits={client?.totalVisits ?? 0}
        lifetimeValue={client ? formatLtv(client.lifetimeValueCents / 100) : "—"}
        lastVisit={client?.lastVisit ?? null}
        noShows={client?.noShows ?? 0}
        loading={isLoading}
      />

      {/* Add note bar */}
      <View style={styles.addNoteBar}>
        <Pressable
          style={({ pressed }) => [styles.addNoteBtn, pressed && styles.addNoteBtnPressed]}
          onPress={onPressAddNote}
          accessibilityRole="button"
          accessibilityLabel="Add a note for this client"
        >
          <Text style={styles.addNoteIcon}>✏</Text>
          <Text style={styles.addNoteBtnText}>Add note</Text>
        </Pressable>
      </View>

      {/* Feed */}
      <ScrollView
        contentContainerStyle={styles.feedContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <View key={i} style={[styles.shimmerBlock, styles.shimmerEntry]} />
          ))
        ) : notes.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No notes yet</Text>
            <Text style={styles.emptyBody}>Tap "Add note" to record the first note for this client.</Text>
          </View>
        ) : (
          notes.map((note) => (
            <NoteEntry
              key={note.id}
              note={note}
              onPress={() => onPressNote?.(note.id)}
            />
          ))
        )}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

// ─── NoteEntry sub-component ─────────────────────────────────────────────────

function NoteEntry({
  note,
  onPress,
}: {
  note: ClientNoteEntry;
  onPress?: () => void;
}) {
  const isVisit = note.kind === "visit";

  return (
    <Pressable
      style={({ pressed }) => [
        styles.noteCard,
        isVisit && styles.noteCardVisit,
        pressed && styles.noteCardPressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${isVisit ? "Visit summary" : "Note"} from ${note.createdAt}. ${note.body.substring(0, 80)}`}
    >
      {/* Header row */}
      <View style={styles.noteHeaderRow}>
        <View style={[styles.kindPill, isVisit ? styles.kindPillVisit : styles.kindPillNote]}>
          <Text style={[styles.kindPillText, isVisit ? styles.kindPillTextVisit : styles.kindPillTextNote]}>
            {isVisit ? "Visit" : "Note"}
          </Text>
        </View>
        <Text style={styles.noteDate}>{formatNoteDate(note.createdAt)}</Text>
        {isVisit && note.service && (
          <Text style={styles.noteService} numberOfLines={1}>{note.service}</Text>
        )}
        <Text style={styles.noteAuthor}>{note.authorName}</Text>
      </View>

      {/* Body */}
      <Text style={styles.noteBody} numberOfLines={4}>{note.body}</Text>
    </Pressable>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatNoteDate(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.pageHorizontal,
  },

  // Add note bar
  addNoteBar: {
    paddingHorizontal: spacing.pageHorizontal,
    paddingVertical: spacing.s2,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: "flex-end",
  },
  addNoteBtn: {
    height: spacing.touchTarget,
    paddingHorizontal: spacing.s4,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s2,
  },
  addNoteBtnPressed: {
    opacity: 0.85,
  },
  addNoteIcon: {
    fontSize: 14,
    color: colors.white,
  },
  addNoteBtnText: {
    ...textStyles.label,
    fontWeight: "600",
    color: colors.white,
  },

  // Feed
  feedContent: {
    paddingHorizontal: spacing.pageHorizontal,
    paddingTop: spacing.s4,
  },

  // Note card
  noteCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.cardPadding,
    marginBottom: spacing.elementGap,
  },
  noteCardVisit: {
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  noteCardPressed: {
    backgroundColor: colors.hover,
  },
  noteHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.elementGapSmall,
    marginBottom: spacing.s2,
    flexWrap: "wrap",
  },
  kindPill: {
    height: 20,
    paddingHorizontal: 6,
    borderRadius: radius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  kindPillNote: {
    backgroundColor: colors.primary20,
  },
  kindPillVisit: {
    backgroundColor: "rgba(187,237,218,0.30)",
  },
  kindPillText: {
    ...textStyles.labelSmall,
    fontWeight: "600",
  },
  kindPillTextNote: {
    color: colors.primary,
  },
  kindPillTextVisit: {
    color: colors.accentForeground,
  },
  noteDate: {
    ...textStyles.bodySmall,
    color: colors.textMuted,
  },
  noteService: {
    ...textStyles.bodySmall,
    color: colors.textMuted,
    flex: 1,
  },
  noteAuthor: {
    ...textStyles.labelSmall,
    color: colors.textMuted,
    marginLeft: "auto" as unknown as number,
  },
  noteBody: {
    ...textStyles.body,
    color: "#1A1A1A",
    lineHeight: 21,
  },

  // Empty / error
  emptyState: {
    paddingTop: spacing.s8,
    alignItems: "center",
    paddingHorizontal: spacing.s4,
  },
  emptyTitle: {
    ...textStyles.heading3,
    color: "#1A1A1A",
    textAlign: "center",
    marginBottom: spacing.elementGapSmall,
  },
  emptyBody: {
    ...textStyles.body,
    color: colors.textMuted,
    textAlign: "center",
  },
  errorTitle: {
    ...textStyles.heading3,
    color: "#1A1A1A",
    textAlign: "center",
    marginBottom: spacing.elementGapSmall,
  },
  errorBody: {
    ...textStyles.body,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: spacing.sectionGap,
  },
  primaryBtn: {
    height: spacing.touchTarget,
    paddingHorizontal: spacing.s6,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryBtnText: {
    ...textStyles.label,
    fontWeight: "600",
    color: colors.white,
  },

  // Shimmer
  shimmerBlock: {
    backgroundColor: "#EDE8D8",
    borderRadius: radius.lg,
  },
  shimmerEntry: {
    height: 96,
    marginBottom: spacing.elementGap,
  },

  bottomSpacer: {
    height: spacing.s8,
  },
});
