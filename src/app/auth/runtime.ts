import { createAuthRepository, createSocialAuthService } from "../../domains/auth";
import { auth, db } from "../../shared/config/firebase";

export const appAuthRepository = createAuthRepository(auth, db);
export const appSocialAuthService = createSocialAuthService(appAuthRepository);
