import { createActivityRepository } from "../../domains/activities";
import { db } from "../../shared/config/firebase";

import { createActivityAdminService } from "./activityAdminService";

const activityRepository = createActivityRepository(db);

export const activityAdminService = createActivityAdminService(activityRepository);
