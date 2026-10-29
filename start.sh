#!/usr/bin/env bash
set -e

echo "====================================================================="
echo " Starting APAAR-Verify Platform (SIH 26263, AICTE Smart Automation)"
echo "====================================================================="

if [ -f ".venv/bin/python" ]; then
    PYTHON_EXEC=".venv/bin/python"
elif [ -f ".venv/Scripts/python.exe" ]; then
    PYTHON_EXEC=".venv/Scripts/python.exe"
else
    PYTHON_EXEC="python3"
fi

echo "[1/2] Checking backend database and seed records..."
$PYTHON_EXEC -c "from backend.app.database import engine, Base, SessionLocal; from backend.app.services.seeder import seed_database; Base.metadata.create_all(bind=engine); db = SessionLocal(); seed_database(db); db.close()"

echo "[2/2] Launching unified FastAPI server on http://localhost:8000"
echo "Access Web UI: http://localhost:8000"
echo "API Docs (Swagger): http://localhost:8000/docs"
echo "Health Check: http://localhost:8000/health"
echo "====================================================================="
$PYTHON_EXEC -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
