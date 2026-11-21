from app.models.user import Role
from tests.conftest import TEST_PASSWORD

NEW_USER = {"name": "Ravi Kumar", "email": "ravi@example.com", "password": "ravi-pass-123", "role": "student"}


def test_admin_can_create_user(client, make_user, auth_header):
    admin = make_user("admin@example.com", Role.admin)
    res = client.post("/api/users", json=NEW_USER, headers=auth_header(admin))
    assert res.status_code == 201
    body = res.json()
    assert body["email"] == "ravi@example.com"
    assert body["role"] == "student"
    assert body["is_active"] is True
    assert "password_hash" not in body
    # the new user can log in with the password the admin set
    login = client.post("/api/auth/login", json={"email": "ravi@example.com", "password": "ravi-pass-123"})
    assert login.status_code == 200


def test_email_is_stored_in_lower_case(client, make_user, auth_header):
    admin = make_user("admin@example.com", Role.admin)
    res = client.post("/api/users", json={**NEW_USER, "email": "Ravi@Example.com"}, headers=auth_header(admin))
    assert res.json()["email"] == "ravi@example.com"


def test_student_cannot_create_user(client, make_user, auth_header):
    student = make_user("student@example.com", Role.student)
    assert client.post("/api/users", json=NEW_USER, headers=auth_header(student)).status_code == 403


def test_staff_cannot_list_users(client, make_user, auth_header):
    staff = make_user("staff@example.com", Role.staff)
    assert client.get("/api/users", headers=auth_header(staff)).status_code == 403


def test_anonymous_cannot_list_users(client):
    assert client.get("/api/users").status_code == 401


def test_admin_can_list_users(client, make_user, auth_header):
    admin = make_user("admin@example.com", Role.admin)
    make_user("student@example.com", Role.student)
    res = client.get("/api/users", headers=auth_header(admin))
    assert res.status_code == 200
    assert [u["email"] for u in res.json()] == ["admin@example.com", "student@example.com"]


def test_duplicate_email_is_rejected(client, make_user, auth_header):
    admin = make_user("admin@example.com", Role.admin)
    make_user("ravi@example.com")
    res = client.post("/api/users", json=NEW_USER, headers=auth_header(admin))
    assert res.status_code == 409


def test_short_password_is_rejected(client, make_user, auth_header):
    admin = make_user("admin@example.com", Role.admin)
    res = client.post("/api/users", json={**NEW_USER, "password": "short"}, headers=auth_header(admin))
    assert res.status_code == 422


def test_password_longer_than_72_bytes_is_rejected(client, make_user, auth_header):
    admin = make_user("admin@example.com", Role.admin)
    res = client.post("/api/users", json={**NEW_USER, "password": "x" * 73}, headers=auth_header(admin))
    assert res.status_code == 422


def test_invalid_role_is_rejected(client, make_user, auth_header):
    admin = make_user("admin@example.com", Role.admin)
    res = client.post("/api/users", json={**NEW_USER, "role": "superuser"}, headers=auth_header(admin))
    assert res.status_code == 422


def test_blank_name_is_rejected(client, make_user, auth_header):
    admin = make_user("admin@example.com", Role.admin)
    res = client.post("/api/users", json={**NEW_USER, "name": "   "}, headers=auth_header(admin))
    assert res.status_code == 422


def test_admin_can_deactivate_and_reactivate(client, make_user, auth_header):
    admin = make_user("admin@example.com", Role.admin)
    student = make_user("student@example.com")
    res = client.patch(f"/api/users/{student.id}", json={"is_active": False}, headers=auth_header(admin))
    assert res.status_code == 200 and res.json()["is_active"] is False
    login = client.post("/api/auth/login", json={"email": "student@example.com", "password": TEST_PASSWORD})
    assert login.status_code == 403
    res = client.patch(f"/api/users/{student.id}", json={"is_active": True}, headers=auth_header(admin))
    assert res.json()["is_active"] is True


def test_admin_cannot_deactivate_self(client, make_user, auth_header):
    admin = make_user("admin@example.com", Role.admin)
    res = client.patch(f"/api/users/{admin.id}", json={"is_active": False}, headers=auth_header(admin))
    assert res.status_code == 400


def test_deactivating_unknown_user_is_404(client, make_user, auth_header):
    admin = make_user("admin@example.com", Role.admin)
    assert client.patch("/api/users/9999", json={"is_active": False}, headers=auth_header(admin)).status_code == 404
