"""
QuantumShield Backend Startup Script
Simple script to start the FastAPI server
"""

import uvicorn

if __name__ == "__main__":
    print("=" * 60)
    print("🛡️  QuantumShield Backend API")
    print("=" * 60)
    print("\n📝 Demo Credentials:")
    print("   Admin:   admin@quantumshield.com / admin123")
    print("   Analyst: analyst@quantumshield.com / analyst123")
    print("   Viewer:  viewer@quantumshield.com / viewer123")
    print("\n🌐 API will be available at: http://localhost:8000")
    print("📚 API Docs: http://localhost:8000/docs")
    print("\n" + "=" * 60 + "\n")
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
