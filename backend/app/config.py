from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings, loaded from environment variables or a .env file."""

    app_name: str = "MessMeter API"
    app_env: str = "development"
    database_url: str = "postgresql+psycopg://messmeter:messmeter@localhost:5432/messmeter"
    # Comma-separated list of allowed frontend origins
    cors_origins: str = "http://localhost:5173"

    # Authentication
    secret_key: str = "change-me"  # replace in .env; never commit a real key
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    bcrypt_rounds: int = 12

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    def check_secret_key(self) -> None:
        """Refuse to run outside development with the placeholder signing key."""
        if self.app_env != "development" and self.secret_key == "change-me":
            raise RuntimeError("SECRET_KEY must be set to a long random value when APP_ENV is not 'development'.")


settings = Settings()
