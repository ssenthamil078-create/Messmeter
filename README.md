# MessMeter

A web app that predicts how many students will eat each meal in a hostel mess, so the kitchen cooks the right amount.
Students tap **Eating** or **Skipping** before each meal; the kitchen sees a headcount forecast and a portion plan.

Built for the UNAI TECH Virtual Internship Program 2026 (domain: Web Development).

## Architecture

![Architecture diagram](docs/images/architecture.png)

A React frontend calls a FastAPI backend (REST, plus WebSocket for live counts) that stores data in PostgreSQL.
Full module descriptions, inputs / processes / outputs and the development order are in
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Modules

| Module | Responsibility |
| --- | --- |
| Data layer | Database connection, tables, request / response validation |
| Authentication and roles | Login, JWT, student / staff / admin access |
| Meals and menu management | Meals, dishes, cut-off times, portion sizes (admin) |
| Check-in | Students mark Eating / Skipping before the cut-off |
| Live kitchen dashboard | Real-time responded, eating and predicted counts |
| Notifications and scheduling | Reminders; runs the forecast at the cut-off |
| Forecast | Predicted headcount with a range (baseline, then XGBoost) |
| Portion planner | Headcount to kg / litres per dish |
| Leftovers and feedback | Cooked vs left quantities, meal ratings |
| Reports | Weekly waste, cost and forecast accuracy |
| Shared frontend | Navigation, reusable components, API client, styles |

## Requirements and priorities

The full requirements (functional, non-functional and user requirements), feature and module breakdown, and the
51-task development list are in [`docs/REQUIREMENTS.md`](docs/REQUIREMENTS.md). Features are prioritised as follows:

| Priority | Features |
| --- | --- |
| **Must Have** | Login and roles, meal and menu management, one-tap check-in, kitchen dashboard, headcount forecast, portion plan, leftover logging |
| **Should Have** | Weekly reports, meal reminders, meal rating, live dashboard updates (WebSocket), installable web app, ML forecast upgrade |
| **Could Have** | Points for regular responders, menu popularity insights, offline check-in queue, CSV export, dark mode |

![Module dependencies](docs/images/module-dependencies.png)

## Project structure

```
messmeter/
├── backend/                 FastAPI server (Python)
│   ├── app/
│   │   ├── api/             routers: auth, users, meals, checkins, forecast, leftovers, reports, live, health
│   │   ├── models/          SQLAlchemy tables: user, meal, checkin, leftover, forecast
│   │   ├── schemas/         Pydantic request / response shapes
│   │   ├── services/        business logic: forecast, portion_planner, report_builder, notifier
│   │   ├── config.py        settings read from .env
│   │   ├── database.py      engine, session, Base
│   │   ├── security.py      password hashing (bcrypt) and JWT
│   │   ├── scheduler.py     timed jobs
│   │   └── main.py          app creation and router registration
│   ├── tests/               pytest tests
│   └── requirements.txt
├── frontend/                React + Vite + Tailwind CSS
│   └── src/
│       ├── pages/           one file per screen (Student, Kitchen, Admin, Reports, Login, Home)
│       ├── components/      reusable UI: NavBar, PageHeader, StatusCard, ProtectedRoute
│       ├── context/         AuthProvider and useAuth (who is logged in)
│       ├── api/             client.js, the fetch wrapper for the backend
│       ├── assets/          logo
│       ├── App.jsx          routes (navigation)
│       └── index.css        Tailwind styles
├── ml/                      forecasting experiments (Week 5)
├── scripts/                 seed_users.py (demo accounts); simulated data generator later
├── docs/                    architecture, setup report, Git workflow, planning documents
├── docker-compose.yml       local PostgreSQL
└── .env.example             template for environment variables
```

Files in `backend/app/api`, `models`, `schemas` and `services` that are not built yet contain a short description of
their responsibility and the week they are planned for.

## Prerequisites

Python 3.11+, Node.js 20+, Git, and Docker (optional, for PostgreSQL).

## Quick start

```bash
# 1. Environment variables
cp .env.example .env            # then edit the values

# 2. Backend (http://localhost:8000, API docs at /docs)
cd backend
python -m venv .venv
source .venv/bin/activate       # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# 3. Frontend (http://localhost:5173) - in a second terminal
cd frontend
npm install
npm run dev

# 4. Database - in a third terminal (the API needs it for login)
docker compose up -d db

# 5. Demo accounts (prints a random password for each, once)
python scripts/seed_users.py
```

The frontend proxies `/api` requests to the backend. The home page shows the backend status, and the navigation bar
links to the Student, Kitchen, Admin, Reports and Login pages.

## Run tests

```bash
cd backend
source .venv/bin/activate
pytest
```

## Status

- **Phase 1, Day 1:** development environment and project skeleton.
- **Phase 1, Day 2:** Git and GitHub workflow ([`docs/GIT_WORKFLOW.md`](docs/GIT_WORKFLOW.md)).
- **Phase 1, Day 3:** project structure, module breakdown and architecture diagram. Frontend pages and navigation are in
  place; backend modules are laid out and will be filled in week by week.

- **Phase 1, Day 4:** requirements analysis, feature and module breakdown, priorities and task list
  ([`docs/REQUIREMENTS.md`](docs/REQUIREMENTS.md)).

See `docs/planning/` for the blueprint and the 6-week development plan.
- **Phase 1, Day 5:** first working module, **Authentication and roles** (M2): JWT login, student / staff / admin access
  rules, protected pages and an admin user-management screen. 33 backend tests. Details in
  [`docs/MODULE_AUTH.md`](docs/MODULE_AUTH.md).
