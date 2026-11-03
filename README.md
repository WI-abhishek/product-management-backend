# Product Management System - Backend API

A robust RESTful API service built for an enterprise Product Management ERP system. Handles user authentication, product catalog management, category organization, inventory tracking with alert thresholds, Cloudinary asset uploads, and real-time dashboard analytics.

---

## Default Admin Credentials

For testing and administrative access:

- **Email:** `admin@gmail.com`
- **Password:** `123456`

---

## Tech Stack

- **Runtime:** Node.js (ES Modules, `"type": "module"`)
- **Framework:** Express 5
- **Database:** PostgreSQL (Neon Serverless)
- **ORM:** Prisma Client 5.22
- **Authentication:** JWT (`jsonwebtoken`) + `bcryptjs` password hashing
- **Input Validation:** Joi schema validation
- **File Uploads:** Multer (memory buffer) + Cloudinary SDK
- **Security Middlewares:** Helmet, Express Rate Limit, Express Sanitizer, CORS

---

## Core Features

- **JWT Auth & Session Rotation:** Access tokens with refresh token rotation (`x-refresh-token` header) for continuous sessions without unexpected logouts.
- **Product Catalog Management:** Server-side pagination, multi-field search, column-level filters, sorting, and inline product status updates.
- **Category Organization:** Complete CRUD operations with unique constraints and dropdown select feeds.
- **Image Management:** Direct image uploads to Cloudinary with automatic cleanup of replaced/deleted assets.
- **Inventory Tracking:** Real-time stock counts and low-stock replenishment alert thresholds.
- **Dashboard Analytics:** High-speed aggregated metrics including total counts, status distribution, top 4 categories by volume, and critical inventory alerts.

---

## Project Structure

```text
backend/
├── app.js                         # Application entry point & server initialization
├── prisma/
│   └── schema.prisma              # Prisma schema models & relations
└── src/
    ├── configs/                   # Database, CORS & Express configurations
    └── app/
        ├── controllers/           # Request handlers & business logic
        ├── routes/                # API route definitions
        ├── middlewares/           # JWT auth, rate limiter & file upload middlewares
        ├── sanitize/              # Joi request payload validation schemas
        └── utils/                 # Cloudinary helper, token generator, common utilities
```

---

## Environment Variables

Create a `.env` file in the `backend/` root directory with the following variables:

```env
PORT=5000
DATABASE_URL="postgresql://<user>:<password>@<host>/<database>?sslmode=require&connect_timeout=10&pool_timeout=10"
DIRECT_URL="postgresql://<user>:<password>@<host>/<database>?sslmode=require"

JWT_SECRET="your_jwt_access_secret_key"
JWT_REFRESH_SECRET="your_jwt_refresh_secret_key"

CLOUDINARY_CLOUD_NAME="your_cloudinary_cloud_name"
CLOUDINARY_API_KEY="your_cloudinary_api_key"
CLOUDINARY_API_SECRET="your_cloudinary_api_secret"

FRONTEND_URL="http://localhost:5173,https://your-frontend.vercel.app"
```

---

## API Endpoints Overview

All routes are versioned under `/api/v1/`:

### Authentication (`/api/v1/Auth`)
- `POST /Register` - Register a new user account
- `POST /Login` - Authenticate credentials and receive JWT tokens
- `POST /RefreshToken` - Obtain a fresh access token using the refresh token header
- `POST /Logout` - Invalidate active session and clear refresh token

### Category Management (`/api/v1/Category`)
- `POST /List` - Server-side paginated category list with search & sorting
- `POST /Dropdown` - Lightweight category ID and name feed for select dropdowns
- `POST /Add` - Create a new unique category
- `PUT /Update` - Update category details
- `DELETE /Delete` - Remove category (restricted if linked to products)

### Product Catalog (`/api/v1/Product`)
- `POST /List` - Paginated product table with search, multi-field filters & sorting
- `GET /Detail/:productId` - Retrieve complete product details
- `POST /Add` - Create product with optional Cloudinary image upload (`multipart/form-data`)
- `PUT /Update` - Update product details and replace image
- `PUT /Status` - Inline update for product status (`ACTIVE`, `INACTIVE`, `OUT_OF_STOCK`, `DISCONTINUED`)
- `DELETE /Delete` - Delete product and delete associated Cloudinary image

### Dashboard Analytics (`/api/v1/Dashboard`)
- `GET /Stats` - Aggregated metrics (KPI counts, top 4 categories, low-stock replenishment alerts)

---

## Getting Started

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

4. **Sync Database Schema:**
   ```bash
   npx prisma db push
   ```

5. **Start the server:**
   - Development mode (with file watcher):
     ```bash
     npm run dev
     ```
   - Production mode:
     ```bash
     npm start
     ```
   The backend will be running at `http://localhost:5000`.

