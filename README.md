# FoodZa — Food Delivery Platform

FoodZa is an end-to-end multi-role food delivery platform engineered for hostel campuses, student housing, and residential clusters.

The platform provides dedicated interfaces for all four key operational roles: **Customer**, **Store Manager**, **Admin**, and **Delivery Partner**, backed by a unified **NestJS** backend, **Supabase PostgreSQL** database, and **Upstash Redis** job queues.

---

## 🏛 System Architecture

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        FOODZA CLIENT PANELS                            │
│  Customer Web    Store Manager Panel    Admin Panel   Delivery Partner │
└─────────────────────────────────┬──────────────────────────────────────┘
                                  │ HTTPS (REST API) / WSS (Socket.IO)
                                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      CENTRAL BACKEND (NestJS)                          │
│   • Controllers & Auth Guards (RBAC: Customer, Manager, Admin, DP)     │
│   • Core Services (Orders, Delivery, Stores, Menu, Payments, Issues)   │
│   • BullMQ Queue Workers (Manager Timeout & Notification Scheduler)    │
│   • PrismaService (PgBouncer connection pooler & keep-alive ping)     │
└──────────────────┬─────────────────────────────────┬───────────────────┘
                   │                                 │
                   ▼                                 ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│        SUPABASE POSTGRESQL           │  │        UPSTASH REDIS         │
│  • Transaction Pooler (Port 6543)    │  │  • BullMQ persistent queues  │
│  • Session Pooler / Direct (Port 5432)│ │  • Order timeout timers      │
│  • 20 Relational Models, 11 Enums    │  │  • Rate limiting cache       │
│  • Strict transactional safety       │  └──────────────────────────────┘
└──────────────────────────────────────┘
```

---

## 📂 Repository Structure

```text
FoodZa/
├── backend/                   # Central NestJS Backend (REST API + Socket.IO)
│   ├── src/                   # Controllers, services, modules, guards, decorators
│   ├── prisma/                # Prisma schema & client definition
│   └── package.json           # Backend dependencies
├── customer_frontend/         # Customer Ordering Web App (React + Vite + TS)
├── store-manager-panel/       # Restaurant Order & Menu Management (React + Vite + TS)
├── Admin_frontend/            # Superadmin Operations Dashboard (React + Vite + TS)
├── Delivery-Partner-Panel/    # Courier Dispatch & Delivery App (React + Vite + TS)
├── database/                  # Shared database schema, migrations & seed scripts
├── DATABASE.md                # In-depth database & Supabase architecture guide
├── MIGRATION.md               # Render PostgreSQL to Supabase migration record
├── .env.example               # Environment variables template
└── README.md                  # This file
```

---

## 🛠 Tech Stack

- **Backend:** Node.js, NestJS, TypeScript, Prisma ORM, Socket.IO, BullMQ
- **Database:** PostgreSQL (hosted on Supabase with PgBouncer connection pooling)
- **Cache & Queues:** Upstash Redis (TLS enabled)
- **Frontend Panels:** React 18, TypeScript, Vite, Tailwind CSS / Vanilla CSS, Lucide Icons
- **Authentication:** Role-Based Access Control (RBAC) with Firebase Auth & Dev Mock Mode
- **Deployment:** Render (Web Services & Static Sites) + Supabase (Database)

---

## 🚀 Local Quickstart

### 1. Prerequisites
- Node.js ≥ 18
- Access to Supabase PostgreSQL or local PostgreSQL
- Redis instance (local or Upstash)

### 2. Configure Environment Variables
Copy `.env.example` to `backend/.env`:
```bash
cp .env.example backend/.env
# Fill in your Supabase connection strings and Redis credentials
```

### 3. Backend Setup
```bash
cd backend
npm install
npx prisma generate
npm run build
npm run start:dev
```
The backend starts on `http://localhost:4000` (`http://localhost:4000/api`).

### 4. Running the Frontend Panels
In separate terminal windows, start the respective panel:

- **Customer Panel:**
  ```bash
  cd customer_frontend && npm install && npm run dev
  ```
- **Store Manager Panel:**
  ```bash
  cd store-manager-panel && npm install && npm run dev
  ```
- **Admin Panel:**
  ```bash
  cd Admin_frontend && npm install && npm run dev
  ```
- **Delivery Partner Panel:**
  ```bash
  cd Delivery-Partner-Panel && npm install && npm run dev
  ```

---

## 🔄 Order Lifecycle State Machine

```text
CUSTOMER PLACES ORDER
        ↓
WAITING_FOR_MANAGER ──(BullMQ 60s timeout)──> MANAGER_TIMEOUT ──> WAITING_FOR_ADMIN
   │         │                                                           │
 ACCEPT    REJECT                                                    ┌───┴────┐
   │         │                                                       ↓        ↓
   ↓         ↓                                                    ACCEPT    REJECT
PREPARING  CANCELLED                                                 │        │
   │                                                                 ↓        ↓
READY_FOR_PICKUP                                                  PREPARING CANCELLED
   │
WAITING_FOR_PARTNER
   │
DELIVERY_ASSIGNED
   │
PICKED_UP
   │
OUT_FOR_DELIVERY
   │
   ├─► Customer OTP Verification (delivery_otps)
   ├─► COD / Online Payment Confirmation (payments)
   │
DELIVERED
```

---

## 📚 Documentation Reference

- **[DATABASE.md](file:///Users/kushal/FoodZa/DATABASE.md):** Complete Supabase database schema, PgBouncer pooler setup, concurrency guarantees, and Prisma usage.
- **[MIGRATION.md](file:///Users/kushal/FoodZa/MIGRATION.md):** Migration details, verified record counts (18 users, 57 orders, 21 items, etc.), and rollback instructions.
- **[.env.example](file:///Users/kushal/FoodZa/.env.example):** Environment configuration template for all services.
