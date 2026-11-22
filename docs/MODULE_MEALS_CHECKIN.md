# Module M3 & M4: Meal Management & Check-In Integration (Phase 1, Day 6)

## Overview & Purpose

Following the implementation of Module M2 (Authentication & Role-Based Access Control) on Day 5, Day 6 focuses on **Feature Development and Component Integration**.

In hostel mess management, preventing food waste requires accurate, advance headcount data. This relies on two interconnected modules:
1. **Module M3: Meal & Menu Scheduling (Admin)** — Configures what meal is served, which dishes are on the menu, the individual portion sizes, and the strict cut-off deadline for attendance registration.
2. **Module M4: One-Tap Attendance Check-in (Student)** — Enables authenticated students to view today's meals and submit their dining intention (**Eating** or **Skipping**) prior to the cut-off time.
3. **Kitchen Integration** — Aggregates individual student responses into live counts (Confirmed Eating, Skipping, Pending) that immediately guide kitchen preparation.

---

## What It Does

- **Admin Meal Scheduling:** Admin users can create meals with specific dates, types (`breakfast`, `lunch`, `dinner`), dish lists (e.g. Rice, Sambar, Paneer Butter Masala), portion sizes per student (e.g. `0.25 kg`, `3 pcs`), and precise cut-off deadlines.
- **Strict Cut-Off Deadline Enforcement:** The backend computes `is_open` dynamically using UTC timestamps. If a check-in is attempted after the cut-off, the request is rejected with `HTTP 400 Bad Request` ("Check-in for this meal is closed").
- **One-Tap Check-In Interface:** Students view clean meal cards displaying the full menu and deadline countdown, with intuitive **Eating** (green) and **Skipping** (amber) buttons. Responses update instantly with clear status badges.
- **Dynamic Choice Modification:** Before the cut-off deadline, students can switch between Eating and Skipping without restrictions.
- **Role Integration:**
  - Only authenticated Admins can schedule or delete meals (`POST /api/meals`, `DELETE /api/meals/{id}`).
  - Only authenticated Students (and Admins for testing) can submit check-ins (`POST /api/checkins`).
  - All logged-in users can view today's meals and menus (`GET /api/meals/today`).

---

## API Specification

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/meals` | Authenticated | List all scheduled meals ordered by date descending |
| GET | `/api/meals/today` | Authenticated | Retrieve today's meals with current user's check-in status |
| POST | `/api/meals` | Admin Only | Schedule a new meal with dishes, portions, and cut-off (201 Created) |
| GET | `/api/meals/{id}` | Authenticated | Get single meal details by ID |
| DELETE | `/api/meals/{id}` | Admin Only | Remove a scheduled meal (204 No Content) |
| POST | `/api/checkins` | Student / Admin | Submit or change attendance choice (`eating` or `skipping`) |
| GET | `/api/checkins/my` | Authenticated | Retrieve all past check-in responses for logged-in user |
| GET | `/api/checkins/summary/{meal_id}` | Authenticated | Get headcount summary (eating, skipping, pending, total) |

---

## Integration Architecture & Request Flow

```
[Student in Browser]
       │
       ▼
[StudentPage.jsx]
       │  1. GET /api/meals/today (with JWT Bearer token)
       ▼
[FastAPI Backend - get_today_meals]
       │  2. Query Meals (date >= today)
       │  3. Join Checkins (where user_id == current_user.id)
       ▼
[Meal Cards Rendered with dishes, cut-off time & user status]
       │
       │  4. Student taps "✓ Eating"
       ▼
[POST /api/checkins]
       │  5. Validate user role is 'student'
       │  6. Validate meal is_open (now < cutoff_time)
       │  7. Upsert Checkin record (user_id, meal_id, status)
       ▼
[Database (Checkins Table)]
       │
       ▼
[KitchenPage.jsx] (Kitchen Staff View)
       │  8. GET /api/checkins/summary/{meal_id}
       ▼
[Live Count Metrics: Eating: 42 | Skipping: 8 | Pending: 15]
```

---

## Review & Improvement of Day 5 Implementation

During the review of Day 5's work, the following issues were identified and resolved:

1. **Fixed Fatal Null Pointer Crash in `AdminPage.jsx`:**
   - *Bug:* Line 130 used `{u.id !== me.id && ...}`. When `me` was temporarily loading or transitioning, accessing `me.id` threw `TypeError: Cannot read properties of null (reading 'id')`, causing the React component tree to crash.
   - *Fix:* Safely guarded with `me && u.id !== me.id` and optional chaining.
2. **Added Live User Search & Filtering:**
   - Admins can now filter the user accounts table in real-time by name, email, or role.
3. **Tabbed Navigation in Admin Dashboard:**
   - Structured the Admin view into clean tabs: **User Accounts** and **Meal & Menu Scheduling**, keeping the administrative workflow organized.
4. **Added `apiDelete` Client Helper:**
   - Exported `apiDelete` in `frontend/src/api/client.js` for standard HTTP DELETE operations.
5. **Database & Configuration Resilience:**
   - Enhanced `config.py` with Pydantic fallback handling.
   - Enhanced `database.py` with multi-dialect support (SQLite for instant offline development and testing, PostgreSQL for production Docker deployment).

---

## Verification & Automated Tests

All functionality is verified with an automated test suite covering 25 test cases across 4 test groups:

1. **Security & Cryptography:** Password hashing with salted bcrypt, key validation, and JWT encoding/decoding.
2. **Authentication & User Management:** Login verification, role checking, account deactivation, and self-deactivation prevention.
3. **Meal & Menu Scheduling:** Admin meal creation, dish parsing, duplicate meal rejection (409 Conflict), empty dish validation (422), and meal deletion.
4. **Attendance Check-In & Integration:**
   - Student check-in (`eating`).
   - Choice switching before cut-off (`skipping`).
   - Strict deadline enforcement: check-ins on expired meals return `HTTP 400 Bad Request`.
   - Role protection: staff cannot submit student check-ins (403 Forbidden).
   - Headcount summary calculation for kitchen planning.

**Command to execute:**
```bash
python backend/run_tests.py
# Result: 25 PASSED, 0 FAILED
```
