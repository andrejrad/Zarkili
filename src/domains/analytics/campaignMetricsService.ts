/**
 * Campaign and challenge KPI computation — pure functions.
 *
 * KPI definitions
 * ───────────────
 * Campaign:  openRate = opened/delivered, clickRate = clicked/delivered,
 *            conversionRate = clicked/sent (proxy — no dedicated conversion event yet)
 * Challenge: completionRate = completed/participants, rewardsAwarded = count with rewardedAt set
 */

import type { Campaign } from "../campaigns/model";
import type { Activity, ParticipationRecord } from "../activities/model";
import type { CampaignKpis, ChallengeKpis } from "./model";

function safeRate(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : numerator / denominator;
}

// ---------------------------------------------------------------------------
// Campaign KPIs
// ---------------------------------------------------------------------------

export function computeCampaignKpis(campaign: Campaign): CampaignKpis {
  const { metrics } = campaign;
  return {
    campaignId: campaign.campaignId,
    name: campaign.name,
    channel: campaign.channel,
    sent: metrics.sent,
    delivered: metrics.delivered,
    opened: metrics.opened,
    clicked: metrics.clicked,
    converted: metrics.converted,
    failed: metrics.failed,
    openRate: safeRate(metrics.opened, metrics.delivered),
    clickRate: safeRate(metrics.clicked, metrics.delivered),
    conversionRate: safeRate(metrics.clicked, metrics.sent),
  };
}

export function computeCampaignKpisBatch(campaigns: Campaign[]): CampaignKpis[] {
  return campaigns.map(computeCampaignKpis);
}

// ---------------------------------------------------------------------------
// Challenge KPIs
// ---------------------------------------------------------------------------

export function computeChallengeKpis(
  activity: Activity,
  participations: ParticipationRecord[],
): ChallengeKpis {
  const participants = participations.length;
  const completed = participations.filter((p) => p.completed).length;
  const rewardsAwarded = participations.filter(
    (p) => p.rewardedAt !== undefined,
  ).length;

  return {
    activityId: activity.activityId,
    name: activity.name,
    participants,
    completed,
    completionRate: safeRate(completed, participants),
    rewardsAwarded,
  };
}

export function computeChallengeKpisBatch(
  activities: Activity[],
  participationsByActivityId: Map<string, ParticipationRecord[]>,
): ChallengeKpis[] {
  return activities.map((activity) =>
    computeChallengeKpis(
      activity,
      participationsByActivityId.get(activity.activityId) ?? [],
    ),
  );
}
