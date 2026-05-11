import { createDiscoveryService, createFirestoreDiscoveryRepository } from "../../domains/discovery";
import { createFirestoreEditorialRepository } from "../../domains/discovery/editorialRepository";
import { db } from "../../shared/config/firebase";

const discoveryRepository = createFirestoreDiscoveryRepository(db);
const editorialRepository = createFirestoreEditorialRepository(db);

export const appDiscoveryService = createDiscoveryService(discoveryRepository, editorialRepository);