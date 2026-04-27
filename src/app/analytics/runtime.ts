import { createAnalyticsRepository } from "../../domains/analytics/analyticsRepository";
import { db } from "../../shared/config/firebase";
import { createReportingService } from "./reportingService";
import { createCampaignAnalyticsService } from "./campaignAnalyticsService";
import { createExportService } from "./exportService";

const analyticsRepository = createAnalyticsRepository(db);

export const reportingService = createReportingService(analyticsRepository);
export const campaignAnalyticsService = createCampaignAnalyticsService(analyticsRepository);
export const exportService = createExportService(analyticsRepository);
