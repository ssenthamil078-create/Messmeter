# Module M2: Authentication and roles (Phase 1, Day 5)

Why this module first: every other module (check-in, kitchen dashboard, admin panel) needs to know **who** is calling
and **what they may do**. Nothing else can be built safely without it.

## What it does

- A user logs in with email and password and receives a signed **JWT** (valid 60 minutes).
- Three roles: **student** (check-in), **staff** (kitchen dashboard), **admin** (everything, plus user management).
- The **backend** enforces access (`require_roles`); the **frontend** only hides pages (`ProtectedRoute`, role-aware nav).
- An admin creates accounts and can deactivate / reactivate them. Deactivated users are locked out immediately, even if
  they still hold a valid token.

## API

| Method | Path | Who | Purpose |
|---|---|---|---|
| POST | `/api/auth/login` | anyone | email + password -> token and user |
| GET | `/api/auth/me` | any logged-in user | the current user |
| GET | `/api/users` | admin | list users |
| POST | `/api/users` | admin | create a user (201, 409 if email exists) |
| PATCH | `/api/users/{id}` | admin | set `is_active` (an admin cannot deactivate themself) |

## Request flow

1. `LoginPage` -> `AuthProvider.login` -> `POST /api/auth/login`.
2. The backend finds the user, checks the bcrypt hash, and returns a token containing the user id and role.
3. `api/client.js` stores the token and sends `Authorization: Bearer <token>` on later requests.
4. `get_current_user` decodes the token, loads the user from the database and rejects missing or inactive users (401).
5. `require_roles("admin")` returns 403 if the role is wrong.

## Design decisions

- **bcrypt** for passwords (slow on purpose, salted). Passwords over 72 bytes are rejected because bcrypt cannot use them.
- **Same message for unknown email and wrong password** ("Incorrect email or password"), plus a dummy hash check for
  unknown emails, so attackers cannot discover which emails exist.
- **401 vs 403**: 401 = not logged in or bad token; 403 = logged in but not allowed.
- The user is re-read from the database on every request, so deactivation takes effect at once.
- Startup refuses to run outside development with the default `SECRET_KEY`.
- No public sign-up: accounts are created by an admin (a hostel mess has a known set of users).

## Tests

`cd backend && pytest` runs 33 tests on in-memory SQLite: hashing, token expiry and tampering, login success and
failures, `/me`, role checks, user creation validation, duplicate email, deactivation. Browser walk-through was done
against PostgreSQL (see the Day 5 report).

## Known limits (planned later)

No password change or reset, no refresh tokens or rate limiting on login, token kept in `localStorage`. Alembic
migrations replace `create_all` when the schema starts changing.
