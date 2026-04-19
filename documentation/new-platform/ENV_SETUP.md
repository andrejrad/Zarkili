# Environment Setup (Task 1.3)

This project uses environment-based Firebase bootstrap with explicit validation in `src/shared/config/env.ts`.

## Required env files
- `.env.development`
- `.env.production`

You can copy from `.env.example` and fill in values per Firebase project.

## Required variables
- `EXPO_PUBLIC_APP_VARIANT` (`development` or `production`)
- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`

## Local startup commands
- Development: `npm run start:dev`
- Production profile locally: `npm run start:prod`

## Validation behavior
- Missing required Firebase variables fail fast at startup with a clear error:
  - `Missing required environment variable: <KEY_NAME>`
- Unknown `EXPO_PUBLIC_APP_VARIANT` values safely fall back to `development`.

## Security notes
- Do not hardcode Firebase secrets in source files.
- Keep environment values in `.env.*` files and never expose production credentials in shared docs.

## Verification commands
- `npm run check`
- `npm run test -- --watch=false src/shared/config/__tests__/env.test.ts`
