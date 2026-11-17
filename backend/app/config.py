from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings, loaded from environment variables or a .env file."""

    app_name: str = "MessMeter API"
    app_env: str = "development"
    database_url: str = "postgresql+psycopg://messmeter:messmeter@localhost:5432/messmeter"
    # Comma-separated list of allowed frontend origins
    cors_origins: str = "http://localhost:5173"
    secret_key: str = "change-me"  # replace in .env; never commit a real key

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
