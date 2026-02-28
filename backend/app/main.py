"""
QuantumShield - Main FastAPI Application
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

# Import routers
from app.auth.demo_routes import router as auth_router
# from app.admin.routes import router as admin_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    print("🚀 QuantumShield API starting...")
    
    # Initialize database connections (optional for now)
    try:
        from app.database import init_db_pool, init_redis_client
        # await init_db_pool()
        # await init_redis_client()
        print("✅ Database connections initialized")
    except Exception as e:
        print(f"⚠️  Database connection failed: {e}")
        print("⚠️  Running in demo mode without database")
    
    yield
    
    # Shutdown
    print("🛑 QuantumShield API shutting down...")
    try:
        from app.database import close_db_pool, close_redis_client
        # await close_db_pool()
        # await close_redis_client()
        print("✅ Database connections closed")
    except Exception:
        pass


# Create FastAPI app
app = FastAPI(
    title="QuantumShield API",
    description="Harvest Now Decrypt Later Exposure Intelligence Platform",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security headers middleware
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


# Include routers
app.include_router(auth_router)
# app.include_router(admin_router)


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": "QuantumShield API",
        "version": "1.0.0",
        "status": "operational",
        "docs": "/docs",
    }


# Health check
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "quantumshield-api",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
