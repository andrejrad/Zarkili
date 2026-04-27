import { createDiscoveryService, createFirestoreDiscoveryRepository } from "../../domains/discovery";
import { db } from "../../shared/config/firebase";

const discoveryRepository = createFirestoreDiscoveryRepository(db);

export const appDiscoveryService = createDiscoveryService(discoveryRepository);