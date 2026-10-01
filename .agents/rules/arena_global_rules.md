# ARENA — GLOBAL IMPLEMENTATION RULE

You are building the **Arena Sports Turf & Court Booking Platform**.

Arena is a two-sided sports venue marketplace where venue owners manage cricket turfs, badminton courts, and other sports venues, while players search, check availability, book, and pay for slots.

> [!IMPORTANT]
> **Do NOT redesign the existing application.**
> The existing Slate/Blue visual system is already approved and MUST remain unchanged.

---

### GLOBAL DESIGN SYSTEM — DO NOT MODIFY

* **Background**: `#F8FAFC`
* **Cards**: `#FFFFFF`
* **Card border**: `1px #EEF1F5`
* **Primary Action**: `#2563EB`
* **Primary hover**: `#1D4ED8`
* **Primary text**: `#FFFFFF`
* **Ghost button**: `#FFFFFF` background, `#E2E8F0` border
* **Inputs**: `#E2E8F0` border, `8px` radius
* **Card radius**: `12px`
* **Small controls**: `8px` radius
* **Pills/badges**: `full` radius (`9999px`)
* **Typography**: `Plus Jakarta Sans`
  * **Numbers**: `800` weight
  * **Headings**: `700` weight
  * **Labels/buttons**: `600` weight
  * **Body**: `400–500` weight
* **Existing shadows**: Use the existing `--shadow-sm` and `--shadow-glow` tokens. DO NOT invent new shadow styles.
* **Existing semantic colors**: Use the existing `success`, `warning`, `danger`, `neutral`, and `action-light` tokens.

---

### MOTION & ANIMATIONS

* **Every screen**: `translateY(3px)` → `0`, duration `0.25s`
* **Buttons and interactive rows**: `scale(0.98)` on press.

---

### NAVIGATION & HEADERS

* **Sub-screens**: Screens opened from sub-menus or "More" MUST have a back arrow.
* **Primary Tab Screens**: Home, Bookings, Calendar, and Earnings are primary tab screens and MUST NOT show a back arrow.

---

### RESPONSIVE DESIGN

* The interface must work seamlessly on **desktop**, **tablet**, and **mobile**.
* Do not create horizontally overflowing layouts except intentionally scrollable tables or horizontal chip/slot sections.

---

### IMPORTANT UX RULES

* **Never allow a button to appear clickable and then silently do nothing.**
* Every async operation must have:
  1. Loading state
  2. Success state
  3. Error state
  4. Retry option where appropriate
* Every list/table must have:
  1. Loading skeleton
  2. Populated state
  3. Empty state
  4. Error state

---

### DATA & ARCHITECTURE

* Do not hardcode production data.
* Use typed models/interfaces for:
  `User`, `Owner`, `Business`, `Venue`, `Sport`, `Booking`, `Slot`, `Payment`, `Payout`, `Review`, `Coupon`, `Staff`, `Notification`.
* **Backend Architecture Stack**:
  * React / React Native frontend
  * NestJS / Node.js backend
  * PostgreSQL
  * Redis for slot locking
  * Razorpay for payments
  * Firebase Authentication
  * Firebase Cloud Messaging
  * S3 / Cloudinary for media
  * Socket.io / Firebase Realtime for real-time availability.
* **Separation of Concerns**: API calls must be separated from UI components via services/API layer with typed request/response models.

---

### AUTHORIZATION & PERSISTENCE

* Owner screens must only be accessible to authenticated and authorized venue owners/staff.
* Do not expose owner-only data to unauthorized users.
* Persist all important user actions. Do not use local transient state as the permanent source of truth.

---

### REUSE PRINCIPLE

* If an existing component already performs the required function, reuse it instead of creating a visually different duplicate.
* **Goal**: SAME DESIGN + REAL FUNCTIONALITY + PRODUCTION-READY BEHAVIOR.
