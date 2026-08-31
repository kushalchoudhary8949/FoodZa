# FoodConnect — Database Layer

> Production-ready Prisma + PostgreSQL database layer for the FoodConnect food delivery platform.

## Architecture

```text
Customer Panel ───────┐
Store Manager Panel ──┤
Admin Panel ──────────┼──> ONE NestJS Backend ──> Prisma ──> PostgreSQL
Delivery Partner ─────┘
```

This package contains **only the database layer** — the Prisma schema, migrations, and seed data. The NestJS backend (built later) will import `@prisma/client` from this setup.

---

## Quick Start

### Prerequisites

- **Node.js** ≥ 18
- **PostgreSQL** ≥ 14 (local or Docker)

### 1. Install Dependencies

```bash
cd database
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your PostgreSQL credentials
```

### 3. Set Up PostgreSQL

**Option A — Local PostgreSQL:**

```bash
createdb foodconnect
```

**Option B — Docker:**

```bash
docker run --name foodconnect-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=foodconnect \
  -p 5432:5432 \
  -d postgres:16-alpine
```

### 4. Run Migrations

```bash
npx prisma migrate dev --name init
```

### 5. Generate Prisma Client

```bash
npx prisma generate
```

### 6. Seed the Database

```bash
npx prisma db seed
```

### 7. Explore with Prisma Studio

```bash
npx prisma studio
```

---

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string (used by Prisma Client) | `postgresql://postgres:postgres@localhost:5432/foodconnect?schema=public` |
| `DIRECT_URL` | Direct connection URL (used by Prisma Migrate, bypasses poolers) | Same as above, or your direct PG connection |

---

## Prisma Commands

| Command | Description |
|---------|-------------|
| `npx prisma validate` | Validate the schema |
| `npx prisma generate` | Generate Prisma Client |
| `npx prisma migrate dev --name <name>` | Create and apply a new migration |
| `npx prisma migrate deploy` | Apply pending migrations (production) |
| `npx prisma migrate reset` | Reset database and re-seed |
| `npx prisma db seed` | Run seed script |
| `npx prisma studio` | Open visual database browser |
| `npx prisma format` | Format the schema file |

> ⚠️ **Do not use `npx prisma db push` in production.** Always use migrations.

---

## Database Architecture

### Models (20)

| Model | Description |
|-------|-------------|
| `User` | Central user table with Firebase UID, role, and status |
| `Customer` | Customer profile linked to User |
| `Address` | Multiple saved addresses per customer |
| `Restaurant` | Independent restaurant/store entity |
| `Manager` | Manager profile linked to User and one Restaurant |
| `MenuCategory` | Menu categories per restaurant |
| `MenuItem` | Menu items with price (Decimal), food type, availability |
| `Order` | Central order with address snapshots, money as Decimal |
| `OrderItem` | Items in an order with name/price snapshots |
| `DeliveryPartner` | Delivery worker profile (independent of restaurants) |
| `DeliveryRequest` | Per-partner delivery offer tracking |
| `Payment` | Payment records with COD collection tracking |
| `DeliveryOtp` | Hashed OTP for delivery verification |
| `OrderEvent` | Immutable audit trail of order state changes |
| `Notification` | User notifications with JSON data |
| `DeviceToken` | Push notification tokens (multi-device) |
| `Offer` | Discount offers (platform-wide or restaurant-specific) |
| `OfferUsage` | Tracks offer redemption per customer |
| `Issue` | Support tickets (Manager ↔ Admin) |
| `IssueMessage` | Chat messages within a support ticket |
| `AuditLog` | Admin action audit trail |

### Enums (11)

| Enum | Values |
|------|--------|
| `UserRole` | CUSTOMER, MANAGER, ADMIN, DELIVERY_PARTNER |
| `FoodType` | VEG, NON_VEG |
| `OrderStatus` | 15 statuses (see state machine below) |
| `PaymentMethod` | CASH_ON_DELIVERY, ONLINE |
| `PaymentStatus` | PENDING, PAID, FAILED, REFUNDED |
| `DeliveryRequestStatus` | PENDING, ACCEPTED, REJECTED, EXPIRED, CANCELLED |
| `DiscountType` | PERCENTAGE, FIXED_AMOUNT |
| `OnlineStatus` | ONLINE, OFFLINE |
| `NotificationType` | NEW_ORDER, ORDER_UPDATE, DELIVERY_REQUEST, DELIVERY_UPDATE, ADMIN_ALERT, ISSUE_MESSAGE, OFFER, SYSTEM |
| `IssueCategory` | ORDER, PAYMENT, DELIVERY, MENU, STORE, TECHNICAL, OTHER |
| `IssueStatus` | OPEN, IN_PROGRESS, RESOLVED, CLOSED |

---

## Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o| Customer : "has profile"
    User ||--o| Manager : "has profile"
    User ||--o| DeliveryPartner : "has profile"
    User ||--o{ Notification : "receives"
    User ||--o{ DeviceToken : "has devices"

    Customer ||--o{ Address : "has addresses"
    Customer ||--o{ Order : "places"
    Customer ||--o{ OfferUsage : "uses offers"

    Restaurant ||--o{ Manager : "managed by"
    Restaurant ||--o{ MenuCategory : "has categories"
    Restaurant ||--o{ MenuItem : "has items"
    Restaurant ||--o{ Order : "receives"
    Restaurant ||--o{ Offer : "has offers"
    Restaurant ||--o{ Issue : "has issues"

    MenuCategory ||--o{ MenuItem : "contains"

    Order ||--o{ OrderItem : "contains"
    Order ||--o| Payment : "has payment"
    Order ||--o{ DeliveryOtp : "has OTPs"
    Order ||--o{ DeliveryRequest : "offered to"
    Order ||--o{ OrderEvent : "has events"
    Order ||--o{ OfferUsage : "used offer"
    Order }o--o| DeliveryPartner : "assigned to"
    Order }o--o| Address : "delivered to"

    MenuItem ||--o{ OrderItem : "ordered as"
    DeliveryPartner ||--o{ DeliveryRequest : "receives"

    Offer ||--o{ OfferUsage : "tracked by"

    Issue ||--o{ IssueMessage : "has messages"
```

---

## Order State Machine

The order follows this strict lifecycle. **State transitions are enforced by the NestJS backend, not the database.**

```text
                      WAITING_FOR_MANAGER
                             │
              ┌──────────────┼──────────────┐
              │              │              │
       MANAGER_ACCEPTED  MANAGER_REJECTED  MANAGER_TIMEOUT
              │              │              │
              ▼              ▼              ▼
          PREPARING      CANCELLED    WAITING_FOR_ADMIN
              │                          │         │
              ▼                          │         │
       READY_FOR_PICKUP           ADMIN_ACCEPTED  ADMIN_REJECTED
              │                       │              │
              ▼                       │              ▼
       WAITING_FOR_PARTNER ◄──────────┘          CANCELLED
              │
              ▼
       DELIVERY_ASSIGNED
              │
              ▼
          PICKED_UP
              │
              ▼
       OUT_FOR_DELIVERY
              │
              ▼
          DELIVERED
```

### Manager Timeout Flow

```text
Customer places order
        ↓
WAITING_FOR_MANAGER (managerResponseDeadline set)
        ↓
NestJS backend checks deadline
        ↓
No response within deadline?
        ↓
MANAGER_TIMEOUT → WAITING_FOR_ADMIN
        ↓
Admin reviews and accepts or rejects
```

---

## Key Design Decisions

### Money as Decimal
All monetary values (`price`, `subtotal`, `totalAmount`, etc.) use `Decimal(10,2)` — never floating-point — to prevent rounding errors.

### Snapshots for Historical Integrity
- **Order** stores `deliveryAddress`, `hostelOrPgName`, `roomNumber` as snapshots
- **OrderItem** stores `itemNameSnapshot` and `unitPrice` as snapshots
- Changing a menu item's price or a customer's address does NOT affect past orders

### Soft Deletes
Business entities use `isActive` flags instead of hard deletes:
- `User.isActive`
- `Restaurant.isActive`
- `MenuItem.isActive`
- `Manager.isActive`
- `DeliveryPartner.isActive`
- `Offer.isActive`

### No Cascading Deletes on Critical Data
Orders, payments, audit logs, and order events use `Restrict` or `SetNull` — never `Cascade` — to prevent accidental data loss.

### Sales Calculations
Sales are **computed from orders**, not stored as manual totals. Indexes on `Order(restaurantId, createdAt)` and `Order(status, createdAt)` support efficient aggregation queries.

---

## Indexing Strategy

Indexes are placed on columns used in expected query patterns:

| Query Pattern | Index |
|---------------|-------|
| User lookup by Firebase UID | `User.firebaseUid` (unique) |
| Filter users by role | `User.role` |
| Restaurant active/open listing | `Restaurant.isActive`, `Restaurant.isOpen` |
| Menu items for a restaurant | `MenuItem(restaurantId, isAvailable, isActive)` |
| Customer order history | `Order(customerId, createdAt)` |
| Restaurant dashboard | `Order(restaurantId, createdAt)`, `Order(restaurantId, status)` |
| Active order tracking | `Order(status, createdAt)` |
| Partner delivery requests | `DeliveryRequest(deliveryPartnerId, status)` |
| Expired request cleanup | `DeliveryRequest.expiresAt` |
| Unread notifications | `Notification(userId, readAt)` |
| Order timeline | `OrderEvent(orderId, createdAt)` |
| Issue tracking | `Issue(restaurantId, status)` |
| Payment lookup | `Payment.orderId` (unique), `Payment.status` |
| Audit trail | `AuditLog(entityType, entityId)`, `AuditLog.createdAt` |

---

## Seed Data Summary

The seed creates realistic development data:

| Entity | Count | Details |
|--------|-------|---------|
| Users | 10 | 1 Admin, 3 Managers, 3 Customers, 3 Partners |
| Restaurants | 3 | KFC, Pizza Hut, Subway |
| Menu Categories | 12 | 4 per restaurant |
| Menu Items | 22 | Realistic names, prices in ₹, VEG/NON_VEG |
| Addresses | 5 | Hostel/PG addresses with coordinates |
| Orders | 13 | All 15 order statuses covered |
| Delivery Requests | 3 | Accept, reject, expire scenarios |
| Offers | 3 | Platform-wide + restaurant-specific |
| Issues | 2 | With threaded messages |
| Audit Logs | 7 | Store/manager creation, offer creation |

---

## Project Structure

```text
database/
├── prisma/
│   ├── schema.prisma          # Complete Prisma schema
│   ├── migrations/            # Auto-generated migration files
│   └── seed.ts                # Development seed data
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
├── .env.example               # Environment variable template
├── .gitignore                 # Protects .env and node_modules
└── README.md                  # This file
```

---

## License

Private — FoodConnect Platform
