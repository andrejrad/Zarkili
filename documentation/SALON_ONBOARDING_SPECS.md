# 🏪 Salon Onboarding — Full Specification  
### Developer‑Ready Functional Specification (Markdown)  
### Scope: Account Creation, Business Setup, Payment Setup, Services, Staff, Policies, Marketplace, Verification, Edge Cases

---

## 1. Overview

The Salon Onboarding flow is the process through which a salon:

- Creates an account  
- Sets up business details  
- Configures payment processing (Stripe Connect)  
- Adds services and pricing  
- Adds staff (if applicable)  
- Sets cancellation/deposit rules  
- Sets availability  
- Configures marketplace visibility  
- Completes verification steps  
- Becomes fully operational on the platform  

The onboarding must be:

- Fast (5–10 minutes)  
- Mobile-first  
- Modular (salon can skip steps and return later)  
- Clear and non-technical  
- Designed to reduce friction  

---

## 2. Onboarding Entry Points

Salons can start onboarding via:

- “Create Salon Account” button  
- Invitation link (from platform or referral)  
- Marketplace “Claim this salon” link  
- Mobile app onboarding  
- Web onboarding  

All entry points lead to the same onboarding flow.

---

## 3. Onboarding Steps (High-Level)

1. **Account Creation**  
2. **Business Profile Setup**  
3. **Payment Setup (Stripe Connect)**  
4. **Service Setup**  
5. **Staff Setup** (optional for solo providers)  
6. **Policies Setup (Deposits, Cancellation Fees)**  
7. **Availability Setup**  
8. **Marketplace Visibility Setup**  
9. **Verification & Launch**  

Each step is detailed below.

---

# 4. Step-by-Step Onboarding Flow

---

## 4.1 Step 1 — Account Creation

### Required fields:
- Owner name  
- Email  
- Phone number  
- Password  

### Optional:
- Referral code  
- Social login (Apple/Google)  

### Flow:
1. Salon enters email + password  
2. Email verification sent  
3. After verification → proceed to business setup  

### Edge cases:
- Email already exists → login prompt  
- Unverified email → resend verification  
- Social login mismatch → merge accounts  

---

## 4.2 Step 2 — Business Profile Setup

### Required fields:
- Business name  
- Business category (hair, nails, lashes, brows, esthetics, massage, etc.)  
- Address (for map + marketplace)  
- Phone number  
- Time zone  

### Optional:
- Logo  
- Cover photo  
- Bio / About section  
- Website  
- Instagram / TikTok links  

### Flow:
1. Salon enters basic info  
2. System validates address  
3. System sets default time zone  
4. Salon preview of public profile  

### Edge cases:
- Home-based salons → option to hide exact address  
- Multi-location → option to add additional locations later  

---

## 4.3 Step 3 — Payment Setup (Stripe Connect)

### Required fields (Stripe handles):
- Legal business name  
- Owner name  
- Bank account  
- Tax information  
- Identity verification  

### Flow:
1. Salon clicks “Set up payments”  
2. Redirect to Stripe Connect onboarding  
3. Stripe detects:
   - Existing Stripe account → salon logs in  
   - No account → new connected account created  
4. Stripe returns success token  
5. Platform marks payment setup as “Complete”  

### What salon sees:
- “You will receive payouts automatically”  
- “Your clients can now pay deposits and fees”  

### Edge cases:
- Verification pending → allow bookings but hold payouts  
- Verification failed → disable payments until resolved  
- Salon skips payment setup → allow booking but no deposits  

---

## 4.4 Step 4 — Service Setup

### Required fields:
- Service name  
- Duration  
- Price  

### Optional:
- Category (hair, nails, etc.)  
- Add-ons  
- Variants (short hair / long hair, etc.)  
- Description  
- Photos  
- Staff assignment  
- Deposit override  
- Prepayment requirement  

### Flow:
1. Salon selects templates (optional)  
2. Adds services manually or imports from:
   - CSV  
   - Another platform (future)  
3. System validates duration + price  
4. Services appear in booking flow  

### Edge cases:
- No services added → cannot go live  
- Missing prices → mark as “price on consultation”  

---

## 4.5 Step 5 — Staff Setup (Optional for solo providers)

### Required fields:
- Staff name  
- Role  

### Optional:
- Photo  
- Bio  
- Working hours  
- Services they perform  
- Commission settings  
- Login access (email + password)  

### Flow:
1. Salon adds staff  
2. Assigns services  
3. Sets availability  
4. Sends staff login invites  

### Edge cases:
- Solo provider → skip staff step  
- Staff without login → can still be assigned services  

---

## 4.6 Step 6 — Policies Setup

### Policies include:
- **Deposits**  
- **Cancellation fees**  
- **No-show fees**  
- **Late arrival rules**  
- **Refund rules**  

### Deposit options:
- Flat amount  
- Percentage  
- Per-service override  
- New clients only  

### Cancellation fee options:
- Flat amount  
- Percentage  
- Applies:
  - X hours before appointment  
  - No-show  
  - Late cancellation  

### Flow:
1. Salon selects deposit rules  
2. Selects cancellation rules  
3. System previews how clients will see policies  
4. Policies saved  

### Edge cases:
- Salon disables deposits → booking allowed but no protection  
- Salon sets 0% cancellation fee → no fee charged  

---

## 4.7 Step 7 — Availability Setup

### Required fields:
- Business hours  

### Optional:
- Staff hours  
- Breaks  
- Holidays  
- Blackout dates  
- Buffer times  

### Flow:
1. Salon sets weekly schedule  
2. Staff schedules override business hours  
3. System validates overlapping times  
4. Availability goes live  

### Edge cases:
- No availability → booking disabled  
- Staff availability missing → staff hidden from booking  

---

## 4.8 Step 8 — Marketplace Visibility Setup

### Options:
- Visible in marketplace (default)  
- Visible only via direct link  
- Hidden from marketplace  

### Salon can configure:
- Profile visibility  
- Post visibility  
- Style tags  
- Featured services  
- Price visibility  

### Flow:
1. Salon chooses visibility level  
2. System previews marketplace profile  
3. Salon confirms  

### Edge cases:
- Hidden salon → still bookable via direct link  
- No posts → profile shows services only  

---

## 4.9 Step 9 — Verification & Launch

### Checklist:
- Business profile complete  
- Payment setup complete  
- At least 1 service  
- Availability set  
- Policies set  

### Flow:
1. System checks all required steps  
2. If complete → “Your salon is live!”  
3. Salon receives:
   - Public booking link  
   - QR code  
   - Social media sharing buttons  

### Optional:
- Import clients  
- Import appointments  
- Add gallery photos  
- Create first marketplace post  

---

# 5. Post-Onboarding Experience

After onboarding, salon enters the **Dashboard**, which includes:

- Calendar  
- Appointments  
- Payments & payouts  
- Clients  
- Services  
- Staff  
- Marketplace analytics  
- Settings  

---

# 6. Edge Cases & Special Scenarios

### 6.1 Salon Skips Payment Setup
- Bookings allowed  
- Deposits disabled  
- Cancellation fees disabled  
- Banner shown: “Set up payments to enable deposits and fees”  

### 6.2 Salon Has Pending Stripe Verification
- Bookings allowed  
- Deposits allowed  
- Payouts paused until verification completes  

### 6.3 Multi-Location Salons
- Onboarding applies per location  
- Shared staff optional  
- Shared services optional  

### 6.4 Staff Without Login
- Can be assigned services  
- Cannot manage calendar  
- Cannot receive notifications  

### 6.5 Incomplete Onboarding
- Dashboard shows progress bar  
- Critical steps highlighted  
- Booking disabled until required steps complete  

---

# 7. Non-Functional Requirements

- Onboarding must be mobile-first  
- Steps must be skippable (except required ones)  
- Autosave after each field  
- Clear error messages  
- Progress indicator visible at all times  
- Onboarding must complete in < 10 minutes  

---

# ✔️ Salon Onboarding Feature Spec Complete
