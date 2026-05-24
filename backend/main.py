"""
Personal Finance Assistant API
FastAPI backend for portfolio management, tax tracking, and forecasting
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.config import settings
from backend.database import create_tables

app = FastAPI(
    title="Personal Finance Assistant",
    description="Secure investment & property management API",
    version="0.1.0",
)

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create tables on startup
@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    create_tables()

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Personal Finance Assistant API",
        "version": "0.1.0",
        "status": "running",
        "debug": settings.DEBUG,
    }

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "ok", "environment": settings.ENVIRONMENT}

# TODO: Add routes
# from backend.routes import accounts, investments, properties, snapshots, tax, forecast
# app.include_router(accounts.router, prefix="/api/accounts", tags=["accounts"])
# app.include_router(investments.router, prefix="/api/investments", tags=["investments"])
# app.include_router(properties.router, prefix="/api/properties", tags=["properties"])
# app.include_router(snapshots.router, prefix="/api/snapshots", tags=["snapshots"])
# app.include_router(tax.router, prefix="/api/tax", tags=["tax"])
# app.include_router(forecast.router, prefix="/api/forecast", tags=["forecast"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host=settings.BACKEND_HOST,
        port=settings.BACKEND_PORT,
    )
