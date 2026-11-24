# 🌲 Dridha Crafts — Backend Architecture & Microservices

**High-throughput, asynchronous FastAPI backend engine powering e-commerce operations, payment reconciliation, inventory reservation, and administrative dispatch.**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=flat-square&logo=python)](https://python.org/)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0-red?style=flat-square)](https://www.sqlalchemy.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-asyncpg-4169E1?style=flat-square&logo=postgresql)](https://supabase.com)
[![Pydantic](https://img.shields.io/badge/Pydantic-v2.11-E92063?style=flat-square)](https://docs.pydantic.dev/)

---

## 🚀 Overview

The **Dridha Crafts Backend** is an asynchronous Python service built with FastAPI and SQLAlchemy 2.0 (`asyncpg`). It serves as the single source of truth for product catalogs, user profiles, inventory locks, payment verification, and order lifecycle management.

* **Production Host**: Render PaaS (Dockerized Web Service)
* **API Documentation**: Interactive Swagger UI at `/docs` (or ReDoc at `/redoc`)
* **Database**: PostgreSQL 15 managed via Supabase with connection pooling

---

## 🏗 Core Architectural Modules

### 1. Database & Async Engine (`app/database.py`)
* Asynchronous connection pooling with `asyncpg`.
* Session management via `async_sessionmaker` and FastAPI dependency injection (`Depends(get_db)`).
* Auto-reconnect handling and transaction rollbacks on unexpected exceptions.

### 2. Self-Healing Schema Verification (`app/main.py`)
* On container boot, the `lifespan` handler automatically checks and applies missing tracking columns (`carrier`, `tracking_url`, `tracking_status_note`, `delivered_at`) and performance composite indexes (`idx_orders_status_created`, `idx_products_active`, etc.).
* Guarantees zero downtime migrations when deploying incremental features.

### 3. Inventory Reservation Worker (`reservation_expiry_worker`)
* High-concurrency protection against overselling limited artisanal wooden products.
* Placing an order places a 15-minute reservation hold on selected SKUs.
* A non-blocking background task runs every 5 minutes, automatically releasing abandoned reservations and restoring inventory.

### 4. Dual Payment Handlers (`app/routers/payments.py`)
* **Cashfree Payments**:
  - `POST /api/payments/create-session`: Securely generates Cashfree order token with customer details and line items.
  - `POST /api/payments/webhook`: Listens to asynchronous payment success/failure webhooks. Computes **SHA256 HMAC signature verification** against `CASHFREE_CLIENT_SECRET` and timestamp replay checks before marking orders as `CONFIRMED`.
* **WhatsApp UPI**:
  - Orders placed via direct WhatsApp UPI receive a `PAYMENT_VERIFICATION` state.
  - Admins review UPI transaction screenshots and approve with one click in the Admin Portal.

### 5. Super Admin Suite (`app/routers/admin.py`)
* Authenticated by `get_current_admin` (verifies `role == "admin"` and `is_active == True` against the database).
* Endpoints:
  - `GET /api/admin/stats`: Filterable financial telemetry (`today`, `7d`, `30d`, `all`).
  - `GET /api/admin/orders`: Paginated lifecycle view (`needs_verification`, `crafting`, `ready_to_pack`, `shipped`, `delivered`).
  - `PUT /api/admin/orders/{id}/start-crafting`: Moves order into artisan handcrafting.
  - `PUT /api/admin/orders/{id}/ready-to-pack`: Quality inspects and queues for packaging.
  - `PUT /api/admin/orders/{id}/ship`: Attaches courier partner (Delhivery, Blue Dart, etc.) and tracking AWB.
  - `DELETE /api/admin/customers/{user_id}`: Cascading customer deletion across DB and Supabase Auth.

---

## 📁 Directory Structure

```
backend/
├── app/
│   ├── middleware/
│   │   ├── auth.py          # JWT authentication & admin role validator
│   │   └── request_id.py    # Request ID injection for structured logging
│   ├── models/              # SQLAlchemy 2.0 ORM Declarative Models
│   │   ├── order.py         # Order, OrderItem, InventoryReservation
│   │   ├── payment.py       # Payment, PaymentAttempt, PaymentEvent
│   │   ├── product.py       # Product, ProductVariant
│   │   ├── review.py        # Review, Wishlist
│   │   └── user.py          # User, Address
│   ├── routers/             # REST Endpoints
│   │   ├── addresses.py     # Customer address book
│   │   ├── admin.py         # Super Admin operations & lifecycle
│   │   ├── auth.py          # Registration, login, profile, forgot-password
│   │   ├── cart.py          # Persistent cart synchronization
│   │   ├── orders.py        # Customer order creation & tracking
│   │   ├── payments.py      # Cashfree PG session creation & webhooks
│   │   ├── products.py      # Public catalog, filters, bundles
│   │   ├── reviews.py       # Verified customer reviews
│   │   └── wishlist.py      # User wishlist management
│   ├── schemas/             # Pydantic v2 validation contracts
│   ├── services/            # Cashfree PG, Email, Notification helpers
│   ├── utils/               # Rate limiter (SlowAPI), security tokens
│   ├── config.py            # Pydantic Settings reading .env
│   ├── database.py          # Async engine & session factory
│   └── main.py              # Application entrypoint & background workers
├── scripts/
│   ├── sync_products.py     # Production catalog synchronization & seeding
│   └── sync_bundles.py      # Combo bundle relationship generator
├── tests/                   # Pytest test suite
├── create_admin.py          # Administrative user provisioning CLI
├── pytest.ini               # Asyncio pytest configuration
├── requirements.txt         # Production Python dependencies
└── README.md                # Backend documentation
```

---

## 🛠 Local Setup & Installation

```bash
# 1. Create Python virtual environment
python -m venv venv

# Windows
.\venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# 2. Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# 3. Configure environment variables
cp .env.example .env
```

### Environment Configuration (`.env`)
```ini
ENVIRONMENT=development
DATABASE_URL=postgresql+asyncpg://user:password@host:5432/dbname
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-jwt-secret
CASHFREE_APP_ID=your-cashfree-app-id
CASHFREE_CLIENT_SECRET=your-cashfree-secret
CASHFREE_MODE=sandbox # or 'production'
CORS_ORIGINS=["http://localhost:3000","https://dridhacrafts.vercel.app"]
```

### Running the Server
```bash
# Start with live reloading
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

---

## 🧪 Testing & Validation

```bash
# Run bytecode compilation verification
python -m compileall app

# Execute pytest suite
pytest -v
```

---

## 📄 License

Proprietary © 2026 **Dridha Crafts**. Handcrafted in the Kashmir Valley.
