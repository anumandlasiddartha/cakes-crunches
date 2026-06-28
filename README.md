# Cakes & Crunches — Bulk Order Advance Collection & Balance Tracking System

Welcome to the **Cakes & Crunches Bulk Order Advance Collection & Balance Tracking System**, a premium full-stack enterprise dashboard built to handle corporate bulk order scheduling and automated financial collections.

---

## 🚀 Technology Stack

### Frontend Web App
- **Core UI**: React (v19) + Vite + TailwindCSS (v4)
- **State Management & Querying**: Axios + TanStack React Query (v5)
- **Component Primitives**: Lucide Icons + SweetAlert2 + React Hot Toast + React Calendar
- **Animations & Layout Transitions**: Framer Motion + GSAP
- **Data Charting Panels**: Recharts

### Backend API Server
- **Server Architecture**: Node.js + Express + REST MVC
- **Database ORM Layer**: Prisma ORM
- **Database Engine**: SQLite (Default for out-of-the-box development) / MySQL
- **Scheduling Engine**: Node-Cron (automated reminders & overdue flags)
- **Log Tracer**: Winston Logger

---

## 💼 Core Business Rules Implemented

1. **Advance Deposit Requirement**
   - No custom bulk order can enter the `in_production` stage without collecting a minimum of **30% advance deposit** based on the grand total.
2. **Order Dispatch Settlement Rule**
   - Active orders must be fully paid (`balanceAmount` equals `0`) before marking them as `completed` or releasing them for dispatch.
3. **Automated Reminders Schedule**
   - Daily cron triggers parse upcoming events and dispatch system notifications and logs 3 days prior to the event date.
4. **Credit Wallet & Transaction Engine**
   - Pre-funded client wallets with overdraft protection. Credit and debit transactions write audit entries into the payment ledger.
5. **Double-Entry Bookkeeping Ledger**
   - All advance payments, balance collections, and wallet movements record credit/debit logs keeping track of a global running book balance.

---

## 🔧 Local Development Quickstart

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### Installation

1. **Backend Server Setup**
   ```bash
   cd server
   npm install
   npx prisma db push
   npm run prisma:seed
   npm run start
   ```

2. **Frontend Client Setup**
   ```bash
   cd ../client
   npm install --legacy-peer-deps
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:5173/`
4. Use the following demo credentials:
   - **Admin Portal**: `admin@cakesandcrunches.com` / `admin123`
   - **Manager Portal**: `manager@cakesandcrunches.com` / `admin123`
   - **Staff Portal**: `staff@cakesandcrunches.com` / `admin123`

---

## 🐳 Docker Deployment

To launch the complete full-stack application inside isolated containers, simply run:

```bash
docker-compose up --build
```
- Frontend will be exposed at `http://localhost:5173`
- Backend API Gateway will be exposed at `http://localhost:5000`
