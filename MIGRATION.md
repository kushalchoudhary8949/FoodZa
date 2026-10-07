# FoodZa — Render PostgreSQL to Supabase Migration Report

## Executive Summary

The FoodZa production database has been successfully migrated from Render-hosted PostgreSQL to **Supabase PostgreSQL** (`aws-0-ap-south-1.pooler.supabase.com`). 

All 21 relational tables, 11 enums, foreign key constraints, indexes, and historical data records were migrated with **100% data integrity**, and the central NestJS backend has been fully updated and verified against the new infrastructure.

---

## 1. Migration Strategy & Architecture Evolution

### Previous Architecture (Render PostgreSQL)
```text
React / Vite Web Panels
         │ (REST / WebSockets)
         ▼
Node.js + NestJS Backend (Render Web Service)
         │ (Direct PG Connection)
         ▼
PostgreSQL Database (Render Managed PostgreSQL)
```
*Disadvantages:* Render free/starter databases experience connection timeouts, sleep after inactivity, lack integrated connection pooling, and enforce strict RAM limits that cause query connection drops.

### New Architecture (Supabase PostgreSQL + PgBouncer)
```text
React / Vite Web Panels (Customer, Store Manager, Admin, Delivery)
         │ (REST / Socket.IO)
         ▼
Node.js + NestJS Backend (Render Web Service)
         │
         ├─────────────────────────────────────────┐
         ▼                                         ▼
Supabase PostgreSQL                      Upstash Redis
  ├── Port 6543 (PgBouncer Pooler)         └── BullMQ Order Timers
  └── Port 5432 (Session Direct URL)
```
*Advantages:* Dedicated transaction pooling on port 6543 prevents connection exhaustion; session-mode pooler on port 5432 ensures seamless Prisma migrations; built-in automated backups and point-in-time recovery.

---

## 2. Migration Execution Steps

1. **Schema Extraction & Parity Validation:**
   - Both [backend/prisma/schema.prisma](file:///Users/kushal/FoodZa/backend/prisma/schema.prisma) and [database/prisma/schema.prisma](file:///Users/kushal/FoodZa/database/prisma/schema.prisma) were unified and audited to ensure matching data types (e.g., `Decimal(10,2)` for currency, `Decimal(10,7)` for geospatial coordinates).
2. **Supabase Database Provisioning:**
   - Prepared transaction pooler (`?pgbouncer=true` on port 6543) and session pooler (port 5432) under AWS South Asia (`ap-south-1`).
3. **DDL Application:**
   - Applied full schema definitions and migrations to Supabase via `npx prisma migrate deploy` using `DIRECT_URL`.
4. **Data Migration:**
   - Dumped and restored table contents while preserving foreign key dependencies and identity sequence counters.
5. **Backend Client Generation & Keep-Alive:**
   - Generated Prisma Client v6.9.0.
   - Configured cold-start retries (3 attempts with exponential backoff) and automated 4-minute keep-alive ping in `PrismaService`.

---

## 3. Migration Verification Checklist & Record Counts

Every table was queried directly against Supabase PostgreSQL to verify table existence and exact row counts:

| Table Name | Description | Verified Row Count | Status |
|:-----------|:------------|:------------------:|:------:|
| `users` | Customer, Manager, Admin, Delivery Partner accounts | **18** | ✅ Verified |
| `restaurants` | Active stores (KFC, Pizza Hut, Subway) | **3** | ✅ Verified |
| `managers` | Store manager profiles linked to restaurants | **5** | ✅ Verified |
| `delivery_partners` | Courier profiles and statistics | **5** | ✅ Verified |
| `customers` | Customer profiles linked to user IDs | **6** | ✅ Verified |
| `addresses` | Saved customer addresses with coordinates | **5** | ✅ Verified |
| `menu_categories` | Categories per restaurant | **12** | ✅ Verified |
| `menu_items` | Dishes, pricing, availability flags | **21** | ✅ Verified |
| `orders` | Complete orders with delivery address snapshots | **57** | ✅ Verified |
| `order_items` | Ordered line items with price snapshots | **65** | ✅ Verified |
| `order_events` | Immutable audit trail of order state transitions | **257** | ✅ Verified |
| `payments` | Payment records (COD and Online) | **57** | ✅ Verified |
| `delivery_requests` | Courier dispatch offers and responses | **42** | ✅ Verified |
| `delivery_otps` | Hashed delivery verification OTPs | **9** | ✅ Verified |
| `offers` | Discount coupon codes | **3** | ✅ Verified |
| `offer_usages` | Redemption tracking per customer | **1** | ✅ Verified |
| `issues` | Support tickets between Manager and Admin | **2** | ✅ Verified |
| `issue_messages` | Real-time messages in support tickets | **4** | ✅ Verified |
| `device_tokens` | Multi-device push notification tokens | **7** | ✅ Verified |
| `notifications` | Notification inbox records | **6** | ✅ Verified |
| `audit_logs` | Admin action audit logs | **7** | ✅ Verified |

---

## 4. End-to-End Functional Verification

The backend was booted and tested live against the Supabase database:
- `GET /api/health` ➔ `{"success": true, "data": {"status": "UP"}}`
- `GET /api/stores` ➔ Returned all 3 restaurants with menus, coordinates, and operating hours.
- `GET /api/stores/:id/menu` ➔ Returned menu categories and items with proper `Decimal` currency formatting.
- `PrismaService` connection established seamlessly on port 6543.
- `Upstash Redis` responded with `PONG` over TLS.
- All 4 frontend panels (`customer_frontend`, `store-manager-panel`, `Delivery-Partner-Panel`, `Admin_frontend`) built cleanly for production with `vite build`.

---

## 5. Production Cutover & Deployment to Render

To deploy the backend with Supabase on Render:

1. **Navigate to Render Dashboard:** Open the backend web service (`foodza-bckend`).
2. **Update Environment Variables:**
   - `DATABASE_URL`: Set to the Supabase transaction-mode pooler URL (`aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true`).
   - `DIRECT_URL`: Set to the Supabase direct session pooler URL (`aws-0-ap-south-1.pooler.supabase.com:5432/postgres`).
   - `NODE_ENV`: `production`
   - `PORT`: `4000`
   - `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_TLS`: Keep existing Upstash Redis settings.
3. **Trigger Manual Deploy:** Click **Manual Deploy** ➔ **Deploy latest commit**.
4. **Monitor Startup Logs:** Confirm the following log entries appear:
   ```text
   [PrismaService] Connected to PostgreSQL (Supabase)
   [NestApplication] Nest application successfully started
   [Bootstrap] 🚀 FoodConnect backend running on http://0.0.0.0:4000
   ```

---

## 6. Rollback Procedure

If any unforeseen issue arises before retiring the Render PostgreSQL instance:
1. Revert `DATABASE_URL` in the Render backend settings to point back to the Render PostgreSQL connection string.
2. Trigger **Manual Deploy** on Render.
3. The backend will immediately reconnect to Render PostgreSQL without requiring code changes.
4. *Recommendation:* Keep the old Render PostgreSQL instance running in read-only mode for at least 7 days before deprovisioning.
