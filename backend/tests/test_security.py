import jwt
import pytest

from app.security import create_access_token, decode_access_token, hash_password, verify_password


def test_hash_is_not_plain_text_and_verifies():
    hashed = hash_password("secret-pass-1")
    assert hashed != "secret-pass-1"
    assert verify_password("secret-pass-1", hashed)


def test_wrong_password_does_not_verify():
    assert not verify_password("wrong", hash_password("secret-pass-1"))


def test_same_password_gets_different_hashes():
    assert hash_password("secret-pass-1") != hash_password("secret-pass-1")


def test_malformed_hash_returns_false_instead_of_crashing():
    assert not verify_password("anything", "not-a-bcrypt-hash")


def test_token_round_trip():
    payload = decode_access_token(create_access_token(7, "staff"))
    assert payload["sub"] == "7"
    assert payload["role"] == "staff"


def test_expired_token_is_rejected():
    token = create_access_token(7, "staff", expires_minutes=-1)
    with pytest.raises(jwt.ExpiredSignatureError):
        decode_access_token(token)


def test_tampered_token_is_rejected():
    token = create_access_token(7, "student")
    with pytest.raises(jwt.PyJWTError):
        decode_access_token(token[:-2] + ("aa" if not token.endswith("aa") else "bb"))
