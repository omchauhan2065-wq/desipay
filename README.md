# 🏦 DesiPay

**Cyber-Secure Payment Gateway & Digital Khata Platform**

[![CI Pipeline](https://github.com/omchauhan2065-wq/desipay/actions/workflows/ci.yml/badge.svg)](https://github.com/omchauhan2065-wq/desipay/actions/workflows/ci.yml)
[![Live Uptime Monitor](https://github.com/omchauhan2065-wq/desipay/actions/workflows/uptime-monitor.yml/badge.svg)](https://github.com/omchauhan2065-wq/desipay/actions/workflows/uptime-monitor.yml)

> A high-performance fintech platform with B2C/B2B interfaces, digital Khata Book (Udhar/Nagdi), Razorpay payment flows, barcode inventory management, multi-channel notifications, and a minimalistic dark-mode dashboard.

**Developed by:** Om Chauhan  
**Mentored by:** Antigravity AI

---

## 🌐 100% Free Cloud Deployment
Deploy DesiPay for free with zero credit card required using **Neon** (PostgreSQL), **MongoDB Atlas**, **Upstash** (Redis), and **Render**:
👉 **[Read the Complete Free Cloud Setup Guide](docs/FREE_CLOUD_SETUP.md)**

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- OpenSSL (for JWT key generation)

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/omchauhan2065-wq/desipay.git
cd desipay

# 2. Install dependencies
npm install

# 3. Generate JWT RS256 keys (4096-bit RSA)
npm run keys:generate

# 4. Start infrastructure (PostgreSQL, MongoDB, Redis, MinIO)
npm run docker:up

# 5. Copy and configure environment
cp .env.example .env

# 6. Run database migrations
npm run prisma:migrate

# 7. Start development server
npm run dev
```

### Access Points
- **API Server:** http://localhost:3000
- **API Docs (Swagger):** http://localhost:3000/api-docs
- **Health Check:** http://localhost:3000/health
- **Prisma Studio:** `npm run prisma:studio`
- **MinIO Console:** http://localhost:9001

---

## 📁 Project Structure

```
desipay/
├── src/
│   ├── config/          # Environment, database, Redis, logger, security
│   ├── middleware/       # Auth (JWT), RBAC, rate limiter, security, audit
│   ├── modules/         # Feature modules (auth, user, khata, inventory, etc.)
│   ├── shared/          # Types, utils, errors, constants
│   ├── workers/         # Background job processors
│   ├── app.ts           # Express app configuration
│   └── server.ts        # Server entry point
├── prisma/              # PostgreSQL schema & migrations
├── docker/              # Docker Compose for dev infrastructure
├── .github/workflows/   # CI/CD pipelines
├── tests/               # Unit, integration, security tests
└── docs/                # API docs, security policy, deployment guide
```

---

## 🛡️ Security Features

- **JWT RS256** — Asymmetric key signing (4096-bit RSA)
- **HttpOnly Cookies** — XSS-proof token storage
- **Refresh Token Rotation** — Automatic theft detection
- **bcrypt** — Password hashing (cost factor 12)
- **MFA** — TOTP + SMS OTP (coming Phase 1)
- **Rate Limiting** — Tiered limits per endpoint type
- **Helmet** — HTTP security headers + CSP
- **RBAC** — Role-based access control with hierarchy
- **Audit Logging** — Immutable trail for all operations
- **Input Validation** — Zod schemas on all endpoints
- **Account Lockout** — 5 failed attempts → 15 min lock

---

## 🧪 Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Build for production |
| `npm start` | Run production build |
| `npm test` | Run tests |
| `npm run lint` | Run ESLint |
| `npm run keys:generate` | Generate JWT RSA keys |
| `npm run docker:up` | Start Docker services |
| `npm run docker:down` | Stop Docker services |
| `npm run prisma:migrate` | Run database migrations |
| `npm run prisma:studio` | Open Prisma Studio |

---

## 📄 License

Proprietary — All rights reserved. © 2026 Om Chauhan
