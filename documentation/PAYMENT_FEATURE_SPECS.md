# 💳 Payments Feature — Full Specification  
### Developer‑Ready Functional Specification (Markdown)  
### Scope: Client Booking Flow, Salon Controls, Payment Rules, Deposits, Cancellation Fees, Card‑on‑File, Payouts, Refunds, Edge Cases

---

## 1. Overview

The Payments Feature enables:

- Clients to pay deposits or full amounts during booking  
- Salons to configure payment rules  
- Automatic charging of cancellation fees  
- Automatic charging of remaining balances after service  
- Secure card‑on‑file storage  
- Automated payouts to salons  
- Refunds (full or partial)  
- Transparent receipts and reporting  

A payment processor (Stripe Connect recommended) handles:

- Card storage  
- Payment authorization  
- Payment capture  
- Payouts  
- Refunds  
- Tax documents  
- Compliance (KYC/AML)  

Your platform orchestrates flows but **never touches funds directly**.

---

## 2. Payment Concepts

### 2.1 Payment Types
- **Deposit** (flat or percentage)
- **Full payment**
- **Cancellation fee**
- **Remaining balance**
- **Tip**
- **Refund**

### 2.2 Payment States
- `pending`
- `authorized`
- `captured`
- `refunded`
- `failed`
- `voided`

### 2.3 Card-on-File
- Stored securely via Stripe  
- Tokenized  
- Used for:
  - Deposits  
  - Cancellation fees  
  - Remaining balance  
  - No-show charges  

---

## 3. Client-Side Payment Flow (End User)

### 3.1 Booking Flow

#### Step 1 — Select service
Client chooses:
- Service  
- Add-ons  
- Staff  
- Date/time  

System calculates:
- Total price  
- Deposit amount  
- Cancellation fee (if applicable)  

#### Step 2 — Checkout
Client sees:
- Service summary  
- Total price  
- Deposit amount  
- Amount due later  
- Cancellation policy  
- Payment options  

#### Step 3 — Payment Options

##### Option A — Pay Deposit Only
- Charge deposit now  
- Store card for later charges  
- Show “Amount due at salon: X”

##### Option B — Pay Full Amount
- Charge full amount now  
- Store card for cancellation fee only  

##### Option C — Apple Pay / Google Pay
- Same logic as above  

#### Step 4 — Confirmation Screen
After successful payment:
- Booking confirmed  
- Receipt emailed  
- Deposit applied  
- Card saved  
- “Add to calendar” button  
- Salon location + instructions  

---

## 4. Salon-Side Payment Configuration

### 4.1 Payment Rules

Salons can configure:

#### Deposits
- Enabled/disabled  
- Flat amount  
- Percentage  
- Per-service overrides  

#### Cancellation Fees
- Enabled/disabled  
- Flat or percentage  
- Applies when:
  - X hours before appointment  
  - No-show  
  - Late cancellation  

#### Card-on-File Requirement
- Required for all bookings  
- Required only for new clients  
- Required only for high-value services  

#### Full Prepayment
- Optional per service  
- Optional for new clients only  

---

## 5. Payment Scenarios

### Scenario 1 — Deposit Booking

Flow:
1. Client selects service  
2. System calculates deposit  
3. Client pays deposit  
4. Card stored  
5. Appointment confirmed  
6. Remaining balance due after service  

After appointment:
- Salon marks “Completed”  
- System charges remaining balance  
- Client can add tip  
- Receipt sent  

Edge cases:
- Card fails → client must update card  
- Salon can mark as paid manually  

---

### Scenario 2 — Full Prepayment

Flow:
1. Client selects service  
2. Chooses “Pay full amount”  
3. Payment captured  
4. Card stored for cancellation fee only  
5. Appointment confirmed  

After appointment:
- No remaining balance  
- Tip charged separately  

---

### Scenario 3 — Cancellation Fee (Late Cancel)

Flow:
1. Client cancels  
2. System checks rules  
3. If fee applies:
   - Charge card  
   - Send receipt  
   - Notify salon  
4. Appointment marked “Cancelled (fee charged)”  

Edge cases:
- Card fails → retry logic  
- Salon can waive fee  

---

### Scenario 4 — No-Show Fee

Flow:
1. Salon marks “No-show”  
2. System checks rules  
3. Charge fee  
4. Send receipt  
5. Update reports  

---

### Scenario 5 — Remaining Balance Charge

Flow:
1. Salon marks “Completed”  
2. System calculates remaining balance  
3. Charge card  
4. Client can add tip  
5. Receipt sent  

Edge cases:
- Card fails → retry + notify  
- Salon can mark as “Paid in cash”  

---

### Scenario 6 — Tip Flow

Tips can be added:
- After service  
- During checkout (if full payment upfront)  
- Via link sent to client  

Tip payment:
- Charged immediately  
- Added to payout  
- Shown in reports  

---

### Scenario 7 — Failed Payment Handling

If any payment fails:
- Retry 3 times  
- Notify client  
- Notify salon  
- Appointment flagged  
- Client must update card  

---

## 6. Refunds Flow

Refunds are initiated by the salon.

### 6.1 Refund Types
- Full refund  
- Partial refund  
- Deposit refund  
- Cancellation fee refund  
- Remaining balance refund  
- Tip refund  

### 6.2 Refund Flow

1. Salon opens appointment  
2. Clicks “Issue refund”  
3. Selects refund type  
4. System sends refund request to Stripe  
5. Stripe processes refund  
6. Client receives confirmation  
7. Reports update  

### 6.3 Refund Timing
- Instant for some banks  
- 3–10 days typical  
- Status shown in dashboard  

### 6.4 Refund Restrictions
- Cannot refund more than captured  
- Cannot refund if payout is in progress  
- Partial refunds allowed anytime  

---

## 7. Payouts Flow (Salon)

### 7.1 Payout Schedule
- Daily (default)  
- Weekly (optional)  

### 7.2 Payout Calculation
Includes:
- Deposits  
- Remaining balances  
- Cancellation fees  
- Tips  
- Minus platform fees  
- Minus Stripe fees  

### 7.3 Payout Dashboard
Shows:
- Next payout date  
- Amount  
- Breakdown  
- Past payouts  
- Fees  
- Refund adjustments  

---

## 8. Receipts & Notifications

### Client Receipts
Sent for:
- Deposit  
- Full payment  
- Cancellation fee  
- Remaining balance  
- Tip  
- Refund  

### Salon Notifications
Sent for:
- New booking  
- Payment received  
- Cancellation fee charged  
- No-show fee charged  
- Refund issued  
- Failed payment  

---

## 9. Error Handling & Edge Cases

### Card fails during deposit
- Booking not confirmed  
- Client prompted to retry  

### Card fails during cancellation fee
- Retry logic  
- Client + salon notified  

### Card fails during remaining balance
- Retry logic  
- Appointment flagged  
- Client must update card  

### Salon changes payment rules
- Existing bookings retain old rules  
- New bookings use updated rules  

---

## 10. Security & Compliance

- All card data stored via Stripe tokens  
- PCI compliance handled by Stripe  
- Platform never stores raw card data  
- All API calls authenticated  
- All payment events logged  

---

## 11. Non-Functional Requirements

- Payment flow must complete in < 30 seconds  
- Apple Pay / Google Pay prioritized  
- Mobile-first design  
- Human-readable errors  
- Idempotent flows (no double charges)  

---

# ✔️ Payments Feature Spec Complete
