# 👤 Client Onboarding — Full Specification  
### Developer‑Ready Functional Specification (Markdown)  
### Scope: Account Creation, Authentication, Profile Setup, Preferences, Payment Methods, Notifications, Loyalty, Edge Cases

---

## 1. Overview

Client onboarding is the process through which a new user (end customer) becomes able to:

- Browse the marketplace  
- Discover salons  
- Book appointments  
- Save payment methods  
- Manage their profile  
- Receive notifications  
- Track appointments  
- Save posts, looks, and inspiration  
- Earn loyalty rewards (if enabled)  

The onboarding must be:

- Fast (30–60 seconds)  
- Mobile-first  
- Optional (guest booking allowed)  
- Designed to reduce friction  
- Social-friendly (Apple/Google login)  

---

## 2. Onboarding Entry Points

Clients can start onboarding from:

- Booking flow (most common)  
- Marketplace “Sign up” button  
- “Save post” action  
- “Like” or “Follow” action  
- “Message salon” action  
- “View appointment history”  
- “Add payment method”  
- “Join loyalty program”  

All entry points lead to the same onboarding flow.

---

## 3. Account Types

### 3.1 Guest Account
- No password  
- Email + phone required  
- Can complete a booking  
- Card-on-file stored via Stripe  
- Limited features  

### 3.2 Full Account
- Email + password OR  
- Apple login OR  
- Google login  

Full accounts unlock:
- Saved payment methods  
- Saved posts  
- Saved salons  
- Loyalty tracking  
- Appointment history  
- Messaging  
- Profile personalization  

---

## 4. Onboarding Steps (High-Level)

1. **Account Creation (or Guest Checkout)**  
2. **Phone Verification (optional but recommended)**  
3. **Profile Setup (optional)**  
4. **Payment Method Setup (optional)**  
5. **Preferences Setup (optional)**  
6. **Notification Permissions**  
7. **Loyalty Enrollment (optional)**  

Each step is detailed below.

---

# 5. Step-by-Step Onboarding Flow

---

## 5.1 Step 1 — Account Creation

### Required fields:
- Email  
- Password (unless social login)  

### Optional:
- Apple login  
- Google login  

### Flow:
1. User enters email + password  
2. Email verification sent  
3. After verification → proceed to profile setup  

### Guest Flow:
- User enters email + phone  
- No password required  
- Booking continues  

### Edge cases:
- Email already exists → login prompt  
- Social login mismatch → merge accounts  
- Guest tries to save content → prompt to create full account  

---

## 5.2 Step 2 — Phone Verification (Optional)

### Purpose:
- Reduce no-shows  
- Enable SMS reminders  
- Enable 2FA for payments  

### Flow:
1. User enters phone number  
2. SMS code sent  
3. User enters code  
4. Phone verified  

### Edge cases:
- Incorrect code → retry  
- Too many attempts → cooldown  
- Skip allowed (but reminders disabled)  

---

## 5.3 Step 3 — Profile Setup (Optional)

### Fields:
- First name  
- Last name  
- Profile photo  
- Gender (optional)  
- Birthday (optional)  
- Hair type / skin type (optional)  
- Location (auto-detected)  

### Flow:
1. User enters basic info  
2. System personalizes feed  
3. User can skip  

### Edge cases:
- Missing name → fallback to email prefix  
- No photo → default avatar  

---

## 5.4 Step 4 — Payment Method Setup (Optional)

### Purpose:
- Faster checkout  
- Required for deposits  
- Required for cancellation fees  

### Flow:
1. User can add card  
2. Card stored via Stripe  
3. Token saved to user profile  

### Edge cases:
- Card fails → retry  
- User skips → card required later during booking  

---

## 5.5 Step 5 — Preferences Setup (Optional)

### Preferences include:
- Favorite services (hair, nails, lashes, brows, etc.)  
- Style preferences (natural, bold, minimalist, glam, etc.)  
- Budget range  
- Preferred distance  
- Preferred staff gender (optional)  

### Flow:
1. User selects preferences  
2. Feed and search personalized  
3. User can skip  

---

## 5.6 Step 6 — Notification Permissions

### Types of notifications:
- Appointment reminders  
- Appointment updates  
- Payment receipts  
- Promotions (optional)  
- Loyalty rewards  
- Chat messages  

### Flow:
1. App requests push notification permission  
2. User accepts or declines  
3. Email/SMS fallback enabled  

### Edge cases:
- User declines → fallback to email/SMS  
- User disables notifications later → update preferences  

---

## 5.7 Step 7 — Loyalty Enrollment (Optional)

If loyalty is enabled:

### Flow:
1. User sees “Join loyalty program”  
2. One tap enrollment  
3. Points start accumulating  

### Edge cases:
- User declines → can join later  
- User joins → retroactive points optional  

---

# 6. Post-Onboarding Experience

After onboarding, user enters the **Client Dashboard**, which includes:

- Upcoming appointments  
- Past appointments  
- Saved posts  
- Saved salons  
- Payment methods  
- Loyalty points  
- Profile settings  
- Notifications  

---

# 7. Booking Flow Integration

Client onboarding integrates tightly with booking:

### 7.1 Guest Booking
Allowed, but:
- Must enter email + phone  
- Must add card if deposit required  
- Cannot save posts or salons  
- Cannot view appointment history  

### 7.2 Full Account Booking
- Faster checkout  
- Saved card  
- Saved preferences  
- Loyalty points applied  
- Appointment history visible  

### 7.3 Upgrade Prompt
If guest tries to:
- Save a post  
- Follow a salon  
- Message a salon  
- Join loyalty  

→ Prompt to create full account.

---

# 8. Edge Cases & Special Scenarios

### 8.1 Duplicate Accounts
- Merge flow triggered  
- User chooses primary account  

### 8.2 Social Login Email Conflict
- Prompt: “This email already has an account. Log in instead.”  

### 8.3 User Deletes Account
- All personal data removed  
- Appointments anonymized  
- Payment methods removed  

### 8.4 User Changes Phone Number
- Re-verification required  

### 8.5 User Books Without Completing Onboarding
- Allowed  
- Booking confirmation still sent  
- User prompted to finish onboarding later  

---

# 9. Non-Functional Requirements

- Onboarding must complete in < 60 seconds  
- All steps must be skippable (except email/phone for booking)  
- Autosave after each field  
- Clear error messages  
- Mobile-first design  
- Smooth transitions  
- Minimal typing required  

---

# ✔️ Client Onboarding Feature Spec Complete
