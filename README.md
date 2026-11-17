# MessMeter

A web app that predicts how many students will eat each meal in a hostel mess, so the kitchen cooks the right amount.
Students tap **Eating** or **Skipping** before each meal; the kitchen sees a headcount forecast and a portion plan.

Built for the UNAI TECH Virtual Internship Program 2026 (domain: Web Development).

## Project structure

```
messmeter/
├── backend/            FastAPI server (Python)
│   ├── app/            application code (api, models, schemas, services)
│   ├── tests/          pytest tests
│   └── requirements.txt
├── frontend/           React + Vite + Tailwind CSS web app
├── ml/                 forecasting experiments (Week 5)
├── scripts/            helper scripts (e.g. simulated data generator)
├── docs/planning/      Day 2-4 planning documents (idea, blueprint, development plan)
├── docker-compose.yml  local PostgreSQL
└── .env.example        template for environment variables
```

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

# 4. Database (optional for now) - in a third terminal
docker compose up -d db
```

The frontend proxies `/api` requests to the backend, so the home page shows the backend status when both are running.

## Run tests

```bash
cd backend
source .venv/bin/activate
pytest
```

## Planned features

Role-based login, one-tap meal check-in, live kitchen dashboard, headcount forecast, portion planner, leftover logging
and reports. See `docs/planning/` for the full blueprint and development plan.

## Status

Phase 1, Day 1: development environment and project skeleton set up. Backend health endpoint and frontend starter page
are working.
