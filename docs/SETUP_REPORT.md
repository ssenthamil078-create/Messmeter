# Setup Report - Phase 1, Day 1

Project: MessMeter (Web Development) | Intern: Senthamil

## 1. Environment

| Tool | Version used | Purpose |
| --- | --- | --- |
| Python | 3.13 | Backend language |
| pip + venv | pip 26.2 | Virtual environment and packages |
| Node.js / npm | 22 / 10.9 | Frontend tooling |
| Git | 2.43 | Version control |
| Docker | 29.9 | Local PostgreSQL container |
| PostgreSQL client | 16 | Database tools |
| FastAPI, Uvicorn, SQLAlchemy, Alembic, pytest | see `backend/requirements.txt` | Backend framework, ORM, migrations, tests |
| React, Vite, Tailwind CSS | see `frontend/package.json` | Frontend app and styling |

## 2. Setup process

1. **Checked installed tools** (Python, Node, Git, Docker) and their versions.
2. **Created the workspace** `messmeter/` with `backend/`, `frontend/`, `ml/`, `scripts/` and `docs/planning/`.
3. **Backend:** created a virtual environment in `backend/.venv`, installed the core packages, pinned their versions in
   `requirements.txt`, and wrote a small FastAPI app with a `/api/health` endpoint, a settings module that reads `.env`,
   and one pytest test.
4. **Frontend:** created a React + Vite app, added Tailwind CSS, and set a dev-server proxy so `/api` calls reach the
   backend. The home page shows the backend status.
5. **Configuration:** added `.env.example` (no real secrets), a `.gitignore` that excludes `.env`, `.venv` and
   `node_modules`, and a `docker-compose.yml` for local PostgreSQL.
6. **Git:** initialised a repository on the `main` branch and made the first commit.
7. **GitHub:** connect the local repository to the GitHub repository with `git remote add origin <repo-url>`, then push
   the first commit with `git push -u origin main`.

## 3. Verification

| Check | Result |
| --- | --- |
| `pytest` in `backend/` | 1 test passed |
| `uvicorn app.main:app` then `GET /api/health` | `{"status":"ok","service":"MessMeter API","environment":"development"}` |
| API docs page `/docs` | HTTP 200 |
| `npm run build` in `frontend/` | Build succeeded |
| `npm run dev` and `GET /api/health` through the frontend proxy | Same JSON returned, so frontend and backend connect |

## 4. Issues encountered

- **Deprecation warning in tests:** Starlette's test client prints a warning about `httpx` ("install `httpx2` instead").
  It does not affect results; it can be reviewed when dependencies are next updated.
- **npm notice:** npm reported a newer major version. Not required for this project, so it was left unchanged.
- **Optional ML packages:** pandas, scikit-learn and XGBoost are heavy, so they are listed separately in
  `backend/requirements-ml.txt` and will be installed in Week 5.
- **Database not started yet:** PostgreSQL via Docker is configured but not needed until the schema work in Week 1-2.
- **GitHub login:** the push needs a GitHub repository and a signed-in account (browser login, or a personal access
  token). Tokens must never be committed to the repository.

## 5. Next steps

Design the database schema, add SQLAlchemy models and Alembic migrations, and write the simulated attendance data
generator (tasks T2 and T3 in the development plan).
