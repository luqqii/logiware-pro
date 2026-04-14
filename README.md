# LogiWare Pro

**Smart, seamless logistics & warehouse operations — visibility, automation, scale.**

A next-generation B2B SaaS logistics and warehouse management platform built for mid-to-large enterprises, 3PL providers, and supply chain operators.

## Features

### Core Platform
- **Multi-tenant Architecture** — Full org data isolation with RBAC (admin, manager, user)
- **Real-time Dashboard** — KPI widgets, order pipeline, warehouse capacity, alerts
- **Warehouse Management** — Create/manage warehouses with capacity tracking
- **Inventory Management** — Full CRUD, low-stock alerts, cycle counts, search/filter
- **Order Management** — Create orders, status pipeline (pending → picked → packed → shipped → delivered)
- **Shipment Tracking** — Multi-carrier support (FedEx, UPS, USPS, DHL), tracking numbers, ETAs
- **Route Optimization** — AI-powered nearest-neighbor route planning with vehicle assignment
- **AI Forecasting** — Demand prediction with confidence intervals, shortage alerts, model training
- **Workflow Automation** — No-code rule engine with triggers and actions (alerts, status updates, webhooks)
- **Analytics & Reports** — Order trends, inventory metrics, warehouse performance charts
- **Mobile UI** — Responsive mobile dashboard for warehouse workers
- **Real-time Updates** — WebSocket-based live notifications and status updates

### Security & Compliance
- JWT authentication with bcrypt password hashing
- Role-based access control (RBAC)
- Organization-level data partitioning
- Audit logging for all operations
- GDPR/CCPA ready

### Tech Stack
| Layer | Technology |
|---|---|
| Frontend | React 18 (Vite), Tailwind CSS, Recharts, Lucide Icons |
| Backend | Node.js, Express, JWT, Socket.IO |
| Database | PostgreSQL (relational), MongoDB (events/logs) |
| Cache/Queue | Redis (caching, Bull queues) |
| AI Service | Python, FastAPI (forecasting, route optimization) |
| Deployment | Docker Compose (dev), Vercel + AWS (prod) |

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+ (for AI service)
- Docker & Docker Compose
- PostgreSQL, MongoDB, Redis (or use Docker Compose)

### 1. Install Dependencies

```bash
# Install root + server + client dependencies
cd logiware-pro
npm run install:all
```

### 2. Start Infrastructure (Docker Compose)

```bash
docker-compose up -d
```

This starts PostgreSQL, MongoDB, and Redis.

### 3. Configure Environment

```bash
# Server .env (already configured with defaults)
cd server
# Edit .env if needed (defaults work with Docker Compose)
```

### 4. Run Database Migrations

```bash
cd server
npm run db:migrate
npm run db:seed
```

### 5. Start Services

```bash
# Terminal 1: Backend API
cd server
npm run dev

# Terminal 2: Frontend
cd client
npm run dev

# Terminal 3: AI Service (optional)
cd ai-service
pip install -r requirements.txt
python main.py
```

### 6. Open the App

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000
- **AI Service:** http://localhost:8000

### Demo Credentials
- **Email:** admin@logiware.com
- **Password:** admin123

## Project Structure

```
logiware-pro/
├── server/                 # Node.js/Express backend
│   ├── src/
│   │   ├── config/         # Configuration
│   │   ├── database/       # DB clients + migrations
│   │   ├── controllers/    # Request handlers
│   │   ├── routes/         # API route definitions
│   │   ├── middleware/     # Auth, RBAC, audit
│   │   ├── services/       # Business logic
│   │   ├── sockets/        # WebSocket handlers
│   │   ├── workers/        # Bull queue processors
│   │   └── index.js        # Entry point
│   └── .env
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Layout, shared components
│   │   ├── pages/          # Page components
│   │   ├── context/        # Auth context
│   │   ├── services/       # API + socket services
│   │   └── index.css       # Tailwind + custom styles
│   └── vite.config.js
├── ai-service/             # Python AI service
│   ├── main.py             # FastAPI app
│   └── requirements.txt
├── docker-compose.yml      # Infrastructure
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/auth/signup | Register org + user |
| POST | /api/auth/login | User login |
| GET | /api/warehouses | List warehouses |
| POST | /api/warehouses | Create warehouse |
| GET | /api/inventory | List inventory |
| POST | /api/inventory | Create inventory item |
| PATCH | /api/inventory/:id/quantity | Update stock quantity |
| GET | /api/orders | List orders |
| POST | /api/orders | Create order |
| PATCH | /api/orders/:id/pick | Pick order |
| PATCH | /api/orders/:id/pack | Pack order |
| PATCH | /api/orders/:id/ship | Ship order |
| GET | /api/shipments | List shipments |
| POST | /api/shipments | Create shipment |
| POST | /api/routes/optimize | Optimize delivery route |
| POST | /api/forecast/train | Train forecast model |
| GET | /api/forecast | Get forecast data |
| GET | /api/automation | List automation rules |
| POST | /api/automation | Create automation rule |
| GET | /api/analytics/dashboard | Get dashboard KPIs |

## Design System

Built with a ShipStation-inspired design language:

- **Primary CTA:** `#00D26E` (Bright Green) — all primary actions
- **Navy:** `#120B3C` — headings, sidebar, dark text
- **Accent Purple:** `#645BFF` — links, secondary accents
- **Backgrounds:** White / Light Green `#F0FAF2` / Light Purple `#F0EEFF` alternating sections
- **Buttons:** Pill-shaped (`border-radius: 999px`), flat, no shadows
- **Cards:** 12px radius, subtle shadow, hover elevation
- **Typography:** Inter font, bold headings, clean body text

## Scaling for Production

1. **Horizontal Scaling** — Stateless API servers behind a load balancer
2. **Database** — AWS RDS PostgreSQL (read replicas), MongoDB Atlas
3. **Caching** — ElastiCache Redis cluster
4. **AI Service** — AWS ECS Fargate with auto-scaling
5. **CDN** — CloudFront for static assets
6. **Monitoring** — Sentry + Datadog
7. **CI/CD** — GitHub Actions with automated testing

## License

MIT
