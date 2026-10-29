import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse

from .config import settings
from .database import engine, Base, SessionLocal
from .services.seeder import seed_database

# Routers
from .routers.auth import router as auth_router
from .routers.students import router as students_router
from .routers.dashboard import router as dashboard_router
from .routers.validation import router as validation_router
from .routers.anomalies import router as anomalies_router
from .routers.verify import router as verify_router
from .routers.reports import router as reports_router
from .routers.audit import router as audit_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Ensure database tables exist
    Base.metadata.create_all(bind=engine)
    # 2. Seed initial data
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="APAAR ID-based Student Data Management and Verification Platform for AICTE-approved institutions (SIH Problem ID 26263, AICTE, Smart Automation)",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/api/v1/openapi.json",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health endpoint
@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "ok",
        "service": "apaar-verify",
        "version": settings.PROJECT_VERSION,
        "environment": os.getenv("ENVIRONMENT", "production")
    }

# Register API routers
app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
app.include_router(students_router, prefix=settings.API_V1_PREFIX)
app.include_router(dashboard_router, prefix=settings.API_V1_PREFIX)
app.include_router(validation_router, prefix=settings.API_V1_PREFIX)
app.include_router(anomalies_router, prefix=settings.API_V1_PREFIX)
app.include_router(verify_router, prefix=settings.API_V1_PREFIX)
app.include_router(reports_router, prefix=settings.API_V1_PREFIX)
app.include_router(audit_router, prefix=settings.API_V1_PREFIX)

# Static files / Frontend serving
dist_dir = settings.DIST_DIR
assets_dir = os.path.join(dist_dir, "assets")

if os.path.exists(assets_dir):
    app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

@app.get("/{full_path:path}", include_in_schema=False)
async def serve_spa(request: Request, full_path: str):
    # Skip api routes and health
    if full_path.startswith("api/") or full_path.startswith("docs") or full_path.startswith("openapi") or full_path == "health":
        return JSONResponse(status_code=404, content={"detail": "Not found"})
    
    # Try serving static file if directly matched
    target_file = os.path.join(dist_dir, full_path)
    if os.path.exists(target_file) and os.path.isfile(target_file):
        return FileResponse(target_file)
    
    # Otherwise return index.html for React SPA router
    index_file = os.path.join(dist_dir, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    
    return JSONResponse(
        content={
            "service": "APAAR-Verify API",
            "message": "Frontend build is not yet generated in frontend/dist. API documentation available at /docs.",
            "health": "/health",
            "api_v1": "/api/v1"
        }
    )
