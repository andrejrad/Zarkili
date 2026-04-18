# Day 1 Development Checklist

## Goal for Day 1
Ship one complete vertical slice:
- Sign in
- Load user profile
- Resolve active salon context
- Show one protected home screen with active salon name

## Time Box Plan (about 6 hours)

### Block 1 (45 min): Startup and Guardrails
- Start Development mode: npm run start:dev
- Confirm iPhone app opens and reaches current bootstrap screen
- Pull latest code and run checks: npm run check
- Create branch for Day 1 work

Definition of done:
- Local environment healthy
- Branch created
- No failing checks before coding

### Block 2 (90 min): Auth Foundation
- Implement Firebase Auth service layer in src
- Add sign-in screen and sign-out action
- Add loading and error states for auth actions
- Wire AuthProvider to real Firebase auth state listener

Definition of done:
- User can sign in and sign out
- Auth state survives app refresh

### Block 3 (90 min): Profile + Tenant Context
- Create user profile read service from Firestore
- Define minimal profile shape: userId, role, salonMemberships, defaultSalonId
- Resolve active salon using defaultSalonId fallback to first membership
- Wire TenantProvider to set active salon context

Definition of done:
- After sign-in, app loads profile and active salon without manual input
- Missing profile path shows safe fallback UI

### Block 4 (75 min): Protected Home Screen
- Build one protected home screen
- Show current salon name and role badge
- Gate access: unauthenticated users see sign-in screen
- Add basic empty and loading states

Definition of done:
- Authenticated user sees protected home with salon context
- Unauthenticated user cannot access protected screen

### Block 5 (60 min): Hardening, Tests, Commit
- Add at least one test for provider flow
- Add one smoke test for auth gate behavior
- Run npm run check
- Commit Day 1 slice in small logical commits

Definition of done:
- Lint, typecheck, tests all pass
- Day 1 slice merged or ready for merge

## Suggested Commit Sequence
1. feat(auth): add Firebase auth service and provider wiring
2. feat(profile): load user profile and salon memberships
3. feat(tenant): resolve active salon context in TenantProvider
4. feat(home): add protected home screen with salon name
5. test(day1): add auth gate and provider flow tests

## Firestore Data Contracts (Minimum for Day 1)
users/{userId}
- role: owner | manager | staff | client
- defaultSalonId: string
- salonMemberships: string[]
- displayName: string

salons/{salonId}
- name: string
- status: active | inactive

## Day 1 Risks and Fast Mitigations
- Missing profile document after first sign in:
  - Mitigation: render onboarding fallback and prevent crash
- Membership list empty:
  - Mitigation: show no-access state with support action
- Slow network on first load:
  - Mitigation: keep loading skeleton and retry button

## End of Day Output
- Working auth to protected screen flow on iPhone
- Active salon resolved from Firestore-backed profile
- Passing npm run check
- Day-1 log filled in documentation/MULTITENANT_DAY1_EXECUTION_LOG_TEMPLATE.md

## Tomorrow Start Commands
- Development: npm run start:dev
- Quality gate: npm run check
