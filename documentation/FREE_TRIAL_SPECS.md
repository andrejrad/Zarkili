# 🎁 Free Trial Feature — Full Specification  
### Developer‑Ready Functional Specification (Markdown)  
### Scope: Trial Activation, Trial States, Trial Expiration, Upgrade Flow, Restrictions, Notifications, Edge Cases

---

## 1. Overview

The Free Trial feature allows new salons to use the platform with **full functionality** for a limited time (e.g., 14 or 30 days) before requiring a paid subscription.

The trial is designed to:

- Reduce onboarding friction  
- Increase sign-ups  
- Allow salons to experience value before paying  
- Support viral growth (founding salon offers, referrals)  
- Convert high-intent users into paying customers  

The trial **does not** affect Stripe Connect or client payments.  
Salons can accept deposits, cancellation fees, and payouts during the trial.

---

## 2. Trial Concepts

### 2.1 Trial Duration
Configurable:
- Default: **14 days** or **30 days**
- Founding salons: **60–90 days**
- Referral bonus: +7 to +30 days

### 2.2 Trial States
- `not_started` — salon has not completed onboarding  
- `active` — trial is running  
- `expiring_soon` — X days left (default: 3)  
- `expired` — trial ended, subscription required  
- `upgraded` — salon subscribed before trial ended  

### 2.3 Trial Activation Trigger
Trial begins when:
- Salon completes onboarding **AND**
- Salon activates their booking link (or completes Stripe Connect)

This ensures trial time isn’t wasted during setup.

---

## 3. Trial Activation Flow

### Step 1 — Salon completes onboarding
Required:
- Business profile  
- Services  
- Availability  
- Policies  
- Stripe Connect (optional but recommended)  

### Step 2 — System activates free trial
Salon sees:
> 🎉 **Your free trial has started!**  
> You have **14 days** of full access.

### Step 3 — Trial countdown begins
Dashboard shows:
- Days remaining  
- Upgrade CTA  
- Benefits of upgrading  

### Step 4 — Booking link becomes active
Salon can:
- Accept bookings  
- Accept payments  
- Appear in marketplace (if enabled)  

---

## 4. What Salons Can Do During the Trial

During the free trial, salons have **full access** to:

### Core features
- Booking  
- Calendar  
- Services  
- Staff  
- Clients  
- Policies  
- Availability  

### Payments
- Deposits  
- Cancellation fees  
- Remaining balance charges  
- Tips  
- Payouts  
- Refunds  

### Marketplace
- Visible in marketplace  
- Can post content  
- Can receive new clients  

### Messaging
- Chat with clients  
- Automated reminders  

### Analytics
- Basic analytics  
- Marketplace analytics  

---

## 5. What Happens When Trial Ends

When the trial expires:

### 5.1 Booking is disabled
- Clients cannot book new appointments  
- Booking link shows:
  > “This salon is not accepting online bookings right now.”

### 5.2 Marketplace profile hidden
- Salon removed from discovery feed  
- Posts hidden  
- Direct profile link shows:
  > “This salon is currently inactive.”

### 5.3 Existing appointments remain active
Salon can still:
- View appointments  
- Complete appointments  
- Charge remaining balances  
- Issue refunds  

### 5.4 Payments still work
Stripe Connect continues to:
- Charge clients  
- Send payouts  
- Handle refunds  

### 5.5 Dashboard shows upgrade prompt
Banner:
> “Your free trial has ended. Subscribe to reactivate bookings.”

---

## 6. Upgrade Flow (Trial → Paid)

### Step 1 — Salon clicks “Upgrade”
From:
- Dashboard banner  
- Settings → Subscription  
- Trial countdown widget  

### Step 2 — Choose plan
Plans:
- Solo  
- Team  
- Multi-location  
- Add-ons (optional)  

### Step 3 — Enter payment method
- Credit card  
- Apple Pay / Google Pay (optional)  

### Step 4 — Subscription activated
- Booking re-enabled  
- Marketplace visibility restored  
- Trial state becomes `upgraded`  

### Step 5 — Confirmation screen
> “Your subscription is active. Your booking link is live again.”

---

## 7. Notifications & Reminders

### 7.1 Trial Start
- In-app banner  
- Email: “Welcome to your free trial!”

### 7.2 Trial Progress
- Day 7 (for 14-day trial)  
- Day 15 (for 30-day trial)  

### 7.3 Trial Expiring Soon
Sent at:
- 3 days left  
- 1 day left  

Message:
> “Your trial ends soon. Upgrade to keep your booking link active.”

### 7.4 Trial Expired
- In-app banner  
- Email: “Your trial has ended — reactivate your booking link.”

---

## 8. Edge Cases & Special Scenarios

### 8.1 Salon Does Not Complete Onboarding
- Trial does **not** start  
- Dashboard shows:
  > “Finish onboarding to start your free trial.”

### 8.2 Salon Completes Onboarding but Skips Stripe Connect
- Trial starts  
- Booking enabled  
- Payments disabled  
- Banner:
  > “Set up payments to accept deposits and fees.”

### 8.3 Salon Upgrades Before Trial Ends
- Trial ends early  
- Subscription begins immediately  
- No double billing  

### 8.4 Salon Downgrades Plan
- Allowed anytime  
- Changes apply next billing cycle  

### 8.5 Salon Cancels Subscription After Trial
- Booking disabled  
- Marketplace hidden  
- Data retained  

### 8.6 Founding Salon Extended Trial
- Custom trial duration  
- Special badge (optional)  
- Early adopter perks  

---

## 9. Non-Functional Requirements

- Trial countdown must be accurate to the minute  
- All trial states must persist across devices  
- Trial must not block Stripe Connect flows  
- Trial must not block payouts  
- Trial expiration must be idempotent (no double disabling)  
- All trial-related UI must be mobile-first  

---

## 10. Admin Controls

Admins can:
- Extend trial  
- Shorten trial  
- Restart trial (rare)  
- View trial history  
- Apply founding salon perks  

---

# ✔️ Free Trial Feature Spec Complete
