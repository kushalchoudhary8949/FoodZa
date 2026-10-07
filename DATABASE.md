# FoodZa — Database Architecture & Supabase Specification

## Overview

The FoodZa food delivery platform utilizes **PostgreSQL (hosted on Supabase)** as its primary relational database layer, accessed through **Prisma ORM** in a high-performance **NestJS** backend.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        FOODZA CLIENT PANELS                            │
│  Customer Web    Store Manager Panel    Admin Panel   Delivery Partner │
└─────────────────────────────────┬──────────────────────────────────────┘
                                  │ HTTPS (REST API) / WSS (Socket.IO)
                                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      CENTRAL BACKEND (NestJS)                          │
│   • Controllers & Auth Guards (RBAC)                                   │
│   • Business Services (Orders, Delivery, Stores, Menu, etc.)          │
│   • BullMQ Queue Workers (Timeout handling)                            │
│   • PrismaService with retry & keep-alive connection management        │
└──────────────────┬─────────────────────────────────┬───────────────────┘
                   │                                 │
                   ▼                                 ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│        SUPABASE POSTGRESQL           │  │        UPSTASH REDIS         │
│  • Transaction Pooler (Port 6543)    │  │  • BullMQ persistent queues  │
│  • Session Pooler / Direct (Port 5432)│ │  • Order timeout timers      │
│  • 20 Relational Models, 11 Enums    │  │  • Rate limiting cache       │
│  • B-Tree Indexes & Constraints      │  └──────────────────────────────┘
└──────────────────────────────────────┘
```

---

## 1. Supabase Connection Architecture

Supabase provides two distinct connection endpoints for PostgreSQL:

### A. Runtime Application Queries (`DATABASE_URL`)
* **Endpoint:** Transaction-mode pooler via PgBouncer
* **Port:** `6543`
* **Query Parameter:** `?pgbouncer=true`
* **Usage:** Used by the application at runtime for all queries and transactions. PgBouncer manages hundreds of ephemeral server connections efficiently without exhausting PostgreSQL backend connection limits.
* **Format:**
  ```text
  postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
  ```

### B. Schema Migrations & DDL (`DIRECT_URL`)
* **Endpoint:** Session-mode pooler / Direct connection
* **Port:** `5432`
* **Usage:** Used exclusively by Prisma CLI commands (`prisma migrate dev`, `prisma migrate deploy`, `prisma db push`) that require prepared statements and session-level locks that cannot run through transaction-mode PgBouncer.
* **Format:**
  ```text
  postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
  ```

---

## 2. Prisma Connection Management & Keep-Alive

In [backend/src/prisma/prisma.service.ts](file:///Users/kushal/FoodZa/backend/src/prisma/prisma.service.ts), connection resilience is built-in:
1. **Cold Start Retries:** The service retries database connections up to 3 times with exponential backoff on startup to absorb any cloud network latency.
2. **PgBouncer Keep-Alive:** A background timer executes `SELECT 1` every 4 minutes. This prevents idle connection drops by cloud firewalls or PgBouncer timeouts.
3. **Transaction Timeouts:** Configured with `maxWait: 15000` (ms) and `timeout: 20000` (ms) to handle multi-step order checkouts safely without hanging.

---

## 3. Database Schema: 20 Models & 11 Enums

### A. Enumerations
| Enum Name | Values | Description |
|-----------|--------|-------------|
| `UserRole` | `CUSTOMER`, `MANAGER`, `ADMIN`, `DELIVERY_PARTNER` | Role-based authorization |
| `FoodType` | `VEG`, `NON_VEG` | Dietary categorization |
| `OrderStatus` | 15 distinct statuses (see Order Lifecycle) | Strict state machine lifecycle |
| `PaymentMethod` | `CASH_ON_DELIVERY`, `ONLINE` | Payment options |
| `PaymentStatus` | `PENDING`, `PAID`, `FAILED`, `REFUNDED` | Payment lifecycle |
| `DeliveryRequestStatus` | `PENDING`, `ACCEPTED`, `REJECTED`, `EXPIRED`, `CANCELLED` | Partner dispatch status |
| `DiscountType` | `PERCENTAGE`, `FIXED_AMOUNT` | Offer discount calculation |
| `OnlineStatus` | `ONLINE`, `OFFLINE` | Delivery partner availability |
| `NotificationType` | `NEW_ORDER`, `ORDER_UPDATE`, `DELIVERY_REQUEST`, `DELIVERY_UPDATE`, `ADMIN_ALERT`, `ISSUE_MESSAGE`, `OFFER`, `SYSTEM` | Notification classification |
| `IssueCategory` | `ORDER`, `PAYMENT`, `DELIVERY`, `MENU`, `STORE`, `TECHNICAL`, `OTHER` | Support ticket categorization |
| `IssueStatus` | `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED` | Support ticket workflow |

### B. Relational Models
1. **`User` (`users`)**: Primary identity model. Links Firebase UID to profile roles and audit trails.
2. **`Customer` (`customers`)**: Customer profiles linked 1:1 with `User`.
3. **`Address` (`addresses`)**: Saved delivery locations with coordinates (Decimal 10,7).
4. **`Restaurant` (`restaurants`)**: Independent stores with opening/closing hours and location coordinates.
5. **`Manager` (`managers`)**: Store managers linked 1:1 with `User` and restricted to 1 `Restaurant`.
6. **`MenuCategory` (`menu_categories`)**: Grouping for menu items per store.
7. **`MenuItem` (`menu_items`)**: Store products with `Decimal(10,2)` pricing and availability toggles.
8. **`Order` (`orders`)**: Central transaction entity. Stores address snapshots, monetary amounts as `Decimal(10,2)`, and lifecycle timestamps.
9. **`OrderItem` (`order_items`)**: Snapshot of item names and prices at the moment of order placement.
10. **`DeliveryPartner` (`delivery_partners`)**: Independent couriers with online status, total deliveries, and earnings.
11. **`DeliveryRequest` (`delivery_requests`)**: Individual dispatch requests dispatched to delivery partners.
12. **`Payment` (`payments`)**: Payment tracking with support for COD collection verification.
13. **`DeliveryOtp` (`delivery_otps`)**: Hashed 4-6 digit OTPs for customer order handoff validation.
14. **`OrderEvent` (`order_events`)**: Immutable timeline and audit trail for every status transition.
15. **`Notification` (`notifications`)**: User inbox alerts.
16. **`DeviceToken` (`device_tokens`)**: Multi-device FCM tokens for push notifications.
17. **`Offer` (`offers`)**: Discount promo codes with usage caps and date bounds.
18. **`OfferUsage` (`offer_usages`)**: Prevents multiple redemption of single-use promo codes per customer.
19. **`Issue` (`issues`)**: Manager-to-Admin support tickets.
20. **`IssueMessage` (`issue_messages`)**: Real-time threaded messages within support tickets.
21. **`AuditLog` (`audit_logs`)**: Administrative actions log.

---

## 4. Concurrency & Transactional Safety

Food delivery involves concurrent updates across customers, restaurant managers, admins, and couriers. The following transactional safeguards are enforced:

1. **Order Acceptance Isolation:**
   When a store manager or admin accepts an order, the update executes inside an atomic Prisma `$transaction` checking that the status is still `WAITING_FOR_MANAGER` or `WAITING_FOR_ADMIN`.
2. **Delivery Partner Assignment:**
   When a delivery partner accepts an order, the operation verifies in a single transaction that the order status is still `WAITING_FOR_PARTNER` and `deliveryPartnerId` is null. Any duplicate or competing partner acceptance request receives a `ConflictException` (409) or `BadRequestException` (400).
3. **Delivery OTP Verification:**
   Delivery completion requires comparing the customer's secret OTP against `hashedOtp` in `delivery_otps` before marking `DELIVERED`.
4. **No Cascading Deletes on Critical Entities:**
   Orders, payments, items, and users enforce `onDelete: Restrict` or `onDelete: SetNull` so operational data is never inadvertently erased.

---

## 5. Prisma CLI Commands

Run these from either `/backend` or `/database`:

```bash
# Validate schema syntax
npx prisma validate

# Generate updated TypeScript Prisma Client
npx prisma generate

# Apply pending migrations to Supabase (Production)
npx prisma migrate deploy

# Open Prisma Studio to browse live data
npx prisma studio
```

---

## 6. Security & RLS Policy

- **No Direct Frontend Credentials:** Database credentials (`DATABASE_URL`, `DIRECT_URL`) and database passwords are **strictly confined to the backend environment**.
- **No Supabase Service Role Key Exposed:** Web clients communicate solely via authenticated REST / Socket.IO endpoints through the NestJS backend.
- **Role-Based Access Control (RBAC):** Every controller method is guarded by `@Roles(UserRole.ADMIN, ...)` and JWT validation.
