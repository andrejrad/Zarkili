/**
 * QueueCard.tsx — W27 Batch G primitive.
 *
 * Appointment/walk-in row card for the staff queue view.
 * Shows position chip, client name, status pill, service, and wait estimate.
 * Action buttons: Start (waiting), Notify (any), Remove (any).
 * dragging prop adds an elevated shadow and opacity for drag-to-reorder UX
 * (full PanResponder wiring is a W28 polish task).
 *
 * States: default | pressed | dragging | disabled
 * Status variants: waiting | in-service | completed | skipped
 */

import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, textStyles } from "./tokens";
import type { StaffQueueStatus } from "../staffTypes";
import {
  STAFF_QUEUE_STATUS_LABELS,
  formatWaitTime,
} from "../staffTypes";

// ─── Types ────────────────────────────────────────────────────────────────────

export type QueueCardProps = {
  position: number;
  clientName: string;
  service: string;
  status: StaffQueueStatus;
  /** Estimated wait in minutes. Shown only for "waiting" status. */
  estWaitMinutes?: number;
  /** ISO-8601 datetime when service started. Shown only for "in-service" status. */
  startedAt?: string;
  onStart?: () => void;
  onNotify?: () => void;
  onRemove?: () => void;
  /** Hoisted drag state — adds elevation + opacity. */
  dragging?: boolean;
  disabled?: boolean;
  testID?: string;
};

// ─── Status visual map ────────────────────────────────────────────────────────

const STATUS_STYLES: Record<StaffQueueStatus, { bg: string; fg: string }> = {
  waiting: { bg: "rgba(255,152,0,0.10)", fg: colors.warning },
  "in-service": { bg: "rgba(76,175,80,0.10)", fg: "#2E7D32" },
  completed: { bg: "rgba(33,150,243,0.10)", fg: "#1565C0" },
  skipped: { bg: "rgba(244,67,54,0.10)", fg: "#C62828" },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function QueueCard({
  position,
  clientName,
  service,
  status,
  estWaitMinutes,
  startedAt,
  onStart,
  onNotify,
  onRemove,
  dragging = false,
  disabled = false,
  testID,
}: QueueCardProps) {
  const { bg: pillBg, fg: pillFg } = STATUS_STYLES[status];
  const statusLabel = STAFF_QUEUE_STATUS_LABELS[status];

  const canStart = status === "waiting" && !disabled;
  const a11yLabel = `Position ${position}, ${clientName}, ${service}, ${statusLabel}`;

  return (
    <View
      style={[
        styles.container,
        dragging && styles.containerDragging,
        disabled && styles.containerDisabled,
      ]}
      accessibilityLabel={a11yLabel}
      testID={testID}
    >
      {/* Row 1 – position · name · status */}
      <View style={styles.row1}>
        <View style={styles.positionChip} accessibilityElementsHidden>
          <Text style={styles.positionLabel}>#{position}</Text>
        </View>
        <Text style={styles.clientName} numberOfLines={1}>
          {clientName}
        </Text>
        <View style={[styles.statusPill, { backgroundColor: pillBg }]}>
          <Text style={[styles.statusPillText, { color: pillFg }]}>
            {statusLabel}
          </Text>
        </View>
      </View>

      {/* Row 2 – service · separator · wait / started */}
      <View style={styles.row2}>
        <Text style={styles.serviceText} numberOfLines={1}>
          {service}
        </Text>
        {(estWaitMinutes !== undefined || startedAt) && (
          <>
            <Text style={styles.separator}>·</Text>
            {status === "waiting" && estWaitMinutes !== undefined && (
              <Text style={styles.metaText}>
                {formatWaitTime(estWaitMinutes)}
              </Text>
            )}
            {status === "in-service" && startedAt && (
              <Text style={styles.metaText}>Started {formatStartedAt(startedAt)}</Text>
            )}
          </>
        )}
      </View>

      {/* Action row */}
      {(canStart || onNotify || onRemove) && (
        <View style={styles.actionRow}>
          {canStart && onStart && (
            <Pressable
              style={({ pressed }) => [styles.actionBtn, styles.actionBtnPrimary, pressed && styles.actionBtnPressed]}
              onPress={onStart}
              accessibilityRole="button"
              accessibilityLabel={`Start service for ${clientName}`}
            >
              <Text style={styles.actionBtnPrimaryText}>Start</Text>
            </Pressable>
          )}
          {onNotify && (
            <Pressable
              style={({ pressed }) => [styles.actionBtn, styles.actionBtnSecondary, pressed && styles.actionBtnPressed]}
              onPress={onNotify}
              accessibilityRole="button"
              accessibilityLabel={`Notify ${clientName}`}
            >
              <Text style={styles.actionBtnSecondaryText}>Notify</Text>
            </Pressable>
          )}
          {onRemove && (
            <Pressable
              style={({ pressed }) => [styles.actionBtn, styles.actionBtnSecondary, pressed && styles.actionBtnPressed]}
              onPress={onRemove}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${clientName} from queue`}
            >
              <Text style={styles.actionBtnSecondaryText}>Remove</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatStartedAt(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.cardPadding,
  },
  containerDragging: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    opacity: 0.95,
  },
  containerDisabled: {
    opacity: 0.5,
  },

  // Row 1
  row1: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.elementGapSmall,
  },
  positionChip: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  positionLabel: {
    ...textStyles.labelSmall,
    fontWeight: "600",
    color: colors.white,
    textAlign: "center",
  },
  clientName: {
    ...textStyles.heading3,
    flex: 1,
    color: "#1A1A1A",
    paddingHorizontal: spacing.elementGapSmall,
  },
  statusPill: {
    borderRadius: radius.sm,
    height: 22,
    paddingHorizontal: spacing.elementGapSmall,
    justifyContent: "center",
    alignItems: "center",
  },
  statusPillText: {
    ...textStyles.labelSmall,
    fontWeight: "500",
  },

  // Row 2
  row2: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.elementGapSmall,
  },
  serviceText: {
    ...textStyles.bodySmall,
    color: colors.textMuted,
  },
  separator: {
    ...textStyles.bodySmall,
    color: colors.textMuted,
    marginHorizontal: 4,
  },
  metaText: {
    ...textStyles.bodySmall,
    color: colors.textMuted,
  },

  // Actions
  actionRow: {
    flexDirection: "row",
    gap: spacing.elementGapSmall,
    marginTop: spacing.s3,
  },
  actionBtn: {
    height: spacing.touchTarget,
    borderRadius: radius.md,
    paddingHorizontal: spacing.s4,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 72,
  },
  actionBtnPrimary: {
    backgroundColor: colors.primary,
  },
  actionBtnSecondary: {
    backgroundColor: colors.disabledBg,
  },
  actionBtnPressed: {
    opacity: 0.8,
  },
  actionBtnPrimaryText: {
    ...textStyles.label,
    fontWeight: "600",
    color: colors.white,
  },
  actionBtnSecondaryText: {
    ...textStyles.label,
    color: colors.textMuted,
  },
});
