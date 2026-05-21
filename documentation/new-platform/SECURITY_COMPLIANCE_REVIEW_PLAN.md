# Security & Compliance Review Plan

**Product:** Zarkili — Multi-Tenant Salon & Beauty Marketplace Platform  
**Version:** 1.0 — authored Week 49 / May 2026  
**Status:** Pre-Execution — scheduled for delivery in Weeks 50–51 (Phase 3.5)  
**Owner:** Zarkili Engineering / Platform Security Lead  
**Integrates with:** [PHASE3_5_RELEASE_READINESS_PLAN_WEEKS_50_TO_54.md](../PHASE3_5_RELEASE_READINESS_PLAN_WEEKS_50_TO_54.md), [DEBT_REGISTER.md](DEBT_REGISTER.md), [PILOT_GO_LIVE.md](PILOT_GO_LIVE.md)

---

## 0. Executive Summary

Zarkili is a cross-platform SaaS product (React Native iOS/Android/Web + Firebase/Firestore backend + Cloud Functions + Stripe payments + generative-AI features) serving multi-tenant beauty businesses and their end clients. The security and compliance review program has four goals:

1. **Validate** that no exploitable vulnerability exists in the shipped codebase before commercial launch.
2. **Harden** every attack surface across the stack (client, API, data layer, AI) to the highest practical level.
3. **Demonstrate compliance** with the applicable regulatory obligations: GDPR (EU), CCPA/CPRA + US state privacy laws, TCPA, CAN-SPAM, and accessibility standards (WCAG 2.1 AA / ADA).
4. **Prepare the SOC 2 Type 1 evidence base** for the Phase 5 audit engagement.

This plan is both a review checklist and an implementation roadmap. Every finding produces either a code change or a formally tracked debt item in [DEBT_REGISTER.md](DEBT_REGISTER.md) using the `Wnn-HARDENING-n` ID scheme.

---

## 1. Tech-Stack Attack-Surface Map

| Layer | Components | Key Threats |
|-------|------------|-------------|
| **Mobile client** | React Native (iOS/Android), Expo EAS, local AsyncStorage | Insecure storage, reverse engineering, deep-link hijacking, certificate pinning bypass, app-layer RBAC bypass |
| **Web client** | React Native Web, Firebase Hosting | XSS, CSP bypass, CORS misconfiguration, open redirect, clickjacking, sensitive PII in localStorage |
| **Authentication** | Firebase Authentication (email/password, Google OAuth) | Credential stuffing, account takeover, session hijacking, MFA bypass, email enumeration |
| **Firestore** | Multi-tenant collections with programmatic RBAC helpers | Horizontal privilege escalation (cross-tenant reads), vertical privilege escalation (role upgrade), server-bypass writes, missing collection coverage |
| **Cloud Functions** | Node.js callable + HTTPS + scheduled functions | Input injection, SSRF, missing auth checks, rate-limit bypass, secret leakage in logs, zip-slip in uploads |
| **Stripe integration** | Billing, Connect, Tax, Webhooks | Webhook replay, missing signature verification, IDOR on invoice/refund endpoints, 1099-K data exposure |
| **AI services** | OpenAI/Vertex callable functions, no-show/fraud model, retention model, AI chat, content generation | Prompt injection, model output bias, PII leakage into AI context, insecure AI-generated content output |
| **Secrets & config** | Firebase project config, env vars, API keys | Secret committed to Git, overprovisioned IAM, leaked Firebase API key |
| **Third-party dependencies** | npm packages, Firebase SDK, Stripe SDK | Supply-chain attack (malicious package), known CVEs in transitive deps |
| **Infrastructure** | Firebase project IAM, GCS backup bucket, Cloud Scheduler | Overpermissive service account, public GCS bucket, missing VPC/egress controls |
| **Compliance surface** | GDPR consent, CCPA DNSoMPI, TCPA SMS consent, CAN-SPAM | Missing opt-out paths, incomplete right-to-delete, unlawful data retention, inaccessible UI controls |

---

## 2. Review Phases and Timeline

| Phase | Weeks | Activities |
|-------|-------|------------|
| **Phase A — Internal Pre-Hardening** | W50 (first half) | Dependency audit, SAST scan, secret scan, Firestore rules freeze, code-level security review |
| **Phase B — External Penetration Test** | W51 (test in flight) | Vendor-led black-box + gray-box pentest; internal triage and hot-fix of High/Critical findings same week |
| **Phase C — Compliance Gap Close** | W51–W53 | Privacy controls implementation, AI safety review, accessibility re-audit |
| **Phase D — Compliance Documentation** | W53–W54 | DPA, sub-processor list, security whitepaper, GDPR Art. 30, CCPA disclosures |
| **Phase E — SOC 2 Type 1 Readiness** | W54 + Phase 5 | Evidence collection, policy finalisation, auditor engagement |

> **Critical path dependency:** The pentest vendor MUST be contracted before Week 50 starts (entry condition per Phase 3.5 plan). Any slip here directly delays the pentest report and commercial launch.

---

## 3. Phase A — Internal Pre-Hardening (W50 first half)

### A-1. Dependency & Supply-Chain Audit

**Owner:** Engineering  
**Tooling:** `npm audit`, `npm audit fix`, Snyk or GitHub Dependabot, `npm outdated`

**Checklist:**
- [ ] Run `npm audit --audit-level=high` in workspace root and `functions/` — zero High or Critical findings allowed for launch.
- [ ] Run `npm audit --audit-level=moderate` — document all Moderate findings; remediate or accept-with-justification.
- [ ] Enable GitHub Dependabot (or Snyk CI integration) so new CVEs surface automatically post-launch.
- [ ] Pin all direct dependencies to exact versions in `package.json` (remove `^` ranges for critical security libraries: Firebase, Stripe, React Native, Expo).
- [ ] Verify `package-lock.json` is committed and CI enforces `npm ci` (not `npm install`).
- [ ] Review any forked or vendored npm packages in the monorepo for modification drift.
- [ ] Audit transitive dependencies for any packages flagged in the [OSS Malicious Packages database](https://socket.dev) or with no-license / copyleft licenses that conflict with commercial distribution.
- [ ] Confirm no packages attempt network calls during `postinstall` scripts (supply-chain vector).

**Pass criteria:** `npm audit` returns 0 High/Critical in both workspace and `functions/`. All Moderate findings documented in DEBT_REGISTER.

---

### A-2. Secret & Credential Scan

**Owner:** Engineering  
**Tooling:** `git log -S`, `gitleaks`, `truffleHog`, GitHub secret scanning

**Checklist:**
- [ ] Run `gitleaks detect` (or equivalent) across full Git history — zero live secrets committed.
- [ ] Confirm no `.env` files tracked in Git (`.gitignore` enforces this).
- [ ] Scan for hardcoded strings matching known secret patterns: Firebase API keys, Stripe Secret keys, Stripe Webhook signing secrets, OpenAI API keys, service account JSON.
- [ ] Verify `app.config.ts` uses environment variable references only — no inline secret values.
- [ ] Confirm `zzz-run-env.txt` (present in workspace) contains no live production secrets; if it does, rotate affected keys immediately.
- [ ] Verify all Cloud Functions environment config uses Firebase environment configuration or Secret Manager (not hardcoded in source).
- [ ] Verify Stripe Webhook signing secret is read from environment only and never logged.
- [ ] Enable GitHub secret scanning with push protection on the repository.

**Pass criteria:** `gitleaks` clean run. All secrets verified to be in Secret Manager or CI environment variables only.

---

### A-3. Static Application Security Testing (SAST)

**Owner:** Engineering  
**Tooling:** ESLint security plugins (`eslint-plugin-security`, `eslint-plugin-no-unsanitized`), Semgrep, CodeQL

**Checklist:**
- [ ] Add `eslint-plugin-security` to `eslint.config.mjs` and run across entire `src/` and `functions/src/`.
- [ ] Add `eslint-plugin-no-unsanitized` — catch dangerous `innerHTML`, `dangerouslySetInnerHTML` without sanitization.
- [ ] Run Semgrep with the `security` and `firebase` rulesets.
- [ ] Enable CodeQL in CI (GitHub Actions) for JavaScript/TypeScript.
- [ ] Document all SAST findings; remediate High/Critical before launch.
- [ ] Add SAST as a required CI gate — PRs cannot merge if new High findings are introduced.

**OWASP Top 10 (2021) Code Review Checklist:**

| # | OWASP Category | Specific Check for Zarkili |
|---|---------------|---------------------------|
| A01 | Broken Access Control | All Cloud Functions callable endpoints verify `context.auth` before accessing data. Domain service methods that accept `actorRole` enforce it (do not trust the caller to pass the correct role). |
| A02 | Cryptographic Failures | No PII stored in plaintext in Firestore (only `clientHash` for AI risk model). TLS enforced everywhere (Firebase Hosting + Functions). No custom crypto — use Firebase/Stripe-provided. |
| A03 | Injection | All Firestore queries use typed SDK methods — no string-interpolated collection paths. Cloud Function inputs validated with Zod/Joi schemas at the boundary before use. No shell exec in Functions. |
| A04 | Insecure Design | Multi-tenant isolation is enforced at Firestore rules layer (server-enforced), not only at app layer. AI model receives only `clientHash`, not raw PII. |
| A05 | Security Misconfiguration | Firebase project not in test mode. Firestore rules in production freeze. No `allow read, write: if true` anywhere. App Check enforced for production clients. |
| A06 | Vulnerable and Outdated Components | Covered by A-1 dependency audit above. |
| A07 | Identification and Authentication Failures | Firebase Auth with email enumeration protection. MFA enforced for `tenant_owner` and `platform_admin`. Booking slot tokens have TTL and are purged by `purgeExpiredSlotTokens`. |
| A08 | Software and Data Integrity Failures | `package-lock.json` committed; CI uses `npm ci`. Stripe webhook payload verified with `stripe.webhooks.constructEvent()` signature check before processing. |
| A09 | Security Logging and Monitoring Failures | Cloud Functions log auth errors and rule violations (without PII). Sentry/Crashlytics wired (Phase 3.5 W50). Alerting on anomalous write volume per tenant. |
| A10 | Server-Side Request Forgery (SSRF) | AI callable functions — verify that any URL constructed from user input is explicitly allow-listed. Cloud Function egress — no user-supplied URLs fetched directly. |

---

### A-4. Firestore Security Rules Freeze & Final Audit

**Owner:** Engineering  
**Reference:** [SECURITY_RULES_FINAL.md](SECURITY_RULES_FINAL.md), [W36_FIRESTORE_RULES_PRE_REVIEW.md](../W36_FIRESTORE_RULES_PRE_REVIEW.md)

**Checklist:**
- [ ] Deploy final `firestore.rules` to production; record the deployed version hash in this document.
- [ ] Confirm the terminal catch-all `match /{document=**} { allow read, write: if false; }` is the last rule in the file.
- [ ] Verify all collections listed in SECURITY_RULES_FINAL.md coverage matrix have explicit `match` blocks.
- [ ] Add coverage for any collections added after Week 49 that are not yet in the matrix: `supportTickets`, `supportTickets/{id}/messages`, `escalationQueue`, `platform/aiSupportKb`, `featureFlags`.
- [ ] Re-run the full emulator rules test suite (`__tests__/firestore.rules.test.ts`) — 100% pass required.
- [ ] Add adversarial test cases for:
  - Cross-tenant read attempt (client from tenant A trying to read tenant B's bookings).
  - Role escalation (technician attempting to write their own `role` field to `tenant_admin`).
  - `tenantId` mutation attempt on an existing document update.
  - Unauthenticated write to any collection.
  - `platform_admin` attempting to read another user's private `userProfiles` not their own.
  - Client attempting direct write to `loyaltyStates` bypassing the server function.
  - `messages` collection — client attempting to read a message thread they are not a participant of.
- [ ] Review impersonation flow (Week 44) adversarial test cases as specified in Phase 3.5 Week 51 plan.
- [ ] Confirm `featureFlags` rules prevent tenant admins from toggling flags that belong to other tenants.
- [ ] Confirm `supportTickets` rules enforce tenant isolation and platform-owner-only access to escalation queue.
- [ ] Sign off rules freeze: no further changes to `firestore.rules` until post-launch review cycle.

**Pass criteria:** All emulator tests pass. No collection reachable without explicit allow rule. Freeze signoff recorded below.

```
FIRESTORE RULES FREEZE SIGNOFF
===============================
Deployed hash: ________________
Deploy timestamp: ______________
Test suite: firestore.rules.test.ts — all ___ tests passed
Signed off by: _________________
Date: __________________________
```

---

### A-5. Authentication & Authorization Deep-Dive

**Owner:** Engineering  
**Reference:** Firebase Authentication

**Checklist:**

_Firebase Auth configuration:_
- [ ] Email enumeration protection enabled in Firebase Auth console.
- [ ] Password minimum length policy: 12 characters for `platform_admin` and `tenant_owner`; 8 characters for all others.
- [ ] Multi-factor authentication (TOTP or SMS) enforced as mandatory for `platform_admin` and `tenant_owner` roles.
- [ ] Account lockout policy: temporary lockout after 5 failed login attempts within 10 minutes.
- [ ] Google Sign-In provider — verify `authorized domains` in Firebase Auth console lists only production domains; no `localhost` in production project.
- [ ] Email/password sign-up restricted — new accounts only via explicit invitation or self-serve registration flow; no unauthenticated account creation without rate limiting.
- [ ] Session tokens expire in ≤ 1 hour for web clients; refresh token rotation enabled.
- [ ] Firebase App Check enforced for production app bundle (prevents API abuse from untrusted environments).

_RBAC / custom claims:_
- [ ] Verify custom claim `role` is set server-side only (via Cloud Function triggered by tenant user creation) — clients cannot self-assign roles.
- [ ] Verify `platform_admin` role is provisioned manually only — no self-service mechanism to become platform admin.
- [ ] Verify `hasTenantRole` helper in Firestore rules reads from `tenantUsers` collection, not from the raw JWT claim, ensuring role is validated against the server-side record.
- [ ] Test that a `tenant_owner` from tenant A cannot perform admin operations on tenant B even with a valid JWT.

_Booking slot tokens:_
- [ ] Token TTL ≤ 15 minutes (verify in `bookingSlotTokens` creation logic).
- [ ] `purgeExpiredSlotTokens` Cloud Scheduler job verified active in production.
- [ ] Tokens are single-use — verify that once a booking is confirmed, the token is deleted or flagged as consumed.

---

### A-6. Cloud Functions Security Review

**Owner:** Engineering

**Checklist:**

_Input validation:_
- [ ] Every callable Cloud Function validates its input against a strict schema (Zod or equivalent) BEFORE accessing `context.auth`.
- [ ] Input size limits enforced — reject payloads over a defined maximum byte limit.
- [ ] No user-supplied strings inserted into Firestore collection path segments (IDPS injection vector).
- [ ] AI callable functions sanitize LLM-returned content before persisting to Firestore. No direct `eval` or `Function()` construction from AI output.

_Authentication checks:_
- [ ] Every non-public callable verifies `context.auth != null` at the start; throw `functions.https.HttpsError('unauthenticated', ...)` if not present.
- [ ] Role checks performed in the function body (defense-in-depth) even when Firestore rules would also block unauthorized writes.

_Rate limiting:_
- [ ] Per-IP and per-UID rate limits on login, register, booking-create, and AI-callable functions. Use Firestore-based counter or an in-memory LRU with TTL for prototyping; upgrade to Redis for production scale.
- [ ] Stripe webhook handler: limit inbound requests to Stripe's published IP ranges if feasible; always verify the `Stripe-Signature` header regardless.

_Secret handling:_
- [ ] No API keys, secrets, or signing secrets logged at any log level.
- [ ] No PII (email, phone, full name) in Cloud Function logs. Use redaction helpers.
- [ ] Stripe Webhook signing secret loaded from Firebase Secret Manager (not environment config which is stored in `.env`).
- [ ] AI service API key loaded from Secret Manager with minimum-permission IAM binding.

_Scheduled functions:_
- [ ] `purgeExpiredSlotTokens`, `trialExpiryHourly`, `check1099KThreshold` — each verifies it is invoked by Cloud Scheduler (check `context.eventType` or `Authorization: Bearer` header pattern); not invokable by arbitrary HTTP callers.

_Error handling:_
- [ ] All `HttpsError` responses use generic messages for `unauthenticated` / `permission-denied` errors — do not reveal whether a resource exists.
- [ ] No stack traces returned to clients in production.

---

### A-7. Mobile App Security Review

**Owner:** Engineering  
**Platform:** iOS (Expo EAS), Android (Expo EAS)

**Checklist:**

_Local storage:_
- [ ] No sensitive tokens stored in plaintext `AsyncStorage`. Use `expo-secure-store` (Keychain on iOS, Keystore on Android) for auth tokens.
- [ ] Firebase Auth session persistence mode on mobile: `LOCAL` (backed by secure storage).
- [ ] No PII cached to local files in plaintext. Booking/service data cached in encrypted form if cached at all.

_Deep links / universal links:_
- [ ] Universal Links (iOS) and App Links (Android) configured with proper `.well-known/apple-app-site-association` and `assetlinks.json` to prevent deep-link hijacking.
- [ ] All deep-link entry points flow through the route guard (protected route guard validates auth before granting access).
- [ ] Open redirect: deep-link URL parameters that specify redirect targets are validated against an allow-list.

_Binary protections:_
- [ ] Code obfuscation: Hermes bytecode compilation enabled for production builds (Expo default for EAS production profile).
- [ ] Jailbreak/root detection: add `expo-root-detection` check in app startup; warn user rather than hard-block (to avoid accessibility issues).
- [ ] Certificate pinning: implement for Firebase and Stripe API calls using `react-native-ssl-pinning` or OkHttp NetworkInterceptor (Android) + TrustKit (iOS) for the production build profile.
- [ ] Disable logging in production builds (`__DEV__` guard on all `console.*` calls).

_Permissions:_
- [ ] All native device permissions (Camera, Location, Notifications, Contacts) requested only when needed with clear rationale string.
- [ ] No overly-broad permissions in `AndroidManifest.xml` or `Info.plist`.

_Expo EAS build:_
- [ ] Production build profile uses `"distribution": "store"` and a pinned Expo SDK version.
- [ ] `eas.json` `submit` credentials stored in EAS Secrets, not in repository.
- [ ] App signing keys stored in EAS Managed Credentials; not in the repository.

---

### A-8. Web Client Security Review

**Owner:** Engineering  
**Hosting:** Firebase Hosting

**Checklist:**

_HTTP security headers (add to `firebase.json` `hosting.headers`):_

```json
{
  "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.gstatic.com https://apis.google.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://api.stripe.com; frame-src https://hooks.stripe.com https://js.stripe.com; object-src 'none'; base-uri 'self';",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload"
}
```

- [ ] CSP header deployed and tested — verify no CSP violations in production via `Content-Security-Policy-Report-Only` trial run before enforcing.
- [ ] `X-Frame-Options: DENY` — prevents clickjacking.
- [ ] `Strict-Transport-Security` with `preload` — submit domain to HSTS preload list after launch.
- [ ] CORS: Cloud Functions callable endpoints restrict `Access-Control-Allow-Origin` to production domain(s) only; no wildcard `*` on authenticated endpoints.
- [ ] `dangerouslySetInnerHTML` — audit all usages; ensure content is sanitized with DOMPurify before use.
- [ ] Stripe.js loaded from `https://js.stripe.com` only (CSP `script-src` enforces this).

_Session & auth:_
- [ ] Firebase Auth web session uses `browserSessionPersistence` for sensitive admin routes; `browserLocalPersistence` only for opted-in "remember me" flow.
- [ ] CSRF protection: Firebase's callable SDK uses CORS + same-site cookies; verify no custom CSRF bypass exists in the web shell.
- [ ] Logout clears all session state including Firebase Auth token and any cached tenant context.

_Information disclosure:_
- [ ] Remove all `console.log` / `console.debug` from production bundles (`babel-plugin-transform-remove-console` configured for production).
- [ ] Error pages do not expose stack traces, file paths, or internal architecture details.
- [ ] `robots.txt` excludes admin and API routes from indexing.

---

## 4. Phase B — External Penetration Test (W51)

### 4-1. Scope Definition

The pentest must cover the following surfaces with the agreed scope per category:

| Surface | Test Type | Scope |
|---------|-----------|-------|
| Web application (salon admin portal, consumer booking flow) | Black-box + authenticated (gray-box) | Full feature set; multi-tenant isolation is the top priority target |
| Mobile apps (iOS + Android, production build) | Gray-box (with IPA/APK provided) | Local storage, deep links, API calls, certificate pin verification |
| Cloud Functions API | Gray-box (with API documentation provided) | All callable endpoints; webhook endpoints |
| Firestore rules | White-box (with rules file provided + emulator access) | Privilege escalation, cross-tenant reads, rule bypass |
| Authentication flows | Gray-box | Credential stuffing, session management, MFA bypass, account takeover |
| AI features | Gray-box | Prompt injection on AI chat, model output manipulation, PII extraction from AI responses |
| Stripe integration | Gray-box (with test-mode keys) | Webhook replay, IDOR on financial objects |
| Infrastructure (Firebase project) | White-box | IAM misconfiguration, overpermissive service accounts, public GCS buckets |

**Out of scope:**
- Social engineering attacks on staff.
- Physical security.
- DoS / DDoS attacks (confirm with vendor; load testing is covered separately by the W50 k6 harness).
- Stripe production payment processing — all financial testing in test mode only.

---

### 4-2. Pentest Methodology Requirements

The selected vendor must follow one of these recognized frameworks:
- **OWASP Testing Guide v4.2** (web / API)
- **PTES (Penetration Testing Execution Standard)**
- **OWASP Mobile Security Testing Guide (MSTG)** for mobile surfaces

Required methodology phases:
1. **Reconnaissance** — passive recon of public surfaces (marketing site, app store listings, DNS).
2. **Threat modelling** — vendor produces a threat model against provided architecture docs; aligns with our attack-surface map in §1.
3. **Exploitation** — active exploitation in staging environment; no production access during active exploitation phase.
4. **Reporting** — findings triaged by CVSS v3.1 score; all High (CVSS ≥ 7.0) and Critical (CVSS ≥ 9.0) findings must include proof-of-concept reproduction steps.
5. **Retest** — after Hot-fix cycle, vendor retests all High and Critical findings to confirm remediation.

---

### 4-3. Engagement Requirements

| Requirement | Detail |
|-------------|--------|
| Vendor certification | OSCP-certified testers minimum; CREST or GWAPT preferred |
| Environment | Staging environment mirroring production; separate Firebase project (`zarkili-staging`) with production-equivalent rules and data model |
| Test accounts | Platform provides 5 test accounts: `platform_admin`, `tenant_owner`, `tenant_admin`, `technician`, `client` — at least two tenants provisioned so cross-tenant tests can be run |
| Communication | Daily status call during active testing week; critical findings reported within 4 hours of discovery via agreed secure channel |
| NDA | Signed before any credentials or architecture docs are shared |
| Report format | Executive summary + technical findings list + CVSS scores + PoC + recommended remediation per finding |
| Retest | Included in engagement scope at no extra charge for findings closed within 30 days |
| Data handling | Vendor deletes all test data and credentials within 7 days of final report delivery |

---

### 4-4. Finding Severity and Response SLA

| Severity | CVSS Range | Response SLA |
|----------|-----------|--------------|
| Critical | 9.0–10.0 | Fix within 24 hours of finding report; halt related feature for users until fixed |
| High | 7.0–8.9 | Fix within 72 hours; track as `Wnn-HARDENING-n` in DEBT_REGISTER with `High` severity |
| Medium | 4.0–6.9 | Fix before commercial launch; track in DEBT_REGISTER |
| Low | 0.1–3.9 | Fix within 30 days post-launch; track in DEBT_REGISTER |
| Informational | N/A | Document and address in next planning cycle |

**Critical and High findings are hard blockers for commercial launch.** Medium findings have a named remediation plan before launch sign-off. Low findings are tracked but do not block launch.

---

### 4-5. Pentest Preparation Checklist (before vendor kicks off)

- [ ] Staging Firebase project provisioned and confirmed production-equivalent — same Firestore rules, same function code, anonymized data.
- [ ] 5 test accounts provisioned (see §4-3) with confirmed access; passwords rotated after pentest.
- [ ] Architecture docs package assembled: ARCHITECTURE_OVERVIEW.md, SECURITY_RULES_FINAL.md, SECURITY_COMPLIANCE_REVIEW_PLAN.md (this document), Cloud Functions API surface list.
- [ ] Out-of-scope agreement signed by vendor (no production writes, no DoS, no real payment transactions).
- [ ] Secure credential-sharing channel established (1Password shared vault or equivalent).
- [ ] Internal security-response Slack/Teams channel created with on-call engineer assigned for the pentest week.
- [ ] Incident response playbook reviewed — team knows the escalation path if a critical finding is discovered.

---

### 4-6. AI-Specific Penetration Test Requirements

Given Zarkili's AI features (AI chat, scheduling suggestions, no-show/fraud model, content generation), the pentest must include:

| AI Test Case | Goal |
|-------------|------|
| **Prompt injection** | Attempt to inject instructions into AI chat messages that alter the system prompt, extract the knowledge base, or cause the AI to output PII from other users |
| **Jailbreak probes** | Attempt standard jailbreak prompts against AI chat and content generation endpoints |
| **PII exfiltration** | Submit prompts designed to extract data about other clients or tenants from the AI context window |
| **Output injection** | Verify that AI-generated content stored to Firestore is sanitized before display — test for stored XSS via AI-generated HTML/Markdown |
| **Rate limit bypass** | Verify the AI budget guard (`aiSupport`, `aiScheduling`, etc.) cannot be bypassed by authenticated users to trigger runaway AI spend |
| **No-show model manipulation** | Attempt to supply crafted `RiskInputSignals` fields (e.g., extremely large numeric values, SQL injection strings, null values) to cause scoring service to fail open (always `allow`) |

---

## 5. Phase C — Compliance Gap Close (W51–W53)

### 5-1. GDPR (EU) Implementation Checklist

**Reference:** [US_PRIMARY_MARKET_ADDENDUM.md](../US_PRIMARY_MARKET_ADDENDUM.md), [W29 legal/lifecycle tasks]

| Requirement | Implementation | Status |
|-------------|---------------|--------|
| **Lawful basis** | Booking = contract performance; marketing = explicit consent; analytics = legitimate interest (opt-out available) | Verify documented in privacy policy |
| **Data minimisation** | AI risk model uses `clientHash` (opaque token) only; no raw PII passed to AI context except in AI chat | Verify across all AI services |
| **Right to access (SAR)** | Tenant-scoped data export (Week 42/54) covers client booking and loyalty history | Verify export includes all personal data categories |
| **Right to erasure** | `deleteUserData` Cloud Function must delete: `userProfiles`, `userTenantAccess`, `bookings` (anonymise, not delete — service records), `loyaltyStates`, `loyaltyTransactions` (anonymise), `reviews` (anonymise or delete), `waitlist`, `messages` (client messages) | Implement and test |
| **Right to portability** | Export in machine-readable format (JSON or CSV) — verify tenant admin export includes client's own data in a portable format | Verify export format |
| **Consent management** | Marketing consent captured at registration; granular consent for SMS, email, loyalty programme | Verify consent records persisted in Firestore with timestamp and version |
| **Data retention limits** | Define and enforce: booking records 7 years (tax), loyalty transactions 3 years, AI conversation logs 90 days, error logs 30 days | Implement purge Cloud Scheduler jobs |
| **Privacy by design** | PII minimised in logs, AI context, and analytics vectors — verified in code review above | Continuous |
| **DPA with sub-processors** | Signed DPAs with: Firebase/Google, Stripe, OpenAI/Vertex, email/SMS provider, support tooling | List in sub-processor schedule |
| **GDPR Art. 30 records** | Maintained in GDPR_ART30_RECORD.md (to be created in W54) | W54 deliverable |
| **Cross-border transfers** | Firebase region: `europe-west1` for EU tenants; SCCs or adequacy decisions required for transfers to US-based sub-processors | Document in DPA |
| **Data breach notification** | Incident response plan includes 72-hour GDPR notification obligation; define detection and escalation path | Wire to Sentry alerting |
| **Cookie consent** | Web app: consent banner for analytics cookies; Firebase Analytics and Sentry session replay require explicit consent | Implement CMP |

---

### 5-2. CCPA / CPRA and US State Privacy Laws

**States:** California (CCPA/CPRA), Virginia (VCDPA), Colorado (CPA), Connecticut (CTDPA), Utah (UCPA)

| Requirement | Implementation |
|-------------|---------------|
| **Privacy notice** | Disclose: categories of data collected, purposes, retention, third-party sharing, consumer rights | W54 privacy policy update |
| **Do Not Sell or Share My Personal Information (DNSOMI)** | Opt-out toggle in account settings; GPC (Global Privacy Control) signal honored at web layer | W29/W54 implementation |
| **Right to know** | Consumer can request a copy of their data — same flow as GDPR right to access | Reuse GDPR SAR flow |
| **Right to delete** | Same flow as GDPR right to erasure; confirm deletion within 45 days per CCPA timeline | Verify SLA in runbook |
| **Right to correct** | Consumer can update their own `userProfiles` doc — already permitted by Firestore rules | Verify UI exposes this |
| **Right to opt out of automated profiling** | AI no-show/fraud model opt-out: if consumer opts out, scoring call returns `allow` without model evaluation | Implement flag on `userProfiles`; check in `createNoShowFraudService` |
| **Data minimisation / purpose limitation** | Analytics and retention models use aggregate signals only; no cross-tenant data | Verified via `AI_DATA_CONTRACTS.md` and `AI_RISK_MODEL_POLICY.md` |
| **Sensitive personal information (SPI) limits** | No SPI collected (no health data, precise geolocation, financial account numbers beyond what Stripe handles directly) | Document in privacy policy |
| **Annual privacy audits** | CCPA/CPRA requires regular risk assessments for high-risk processing | Schedule first assessment for Phase 5 |

---

### 5-3. TCPA (US SMS) Compliance

| Requirement | Implementation |
|-------------|---------------|
| **Prior express written consent** | Explicit opt-in checkbox at booking and account creation for SMS appointment reminders; consent timestamped and persisted | Verify in onboarding flow |
| **STOP / HELP keywords** | SMS provider (Twilio or SendGrid) must handle STOP, STOPALL, UNSUBSCRIBE, CANCEL, END → opt-out; HELP, INFO → info reply | Verify in provider config |
| **Opt-out persistence** | Opt-out flag written to `userProfiles.smsOptOut`; all future SMS sends check this flag | Implement flag check in notification service |
| **Quiet hours** | No SMS sent between 9 PM and 8 AM local time per US time zone; DST-aware | Implement in notification scheduler |
| **Revocation** | Consumer can revoke SMS consent in-app settings at any time | Verify UI |

---

### 5-4. CAN-SPAM (US Email) Compliance

| Requirement | Implementation |
|-------------|---------------|
| **Sender identity** | `From` address identifies the sending entity (e.g., `noreply@zarkili.com` with display name "Zarkili") | Verify SES/SendGrid templates |
| **Physical mailing address** | Company address in email footer | Add to all transactional email templates |
| **One-click unsubscribe** | `List-Unsubscribe` header + visible unsubscribe link in every commercial email | Verify in email templates |
| **Unsubscribe processing** | Opt-out processed within 10 business days; `emailOptOut` flag on `userProfiles` | Implement and verify |
| **Honest subject lines** | Audit marketing email templates for deceptive subject lines | Pre-launch review |
| **No deceptive headers** | Verify email sending domain matches `From` domain (SPF, DKIM, DMARC configured) | Verify DNS records |

---

### 5-5. COPPA (Children Under 13)

| Requirement | Implementation |
|-------------|---------------|
| **Age affirmation** | Age affirmation at registration; consumers under 13 require parental consent | Verify in W21 onboarding |
| **No COPPA-regulated data collection** | Zarkili does not target children as a primary audience; confirm no directed-at-children content | Document in privacy policy |
| **If detected:** | If a user self-reports age < 13, account creation is blocked and user is directed to parental consent flow | Verify in registration code |

---

### 5-6. Accessibility (WCAG 2.1 AA / ADA)

**Reference:** [AUTH_A11Y_AUDIT_2026-04-29.md](../AUTH_A11Y_AUDIT_2026-04-29.md)

| Requirement | Implementation |
|-------------|---------------|
| **Color contrast** | All text and interactive elements ≥ 4.5:1 contrast ratio (3:1 for large text) | Re-audit with axe-core post W53 UI changes |
| **Screen reader** | All screens navigable with VoiceOver (iOS) and TalkBack (Android); all interactive elements have accessible labels | Verify in manual QA sprint |
| **Keyboard navigation** | Web admin portal fully keyboard-navigable; no keyboard traps | Manual QA + axe-core CI |
| **Focus management** | Modal dialogs and bottom sheets trap focus correctly; focus returns on close | Verify in the W53 SupportChatScreen |
| **Dynamic content** | `aria-live` regions for real-time updates (booking confirmations, chat messages) | Verify in AI chat and support chat |
| **Error identification** | Form validation errors associated with inputs via `aria-describedby` | Audit form components |
| **ADA accessibility statement** | Published on web property per Phase 3.5 W52 plan | W52 deliverable |

---

## 6. Phase D — Compliance Documentation (W53–W54)

### 6-1. Document Deliverables

| Document | Location | Owner | W54 status |
|----------|----------|-------|------------|
| Data Processing Agreement (DPA) template | `documentation/legal/DPA_TEMPLATE.md` | Legal + Engineering | Draft by W53, legal review by W54 |
| Sub-Processor List | `documentation/legal/SUB_PROCESSOR_LIST.md` | Engineering | Draft by W53 |
| Security Whitepaper | `documentation/legal/SECURITY_WHITEPAPER.md` | Engineering | Draft by W54 |
| GDPR Article 30 Record | `documentation/legal/GDPR_ART30_RECORD.md` | Engineering + Legal | Draft by W54 |
| CCPA/CPRA Privacy Notice | Public-facing, linked from app and web | Legal | Live by W54 |
| US State Privacy Disclosures (VA, CO, CT, UT) | Public-facing, linked from app and web | Legal | Live by W54 |
| Accessibility Statement | Public-facing, linked from app and web | Engineering + Legal | Live by W52 |
| Incident Response Runbook | `documentation/new-platform/runbooks/INCIDENT_RESPONSE.md` | Engineering | By W51 |
| Privacy nutrition labels (mobile stores) | App Store Connect / Play Console | Engineering | Before store submission |

---

### 6-2. Security Whitepaper Outline

The security whitepaper is reviewed by enterprise customers and SOC 2 auditors. It must cover:

1. **Architecture overview** — multi-tenant design, platform boundaries, data flows.
2. **Authentication and access control** — Firebase Auth, RBAC, custom claims, MFA requirements.
3. **Data encryption** — at-rest (Firestore AES-256-GCM, GCS AES-256), in-transit (TLS 1.2+), key management (Google-managed).
4. **Tenant isolation** — Firestore rules enforcement, logical separation, no shared Firestore instance keys between tenants.
5. **Network security** — Firebase Hosting TLS, Cloud Functions HTTPS, no open ports.
6. **Application security** — OWASP controls, SAST in CI, dependency management.
7. **AI and automated decision-making** — data contracts, forbidden signals, reason-code allow-list, human-in-the-loop requirement for High/Critical risk actions.
8. **Vulnerability management** — pentest cadence (annual external, quarterly internal), CVSS-based SLA.
9. **Incident response** — detection (Sentry/Crashlytics), classification, notification (GDPR 72-hour obligation, US breach notification laws).
10. **Business continuity** — PITR on Firestore, GCS daily backup, RTO/RPO from disaster-recovery drill.
11. **Compliance certifications** — GDPR, CCPA/CPRA, TCPA, CAN-SPAM. SOC 2 Type 1 in progress (planned start W56). HIPAA non-applicable (no PHI).
12. **Sub-processors** — list with links to their security pages and DPA addenda.
13. **Security contact** — `security@zarkili.com` for responsible disclosure.

---

### 6-3. Sub-Processor List (Draft)

| Processor | Role | Data categories transferred | DPA / SCCs | Region |
|-----------|------|-----------------------------|-----------|--------|
| **Firebase / Google Cloud** | Hosting, Auth, Firestore, Cloud Functions, Cloud Scheduler, Secret Manager | All application data | Google Cloud DPA + SCCs | us-central1 (US), europe-west1 (EU) |
| **Stripe** | Payment processing, Connect, Tax | Payment card data, bank details, 1099-K data | Stripe DPA | US / EU |
| **OpenAI / Vertex AI** | AI chat, content generation, scheduling suggestions, no-show model | AI prompt inputs (no raw PII per data contracts) | OpenAI DPA / Google Cloud DPA | US |
| **Twilio / SendGrid** | SMS notifications, transactional email | Phone numbers (SMS), email addresses | Twilio DPA / Twilio SendGrid DPA | US |
| **Sentry** | Error monitoring, crash reporting | Device info, anonymized stack traces | Sentry DPA | US |
| **Expo / EAS** | Mobile build distribution | App binaries, build metadata | Expo Privacy Policy | US |
| **Support tooling** (TBD) | Customer support queue | Ticket content, user identifiers | Vendor DPA | TBD |

> **Note:** Add any new sub-processor before integrating it into production. Update this list and notify affected tenants per DPA terms.

---

## 7. Phase E — SOC 2 Type 1 Readiness (W54 + Phase 5)

SOC 2 Type 1 asserts the design of controls at a point in time (vs. Type 2 which asserts operating effectiveness over a period). The goal is to complete the Type 1 audit in Phase 5 (W56+) and begin the Type 2 observation period no later than 6 months post-launch.

### 7-1. Trust Services Criteria Mapping

| TSC Category | Relevance | Evidence to collect |
|-------------|-----------|-------------------|
| **CC1 — Control Environment** | Policy documentation, risk assessment, security ownership | Information security policy, risk register, org chart |
| **CC2 — Communication** | Published privacy policy, security whitepaper, sub-processor list | Links to published documents |
| **CC3 — Risk Assessment** | Threat model, pentest findings, CVSS-scored risk register | Pentest report, this document §1 attack-surface map |
| **CC6 — Logical and Physical Access** | Firebase Auth, RBAC, MFA, access reviews | Access control matrix, MFA enforcement screenshots, quarterly access review procedure |
| **CC7 — System Operations** | Monitoring, incident response, change management | Sentry dashboards, incident response runbook, Git PR approval policy |
| **CC8 — Change Management** | CI/CD pipeline, code review requirements, deployment approval | GitHub branch protection rules, CI configuration |
| **CC9 — Risk Mitigation** | Vendor management (sub-processors), insurance | Sub-processor list with signed DPAs |
| **A1 — Availability** | SLOs, disaster recovery, backup | SLO definitions, DR drill report, PITR configuration |
| **C1 — Confidentiality** | Encryption at rest and in transit, data classification | Whitepaper §3–4, Firestore rules |
| **P — Privacy** | GDPR, CCPA compliance documentation, consent management | Privacy policy, DPA template, GDPR Art. 30 record |

---

### 7-2. Pre-Audit Evidence Gaps (to close in W54 and Phase 5)

- [ ] Information security policy (formal written document, approved by ownership).
- [ ] Access review procedure — quarterly review of all `platform_admin` and `tenant_owner` accounts.
- [ ] Change management policy — documented PRs require at least 1 approval; no self-merges to `main`.
- [ ] Vendor management procedure — new sub-processor intake checklist.
- [ ] Incident response procedure — formal document with defined severity levels, escalation paths, and notification obligations.
- [ ] Risk register — formally maintained, reviewed quarterly.
- [ ] Penetration testing program — annual external pentest documented; this plan serves as v1.
- [ ] Security awareness training — all engineers complete training annually (record completion).
- [ ] Background checks — documented as part of HR onboarding.
- [ ] Encryption key management policy — describe Google-managed key lifecycle.
- [ ] Business continuity plan — DR drill report from W51; RTO/RPO documented.

---

## 8. Implementing Security Features

This section maps each identified control gap to implementation tasks. Each task is assigned a `Wnn-HARDENING-n` debt ID for DEBT_REGISTER tracking.

### 8-1. Immediate Implementation (W50–W51)

| Task | ID | Priority |
|------|-----|---------|
| HTTP security headers on Firebase Hosting (CSP, HSTS, X-Frame-Options, X-Content-Type-Options) | W50-HARDENING-1 | Critical — before launch |
| `expo-secure-store` for auth token storage (replacing any AsyncStorage usage) | W50-HARDENING-2 | Critical — before launch |
| AI callable function input sanitization + output sanitization before Firestore write | W50-HARDENING-3 | Critical — before launch |
| Rate limiting on login, register, booking-create, AI callables | W50-HARDENING-4 | Critical — before launch |
| Certificate pinning for Firebase and Stripe API calls in production mobile build | W50-HARDENING-5 | High — before launch |
| Remove all `console.*` calls from production builds (babel plugin) | W50-HARDENING-6 | High — before launch |
| App Check enforcement in production Firebase project | W50-HARDENING-7 | High — before launch |
| COPPA age affirmation gate at registration | W50-HARDENING-8 | High — before launch (US) |
| TCPA SMS consent + STOP/HELP keyword handling | W50-HARDENING-9 | High — before launch (US) |
| CAN-SPAM: physical address in email footer + one-click unsubscribe + SPF/DKIM/DMARC | W50-HARDENING-10 | High — before launch (US) |
| CCPA DNSOMI toggle in account settings + GPC signal handling on web | W51-HARDENING-1 | High — before launch (US) |
| Data retention purge jobs: AI conversation logs (90 days), error logs (30 days) | W51-HARDENING-2 | High — before launch |
| Right-to-erasure `deleteUserData` Cloud Function (anonymise bookings, delete profiles/consents) | W51-HARDENING-3 | High — before launch |
| Firestore rules: add coverage for supportTickets, escalationQueue, aiSupportKb, featureFlags collections | W51-HARDENING-4 | High — before launch |
| Universal Links (iOS) + App Links (Android) configuration | W51-HARDENING-5 | Medium — before launch |
| Root/jailbreak detection warning on startup | W51-HARDENING-6 | Low — before launch |

### 8-2. Post-Launch Hardening Backlog (W55+)

| Task | Priority |
|------|---------|
| Upgrade from Google-managed encryption to Customer-Managed Encryption Keys (CMEK) for Firestore and GCS | Medium |
| VPC Service Controls around Firebase project (restrict egress to known endpoints) | Medium |
| Automated quarterly access review tooling for `platform_admin` and `tenant_owner` accounts | Medium |
| SOC 2 evidence collection automation (policy-as-code, automated control testing) | High (Phase 5) |
| Annual penetration test (next cycle: ~W104 / ~1 year post-launch) | High |
| CMEP (Certificate Management & Pinning) rotation automation for mobile certificate pinning | Medium |
| Privacy-enhancing technologies audit for AI features (differential privacy for analytics aggregates) | Low |
| Bug bounty program launch (HackerOne or Bugcrowd) | Medium — 6 months post-launch |

---

## 9. Responsible Disclosure Policy

Before commercial launch, publish a responsible disclosure policy at `https://zarkili.com/.well-known/security.txt` and `https://zarkili.com/security`:

```
Contact: mailto:security@zarkili.com
Encryption: [PGP key URL]
Preferred-Languages: en
Policy: https://zarkili.com/security
Acknowledgments: https://zarkili.com/security/hall-of-fame
Expires: [1 year from publish date]
```

**Response commitments:**
- Acknowledge receipt within 2 business days.
- Initial triage within 5 business days.
- Critical findings: patch within 7 days.
- High findings: patch within 30 days.
- Researchers credited in hall-of-fame unless anonymity is requested.
- No legal action against good-faith reporters following the disclosure policy.

---

## 10. Incident Response Runbook (Summary)

Full runbook: [`documentation/new-platform/runbooks/INCIDENT_RESPONSE.md`](runbooks/INCIDENT_RESPONSE.md) (to be created W51).

### Severity Classification

| Severity | Description | Examples |
|----------|-------------|---------|
| **P0 — Critical** | Active exploitation; data breach; loss of multi-tenant isolation | Cross-tenant data leak confirmed; payment credentials exposed |
| **P1 — High** | Potential exploitation; service unavailability for paying customers | Firestore rules bypass discovered; booking service down |
| **P2 — Medium** | Security vulnerability; no active exploitation; limited impact | Unindexed Firestore query causing timeouts; medium CVSS finding |
| **P3 — Low** | Minor security improvement required; no live impact | Informational pentest finding; missing rate limit on low-value endpoint |

### P0 Response Steps

1. **Detect:** Sentry alert / monitoring alarm / external report via `security@zarkili.com`.
2. **Contain (< 15 min):** Disable the affected feature via platform-level feature flag; optionally block the affected tenant if tenant-specific.
3. **Assess (< 1 hour):** Confirm scope of data exposure; determine if breach notification obligations are triggered.
4. **Notify (< 4 hours for internal):** Notify engineering lead, legal counsel, and (if applicable) Firebase/Google incident response.
5. **GDPR notification (< 72 hours):** If EU personal data involved, notify supervisory authority.
6. **US breach notification:** If US personal data involved, follow applicable state breach notification laws (California: 72 hours to AG if 500+ residents; notify individuals within 30 days).
7. **Remediate:** Deploy fix; run affected tests; pentest vendor performs emergency retest if applicable.
8. **Post-mortem (< 7 days):** Root-cause analysis; control improvements; update debt register.

---

## 11. Security Gates for Commercial Launch

All of the following must be satisfied before the commercial launch sign-off:

| Gate | Description | Owner |
|------|-------------|-------|
| **SEC-GATE-1** | `npm audit` 0 High/Critical in workspace root and `functions/` | Engineering |
| **SEC-GATE-2** | `gitleaks` clean — 0 secrets in Git history | Engineering |
| **SEC-GATE-3** | Firestore rules freeze — all collections covered, adversarial tests pass, version hash recorded | Engineering |
| **SEC-GATE-4** | External pentest complete — 0 unresolved High or Critical findings | Engineering + Vendor |
| **SEC-GATE-5** | Firebase App Check enforced in production project | Engineering |
| **SEC-GATE-6** | HTTP security headers deployed on Firebase Hosting (CSP, HSTS, X-Frame-Options, etc.) | Engineering |
| **SEC-GATE-7** | MFA enforced for `tenant_owner` and `platform_admin` accounts | Engineering |
| **SEC-GATE-8** | Stripe webhook signature verification confirmed active in production | Engineering |
| **SEC-GATE-9** | GDPR consent management implemented — all applicable consent paths captured | Engineering |
| **SEC-GATE-10** | CCPA DNSOMI toggle live and GPC signal honored | Engineering |
| **SEC-GATE-11** | TCPA SMS consent + STOP/HELP handling active | Engineering |
| **SEC-GATE-12** | Right-to-erasure `deleteUserData` function deployed and tested | Engineering |
| **SEC-GATE-13** | AI prompt injection defences implemented and tested by pentest | Engineering |
| **SEC-GATE-14** | Auth token stored in secure enclave on mobile (not AsyncStorage) | Engineering |
| **SEC-GATE-15** | Privacy policy and sub-processor list published on public site | Legal + Engineering |
| **SEC-GATE-16** | GDPR Art. 30 record drafted | Legal + Engineering |
| **SEC-GATE-17** | Incident response runbook published and reviewed by team | Engineering |
| **SEC-GATE-18** | Disaster-recovery drill executed; RTO and RPO recorded | Engineering |
| **SEC-GATE-19** | SAST in CI — no new High findings introduced by any PR in last 4 weeks | Engineering |
| **SEC-GATE-20** | CAN-SPAM email compliance: physical address, unsubscribe, SPF/DKIM/DMARC | Engineering |

```
COMMERCIAL LAUNCH SECURITY SIGN-OFF
=====================================
SEC-GATE-1:  [ ] Pass  Date: ___________  Signed: ___________
SEC-GATE-2:  [ ] Pass  Date: ___________  Signed: ___________
SEC-GATE-3:  [ ] Pass  Date: ___________  Signed: ___________
SEC-GATE-4:  [ ] Pass  Date: ___________  Signed: ___________
SEC-GATE-5:  [ ] Pass  Date: ___________  Signed: ___________
SEC-GATE-6:  [ ] Pass  Date: ___________  Signed: ___________
SEC-GATE-7:  [ ] Pass  Date: ___________  Signed: ___________
SEC-GATE-8:  [ ] Pass  Date: ___________  Signed: ___________
SEC-GATE-9:  [ ] Pass  Date: ___________  Signed: ___________
SEC-GATE-10: [ ] Pass  Date: ___________  Signed: ___________
SEC-GATE-11: [ ] Pass  Date: ___________  Signed: ___________
SEC-GATE-12: [ ] Pass  Date: ___________  Signed: ___________
SEC-GATE-13: [ ] Pass  Date: ___________  Signed: ___________
SEC-GATE-14: [ ] Pass  Date: ___________  Signed: ___________
SEC-GATE-15: [ ] Pass  Date: ___________  Signed: ___________
SEC-GATE-16: [ ] Pass  Date: ___________  Signed: ___________
SEC-GATE-17: [ ] Pass  Date: ___________  Signed: ___________
SEC-GATE-18: [ ] Pass  Date: ___________  Signed: ___________
SEC-GATE-19: [ ] Pass  Date: ___________  Signed: ___________
SEC-GATE-20: [ ] Pass  Date: ___________  Signed: ___________

Overall sign-off: _______________  Date: _______________
```

---

## 12. Ongoing Security Posture (Post-Launch)

| Activity | Cadence | Owner |
|----------|---------|-------|
| `npm audit` check | Every CI run + weekly scheduled scan | CI / Engineering |
| Dependency update sweep | Monthly | Engineering |
| Internal security review (code review focus) | Quarterly | Engineering Lead |
| External penetration test | Annual | Contracted vendor |
| Firebase IAM access review (platform admins) | Quarterly | Engineering Lead |
| Firestore rules review after any schema change | Per deploy | Engineering |
| SOC 2 Type 2 observation period | Ongoing from ~6 months post-launch | Engineering + Auditor |
| Bug bounty triage | Continuous (once program live) | Security Lead |
| GDPR Article 30 record update | Per any new data processing activity | Legal + Engineering |
| Privacy policy review | Annual or when processing changes | Legal |
| AI model safety review (new models or prompt changes) | Per model/prompt change | Engineering + AI Lead |

---

## 13. Document Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-05-15 | Zarkili Engineering (via Copilot) | Initial comprehensive plan — pre-W50 |
