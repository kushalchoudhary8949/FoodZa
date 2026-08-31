# FoodConnect — Central NestJS Backend

Central production-ready NestJS backend serving all 4 panels of the FoodConnect food delivery platform:
- **Customer Panel**
- **Store Manager Panel**
- **Admin Panel**
- **Delivery Partner Panel**

---

## 🛠 Tech Stack

- **Framework**: NestJS + TypeScript
- **Database**: PostgreSQL (via Prisma ORM)
- **Authentication**: Firebase Authentication (ID Token verification)
- **Job Queue**: BullMQ + Redis (persistent manager timeout jobs)
- **Real-Time Communication**: Socket.IO Gateway
- **Push Notifications**: Firebase Cloud Messaging (FCM)
- **Payments**: Cash on Delivery (COD) + Razorpay-ready online architecture
- **Security**: Helmet, CORS, Throttler rate limiting, Role-based Access Control (RBAC)

---

## 🚀 Quick Start

### 1. Prerequisites

Ensure PostgreSQL and Redis are running on your system:
- PostgreSQL on `localhost:5432` (database: `foodconnect`)
- Redis on `localhost:6379`

### 2. Environment Setup

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Default configuration enables `SKIP_FIREBASE_AUTH=true` for easy local development testing without needing live Firebase service account keys.

### 3. Install Dependencies & Generate Prisma Client

```bash
npm install
npx prisma generate
```

### 4. Run Development Server

```bash
npm run start:dev
```

The server will start at:
- **REST API**: `http://localhost:3000/api`
- **Socket.IO**: `ws://localhost:3000`

---

## 🏛 Order State Machine Workflow

```text
CUSTOMER PLACES ORDER
        ↓
WAITING_FOR_MANAGER  ──(BullMQ 60s timeout)──>  MANAGER_TIMEOUT  ──>  WAITING_FOR_ADMIN
   │         │                                                               │
 ACCEPT    REJECT                                                        ┌───┴────┐
   │         │                                                           ↓        ↓
   ↓         ↓                                                        ACCEPT    REJECT
PREPARING  CANCELLED                                                     │        │
   │                                                                     ↓        ↓
READY_FOR_PICKUP                                                      PREPARING CANCELLED
   │
WAITING_FOR_PARTNER
   │
DELIVERY_ASSIGNED
   │
PICKED_UP
   │
OUT_FOR_DELIVERY
   │
   ├─► Verify Customer OTP  (delivery_otps.verifiedAt)
   ├─► Collect COD Payment  (payments.status = PAID)
   │
DELIVERED
```

---

## 🧪 Testing

Run Jest unit and state machine tests:

```bash
npm test
```

Run E2E tests:

```bash
npm run test:e2e
```
