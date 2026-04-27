import { createLocationRepository } from "../../domains/locations";
import { createTenantRepository } from "../../domains/tenants";
import { createStaffRepository } from "../../domains/staff";
import { createServiceRepository } from "../../domains/services";
import { db } from "../../shared/config/firebase";

import { createTenantLocationAdminService } from "./tenantLocationAdminService";
import { createStaffAdminService } from "./staffAdminService";
import { createServiceAdminService } from "./serviceAdminService";

const tenantRepository = createTenantRepository(db);
const locationRepository = createLocationRepository(db);
const staffRepository = createStaffRepository(db);
const serviceRepository = createServiceRepository(db);

export const tenantLocationAdminService = createTenantLocationAdminService({
  tenantRepository,
  locationRepository,
});

export const staffAdminService = createStaffAdminService({ staffRepository });
export const serviceAdminService = createServiceAdminService({ serviceRepository });
