"""QuantumShield Backend — Configuration Module"""

from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Optional
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # ── Application ──
    app_name: str = "QuantumShield"
    app_version: str = "1.0.0"
    debug: bool = False
    environment: str = "development"
    log_level: str = "INFO"

    # ── API ──
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_prefix: str = "/api/v1"

    # ── PostgreSQL ──
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_db: str = "quantumshield"
    postgres_user: str = "quantumshield"
    postgres_password: str = "qs_secret_2025"
    database_url: str = "postgresql+asyncpg://quantumshield:qs_secret_2025@localhost:5432/quantumshield"

    # ── Redis ──
    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_db: int = 0
    redis_url: str = "redis://localhost:6379/0"

    # ── Neo4j ──
    neo4j_uri: str = "bolt://localhost:7687"
    neo4j_user: str = "neo4j"
    neo4j_password: str = "neo4j_secret"

    # ── Celery ──
    celery_broker_url: str = "redis://localhost:6379/1"
    celery_result_backend: str = "redis://localhost:6379/2"

    # ── JWT ──
    jwt_secret_key: str = "quantumshield-jwt-secret-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expiration_minutes: int = 1440

    # ── Object Storage ──
    s3_endpoint: str = "http://localhost:9000"
    s3_access_key: str = "minioadmin"
    s3_secret_key: str = "minioadmin"
    s3_bucket: str = "quantumshield-artifacts"

    # ── Scanning ──
    max_concurrent_scans: int = 10
    scan_timeout_seconds: int = 300
    tls_scan_batch_size: int = 50

    @property
    def sync_database_url(self) -> str:
        """Sync database URL for Alembic migrations."""
        return self.database_url.replace("asyncpg", "psycopg2")

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "case_sensitive": False}


@lru_cache
def get_settings() -> Settings:
    """Singleton settings accessor."""
    return Settings()
