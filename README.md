# GEOfence Attendance System

An enterprise-grade, QR-code + GPS geofenced employee attendance management system built with Next.js App Router, TypeScript, Tailwind CSS, and Prisma PostgreSQL, optimized specifically for **Vercel deployment**.

---

## 🌟 Key Features

- **QR Code Workplace Check-In**: Dynamic workplace QR code generation containing safe, encrypted token references without exposing sensitive employee details.
- **Server-Side Geofence Validation**: Haversine distance formula computed strictly on the server to prevent location spoofing.
- **Sub-Meter GPS Accuracy Thresholds**: Rejects check-ins with poor location accuracy or coordinates outside authorized workplace radii.
- **Strict Single Daily Check-In**: Database-level unique constraint (`employeeId_date`) for Asia/Kolkata timezone to prevent duplicate attendance.
- **Full Admin Panel**:
  - **Dashboard**: Real-time workforce metrics (Total, Present, Absent, Attendance Rate %).
  - **Employee Management**: CRUD operations, department filters, status toggle, and password resets.
  - **Department Management**: Organizational structure control with dependent record protection.
  - **Workplace Management**: Interactive Leaflet/OpenStreetMap picker for latitude, longitude, radius, and accuracy thresholds.
  - **QR Code Management**: Token generation, instant regeneration (invalidates old tokens), SVG previews, and printable poster view.
  - **Attendance Audit Logs**: Paginated audit table with filters by date, employee, workplace, department, and status.
  - **Export Reports**: Download Excel-compatible UTF-8 CSV reports for daily, monthly, or department attendance logs.
- **Employee Portal**: Mobile-optimized dashboard with read-only profile information, today's status, and personal check-in history.
- **Vercel Native Architecture**: Built with modern Server Actions, Route Handlers, and HTTP-only JWT cookie authentication (`jose` + `bcryptjs`). No persistent daemon process or local filesystem reliance.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 15 App Router
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS
- **Database ORM**: Prisma ORM 6.x (PostgreSQL provider)
- **Authentication**: JWT Cookies (`jose`) + `bcryptjs`
- **Mapping**: Leaflet / OpenStreetMap (`react-leaflet`)
- **QR Generation**: `qrcode` / `qrcode.react`
- **Validation**: Zod
- **Target Node**: 24.x

---

## 🚀 Local Development Setup

### 1. Prerequisites
- Node.js v24.x or v18+
- npm v10+
- PostgreSQL database instance (local PostgreSQL server, Docker PostgreSQL, Supabase, Neon, or Vercel Postgres)

### 2. Installation
```bash
git clone https://github.com/aravind-018/GEOfence-Attendance-System.git
cd GEOfence-Attendance-System
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Configure your `.env` parameters:
```env
# Database Connection (PostgreSQL)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/geofence_db?schema=public"

# Auth Secret (Used for JWT cookie signing)
AUTH_SECRET="super-secret-jwt-key-change-this-in-production-32bytes"

# Application Base URL
APP_URL="http://localhost:3000"

# Timezone (Asia/Kolkata default)
TZ="Asia/Kolkata"
```

### 4. Database Setup & Migrations
Generate Prisma Client:
```bash
npm run prisma:generate
```

Run PostgreSQL database migrations:
```bash
npx prisma migrate dev --name init
```

Seed initial development data (Admin, Departments, Employees, Workplace & QR Token):
```bash
npm run prisma:seed
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Development Seed Credentials

| Role | Email | Password | Details |
|---|---|---|---|
| **Admin** | `admin@geopresence.com` | `Admin@123` | Full access to `/admin` dashboard |
| **Employee** | `rahul@geopresence.com` | `Employee@123` | Access to `/employee` portal |
| **Check-In QR** | `/check-in?token=sample-qr-token-hq-tech-park-2026` | N/A | Default HQ Tech Park QR check-in page |

---

## 🌐 Vercel Deployment Instructions

1. **Push Code to GitHub**:
   Ensure all changes and migration files in `prisma/migrations/` are committed.

2. **Create New Vercel Project**:
   - Import your repository into [Vercel](https://vercel.com).
   - Select **Next.js** framework preset.

3. **Configure Environment Variables in Vercel**:
   Add the following in Vercel Project Settings → Environment Variables:
   - `DATABASE_URL`: Your production PostgreSQL connection string (e.g. Neon, Supabase, Vercel Postgres, or Prisma Postgres).
   - `AUTH_SECRET`: A secure random 32-byte secret string.
   - `APP_URL`: Your Vercel deployment URL (e.g. `https://your-project.vercel.app`).
   - `TZ`: `Asia/Kolkata`

4. **Build Script**:
   The project includes a Vercel deployment script in `package.json`:
   ```json
   "vercel-build": "prisma generate && prisma migrate deploy && next build"
   ```
   Vercel will automatically run migrations and build the optimized Next.js bundle on deploy.

---

## 📋 Production Readiness Checklist

- [x] Next.js App Router full-stack architecture with Vercel compatibility.
- [x] PostgreSQL provider configured in Prisma schema.
- [x] Prisma migration files committed under `prisma/migrations/`.
- [x] Server-side Haversine geofence calculation.
- [x] Single check-in per day per employee enforced via `@@unique([employeeId, date])`.
- [x] Read-only employee identification coming strictly from authenticated sessions.
- [x] Password hashing using `bcryptjs`.
- [x] Zero hardcoded secrets in source code.
