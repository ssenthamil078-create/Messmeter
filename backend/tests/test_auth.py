from app.models.user import Role
from app.security import create_access_token
from tests.conftest import TEST_PASSWORD


def login(client, email, password=TEST_PASSWORD):
    return client.post("/api/auth/login", json={"email": email, "password": password})


def test_login_success_returns_token_and_user(client, make_user):
    make_user("student@example.com", Role.student, name="Asha")
    res = login(client, "student@example.com")
    assert res.status_code == 200
    body = res.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]
    assert body["user"]["name"] == "Asha"
    assert body["user"]["role"] == "student"
    assert "password" not in body["user"] and "password_hash" not in body["user"]


def test_login_email_is_case_insensitive(client, make_user):
    make_user("student@example.com")
    assert login(client, "Student@Example.COM").status_code == 200


def test_wrong_password_is_rejected(client, make_user):
    make_user("student@example.com")
    res = login(client, "student@example.com", "wrong-password")
    assert res.status_code == 401
    assert res.json()["detail"] == "Incorrect email or password"


def test_unknown_email_gets_same_message_as_wrong_password(client):
    res = login(client, "nobody@example.com")
    assert res.status_code == 401
    assert res.json()["detail"] == "Incorrect email or password"


def test_deactivated_user_cannot_log_in(client, make_user):
    make_user("old@example.com", active=False)
    res = login(client, "old@example.com")
    assert res.status_code == 403


def test_invalid_email_format_is_rejected_by_validation(client):
    assert login(client, "not-an-email").status_code == 422


def test_me_returns_current_user(client, make_user, auth_header):
    user = make_user("staff@example.com", Role.staff)
    res = client.get("/api/auth/me", headers=auth_header(user))
    assert res.status_code == 200
    assert res.json()["email"] == "staff@example.com"
    assert res.json()["role"] == "staff"


def test_me_without_token_is_401(client):
    assert client.get("/api/auth/me").status_code == 401


def test_me_with_garbage_token_is_401(client):
    res = client.get("/api/auth/me", headers={"Authorization": "Bearer not.a.token"})
    assert res.status_code == 401


def test_me_with_expired_token_is_401(client, make_user):
    user = make_user()
    token = create_access_token(user.id, user.role.value, expires_minutes=-1)
    assert client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"}).status_code == 401


def test_token_stops_working_when_user_is_deactivated(client, make_user, auth_header, db_session):
    user = make_user()
    headers = auth_header(user)
    assert client.get("/api/auth/me", headers=headers).status_code == 200
    user.is_active = False
    db_session.commit()
    assert client.get("/api/auth/me", headers=headers).status_code == 401
