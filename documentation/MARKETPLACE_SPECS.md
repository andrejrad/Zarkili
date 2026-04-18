# 🌐 Marketplace Feature — Full Specification  
### Developer‑Ready Functional Spec (Markdown)  
### Scope: Discovery Feed, Salon Profiles, Booking Entry Points, Rules, No-Commission Model, Anti-Fresha Principles

---

## 1. Overview

The **Marketplace** is a **client-facing discovery layer** that:

- Helps clients **discover salons** based on style, location, and preferences  
- Helps salons **showcase their work** and **attract new clients**  
- Integrates seamlessly with the **booking and payments** system  
- Explicitly **does not steal clients**, **does not charge commission**, and **does not promote competitors** against a salon’s own clients  

Core principles:

1. **No client theft** — clients discovered via marketplace become the salon’s clients, not the platform’s.  
2. **No commission** — no per-booking marketplace fee.  
3. **No competitor injection** — no “similar salons near you” on a salon’s own booking flow.  
4. **Salon-first branding** — marketplace amplifies the salon’s brand, not the platform’s.  

---

## 2. Core Concepts

### 2.1 Entities

- **Client (End User)**  
  A person browsing the marketplace and booking services.

- **Salon**  
  A business using the platform; can opt into marketplace visibility.

- **Marketplace Profile**  
  Public-facing salon page with:
  - Name, logo, photos, videos  
  - Services (high-level view)  
  - Location, hours  
  - Social-style feed (posts, before/after, reels)  
  - Reviews & rating  
  - “Book” button  

- **Post**  
  Content item created by salon:
  - Photo, video, carousel  
  - Caption, tags, services linked  
  - Optional “Book this look” link  

- **Feed**  
  TikTok/Instagram-style scrollable feed of posts from salons.

---

## 3. Salon-Side Marketplace Controls

### 3.1 Marketplace Opt-In

Salons can:

- **Enable/disable marketplace visibility**  
- Choose:
  - Show full profile  
  - Show only posts (no direct search listing)  
  - Hide from search but allow direct profile link  

Default: **Opted in**, but can be turned off.

### 3.2 Profile Management

Salon can manage:

- **Basic info**: name, logo, cover image, bio, location, hours  
- **Branding**: colors, style tags (e.g., “minimalist”, “bold”, “natural”)  
- **Service highlights**: featured services (e.g., “Russian volume lashes”, “Balayage”, “Gel extensions”)  
- **Media**: photos, videos, before/after  
- **Links**: Instagram, TikTok, website  

### 3.3 Post Creation

Salon can create posts:

- Upload media (image/video)  
- Add caption  
- Tag:
  - Services  
  - Style tags (e.g., “blonde”, “nail art”, “acne facial”)  
  - Price range (optional)  
- Mark as:
  - “Transformation”  
  - “New set”  
  - “Maintenance”  
- Attach “Book this look” → pre-fills booking with relevant service(s)

### 3.4 Visibility Settings

Per salon:

- Show in:
  - Local search  
  - Global search (optional)  
  - Feed only  
- Hide:
  - Prices (optional)  
  - Staff list (optional)  

---

## 4. Client-Side Marketplace Experience

### 4.1 Entry Points

Clients can enter the marketplace via:

- Home screen “Discover” tab  
- Search bar (location, service, style)  
- Shared salon profile link  
- Shared post link  
- “Explore similar looks” (but **not** similar salons on booking page)

### 4.2 Discovery Modes

1. **Feed Mode** (default)  
   - Infinite scroll of posts  
   - Personalized by:
     - Location  
     - Services viewed  
     - Posts liked/saved  
     - Bookings history  

2. **Search Mode**  
   - Filters:
     - Location (city, radius)  
     - Service type (hair, nails, lashes, brows, massage, facials, etc.)  
     - Price range  
     - Rating  
     - Availability (e.g., “this week”)  
     - Style tags (e.g., “natural nails”, “bold color”, “curly hair”)  

3. **Map Mode** (optional phase)  
   - Map with salon pins  
   - Tap to open profile  

### 4.3 Salon Profile (Client View)

Profile shows:

- Name, logo, cover image  
- Rating + review count  
- Location + distance  
- “Book” button  
- “Message” button (if chat enabled)  
- Services (high-level list with “from” prices)  
- Gallery (grid of posts)  
- About section  
- Staff (optional)  
- Policies (cancellation, deposits, etc.)  

### 4.4 Post View (Client)

When client taps a post:

- Full-screen media  
- Caption  
- Tags (services, styles)  
- “Book this look” button  
- “View salon profile” button  
- “Save” / “Like”  

---

## 5. Booking from Marketplace

### 5.1 Booking Entry Points

Client can start booking from:

- Salon profile “Book” button  
- Post “Book this look” button  
- Service list on profile  

### 5.2 Booking Flow (from Marketplace)

1. Client taps “Book” or “Book this look”  
2. System:
   - Pre-selects salon  
   - Optionally pre-selects service (if from post)  
3. Client selects:
   - Service (if not pre-selected)  
   - Staff (optional)  
   - Date/time  
4. Payment flow:
   - Deposit or full payment (per salon rules)  
5. Booking confirmation  

**Important rule:**  
Once client is in a salon’s booking flow, **no other salons are shown or suggested**.

No:
- “Similar salons near you”  
- “Other options”  
- “Cheaper alternatives”  

---

## 6. Rules to Avoid “Client Theft”

These rules are critical to your positioning.

### 6.1 No Cross-Promotion on Booking Flow

- When viewing a specific salon’s profile or booking flow:
  - Do **not** show other salons  
  - Do **not** show “similar salons”  
  - Do **not** show “people also booked”  

### 6.2 Client Ownership

- Any client who books a salon via marketplace:
  - Is considered that salon’s client  
  - Can be contacted by that salon directly (within platform)  
  - Is not “reassigned” or “shared” with other salons  

### 6.3 No Commission

- Marketplace does **not** charge:
  - Per-booking fee  
  - “New client” fee  
  - Percentage of revenue  

Monetization comes from:
- Subscription  
- Add-ons  
- (Optionally later) paid promotion slots clearly labeled as ads  

### 6.4 Data Transparency

- Salon can see:
  - How many new clients came from marketplace  
  - Which posts generated bookings  
  - Which tags/styles perform best  

---

## 7. Salon-Side Analytics

### 7.1 Marketplace Analytics

Salon dashboard shows:

- Profile views  
- Post views  
- Post likes/saves  
- Clicks on “Book”  
- Bookings from marketplace  
- Revenue from marketplace-sourced clients  

### 7.2 Content Performance

Per post:

- Views  
- Likes  
- Saves  
- Bookings attributed  
- Services booked from that post  

---

## 8. Client-Side Personalization

### 8.1 Signals Used

Personalization can use:

- Location  
- Services viewed  
- Posts liked/saved  
- Salons followed (optional future feature)  
- Past bookings  
- Style tags interacted with  

### 8.2 Feed Ranking

Basic rules:

- Prioritize:
  - Local salons  
  - High-engagement posts  
  - Styles client has interacted with  
- Avoid:
  - Repeating same salon too often  
  - Showing irrelevant services  

---

## 9. Edge Cases & States

### 9.1 Salon Disables Marketplace

If salon turns off marketplace:

- Profile is hidden from:
  - Search  
  - Feed  
  - Map  
- Existing direct links:
  - Show “This salon is not publicly visible”  
  - Still allow existing clients to book via direct booking link (non-marketplace)  

### 9.2 Salon Suspended / Inactive

If salon is suspended or inactive:

- Profile hidden  
- Posts hidden  
- Booking disabled  
- Existing bookings remain visible to clients but cannot create new ones  

### 9.3 Client Without Account

- Browsing marketplace:
  - Allowed without login  
- Booking:
  - Requires email + phone (guest) or account  

### 9.4 Region Restrictions

- Marketplace can be:
  - Global  
  - Region-limited (e.g., only certain countries)  

---

## 10. Non-Functional Requirements

- Mobile-first design  
- Fast loading (lazy-load media)  
- Infinite scroll feed  
- Clear separation between:
  - Marketplace browsing  
  - Salon booking flow  
- No dark patterns (no hidden fees, no surprise redirects)  

---

## 11. Positioning Summary (for Product & UX)

The marketplace must feel like:

- **TikTok for beauty services** (inspiration + discovery)  
- **Instagram profiles with booking built-in**  
- **Zero-commission, salon-friendly, non-predatory**  
- A place where **salons are the heroes**, not the platform  

Key UX messages:

- “Discover salons by style, not just by location.”  
- “Book the exact look you fall in love with.”  
- “No commissions. No client stealing. Ever.”

---

✅ **Marketplace Feature Spec Complete**

If you want, next I can:

- Turn this into **user stories**  
- Draft **product copy** for the marketplace screens  
- Or create a **combined spec** showing how Marketplace + Payments interact end-to-end.
