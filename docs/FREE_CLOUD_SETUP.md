# 🌐 DesiPay — 100% Free Cloud Deployment & Setup Guide

This guide walks you through deploying **DesiPay** completely free of charge with **zero credit card requirements**, enterprise-grade security, and automated GitHub live uptime monitoring.

---

## 🏗️ 100% Free Cloud Stack Overview

| Service | Provider | Free Tier Specification | Cost |
|---|---|---|---|
| **Primary Database (Financials)** | [Neon.tech](https://neon.tech) | 0.5 GiB PostgreSQL 16, serverless autoscaling, built-in PgBouncer pooling | **$0 / month** |
| **Product Catalog DB** | [MongoDB Atlas](https://www.mongodb.com/atlas) | 512 MB M0 Cluster, 3-node replica set, TLS encryption | **$0 / month** |
| **Session Cache & Rate Limiting** | [Upstash](https://upstash.com) | 10,000 commands/day, TLS (`rediss://`), serverless Redis | **$0 / month** |
| **Backend API Gateway** | [Render](https://render.com) | 750 free instance hours/month, automated SSL, custom domain | **$0 / month** |
| **Frontend Minimalist Dashboard** | [Render Static](https://render.com) / [Vercel](https://vercel.com) | Global edge CDN, unlimited bandwidth, instant git deploy | **$0 / month** |
| **Live Uptime & Health Monitor** | **GitHub Actions** | Cron probe every 15 min, automated failure alerts, status badge | **$0 / month** |

---

## ⚡ Step 1: Set Up Free PostgreSQL on Neon (2 Minutes)

1. Go to **[https://neon.tech](https://neon.tech)** and sign up using your GitHub account (no credit card needed).
2. Click **Create Project**:
   - **Project Name:** `desipay-production`
   - **Database Name:** `neondb`
   - **Region:** `Asia Pacific (Singapore)` *(recommended for fastest response time to India)*
3. On the project dashboard, copy the **Pooled connection string**:
   ```
   postgresql://desipay_owner:your_neon_password@ep-fancy-pond.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```
4. **Push your database tables instantly from your Mac:**
   ```bash
   npm run db:cloud-push "postgresql://desipay_owner:your_neon_password@ep-fancy-pond.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
   ```
   *This automatically provisions all 12 DesiPay tables (users, payments, khata_entries, inventory_logs, audit_logs, etc.) with exact indexes.*

---

## 🍃 Step 2: Set Up Free MongoDB Atlas (3 Minutes)

1. Go to **[https://cloud.mongodb.com](https://cloud.mongodb.com)** and sign up.
2. Select **M0 Free** (Shared) cluster.
3. Select **AWS** in **Asia Pacific (Singapore / Mumbai)**.
4. Click **Create Cluster**.
5. Set up **Database Access**:
   - Go to **Database Access** > **Add New Database User**.
   - Username: `desipay_user`
   - Password: Click *Autogenerate Secure Password* and copy it.
   - Built-in Role: *Read and write to any database*.
6. Set up **Network Access**:
   - Go to **Network Access** > **Add IP Address**.
   - Select **Allow Access From Anywhere** (`0.0.0.0/0`) so cloud hosts can connect.
7. Click **Connect** > **Drivers (Node.js)** and copy your connection string:
   ```
   mongodb+srv://desipay_user:<password>@cluster0.xxxxx.mongodb.net/desipay_catalog?retryWrites=true&w=majority
   ```

---

## ⚡ Step 3: Set Up Free Redis on Upstash (1 Minute)

1. Go to **[https://upstash.com](https://upstash.com)** and log in with GitHub.
2. Click **Create Database**:
   - **Name:** `desipay-redis`
   - **Type:** Regional (Free)
   - **Region:** `ap-southeast-1` (Singapore)
   - **TLS:** Enabled ✅
3. Under the **Connect** tab, select **ioredis** or copy the **UPSTASH_REDIS_REST_URL** / `rediss://...` string:
   ```
   rediss://default:your_upstash_password@ap1-fancy-12345.upstash.io:6379
   ```

---

## 🔐 Step 4: Generate Base64 Keys for Cloud Environment

To securely run DesiPay in serverless or cloud container environments without committing RSA private keys to Git:

```bash
npm run keys:cloud
```

This will output two strings:
- `JWT_PRIVATE_KEY_BASE64`
- `JWT_PUBLIC_KEY_BASE64`

Save these alongside your database URLs.

---

## 🚀 Step 5: Push Code to GitHub

1. Create a new repository on **[https://github.com/new](https://github.com/new)** (e.g. `desipay`).
2. Run the following commands in your terminal:
   ```bash
   git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/desipay.git
   git branch -M main
   git push -u origin main
   ```

### Set Up GitHub Repository Secrets (Settings > Secrets and variables > Actions):

| Secret Name | Description / Value |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL pooled connection string |
| `MONGODB_URI` | MongoDB Atlas SRV connection string |
| `REDIS_URL` | Upstash Redis connection string (`rediss://...`) |
| `SESSION_SECRET` | 32+ character random string (e.g., `openssl rand -hex 32`) |
| `JWT_PRIVATE_KEY_BASE64` | Output from `npm run keys:cloud` |
| `JWT_PUBLIC_KEY_BASE64` | Output from `npm run keys:cloud` |
| `PRODUCTION_URL` | Your live Render / Koyeb URL (e.g. `https://desipay-api.onrender.com`) |

---

## ☁️ Step 6: Deploy to Render (1-Click via render.yaml)

1. Go to **[https://render.com](https://render.com)** and log in with GitHub.
2. Click **New +** > **Blueprint**.
3. Connect your `desipay` repository.
4. Render will read the [`render.yaml`](../render.yaml) file and automatically set up:
   - `desipay-api` (Backend Web Service)
   - `desipay-dashboard` (Frontend Static Site)
5. Fill in the required environment variables (`DATABASE_URL`, `MONGODB_URI`, `REDIS_URL`, `JWT_*_KEY_BASE64`).
6. Click **Apply**.
7. Once deployed, copy your API URL (e.g., `https://desipay-api.onrender.com`) and set it as `PRODUCTION_URL` in your GitHub Repository Variables.

---

## 📡 Step 7: Live Monitoring & Status Badges

Once deployed, GitHub Actions automatically monitors your live application every 15 minutes:

- **Workflow:** [`.github/workflows/uptime-monitor.yml`](../.github/workflows/uptime-monitor.yml)
- **What it monitors:**
  - `GET /health` — Liveness & overall latency.
  - `GET /ready` — Sub-system diagnostics: PostgreSQL, MongoDB Atlas, Upstash Redis.
- If any database disconnects or response time degrades, GitHub Actions triggers an automatic alert.
- View real-time status anytime under the **Actions** tab of your repository.
