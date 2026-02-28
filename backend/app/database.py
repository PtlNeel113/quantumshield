"""
QuantumShield - Database connection management
PostgreSQL and Redis connection pools
"""

import asyncpg
import redis.asyncio as redis
from typing import Optional

# Global connection pools
_db_pool: Optional[asyncpg.Pool] = None
_redis_client: Optional[redis.Redis] = None

# Database configuration
DATABASE_URL = "postgresql://quantumshield_app:your_secure_password@localhost:5432/quantumshield"
REDIS_URL = "redis://localhost:6379/0"


async def init_db_pool():
    """Initialize PostgreSQL connection pool"""
    global _db_pool
    
    if _db_pool is None:
        _db_pool = await asyncpg.create_pool(
            DATABASE_URL,
            min_size=10,
            max_size=20,
            command_timeout=60,
        )
    
    return _db_pool


async def get_db_pool() -> asyncpg.Pool:
    """Get PostgreSQL connection pool"""
    if _db_pool is None:
        await init_db_pool()
    
    return _db_pool


async def close_db_pool():
    """Close PostgreSQL connection pool"""
    global _db_pool
    
    if _db_pool is not None:
        await _db_pool.close()
        _db_pool = None


async def init_redis_client():
    """Initialize Redis client"""
    global _redis_client
    
    if _redis_client is None:
        _redis_client = await redis.from_url(
            REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
        )
    
    return _redis_client


async def get_redis_client() -> redis.Redis:
    """Get Redis client"""
    if _redis_client is None:
        await init_redis_client()
    
    return _redis_client


async def close_redis_client():
    """Close Redis client"""
    global _redis_client
    
    if _redis_client is not None:
        await _redis_client.close()
        _redis_client = None
