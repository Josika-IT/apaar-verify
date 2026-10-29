"""
Cross-Platform Single Command Runner for APAAR-Verify.
Serves FastAPI backend + built React frontend on http://localhost:8000
"""
import os
import sys
import subprocess

def main():
    print("=" * 70)
    print(" APAAR-Verify: AICTE Student Data Management & Verification Platform")
    print(" SIH Problem ID 26263 • AICTE Smart Automation")
    print("=" * 70)

    # Detect python executable
    venv_py = os.path.join(".venv", "Scripts", "python.exe")
    if not os.path.exists(venv_py):
        venv_py = os.path.join(".venv", "bin", "python")
    if not os.path.exists(venv_py):
        venv_py = sys.executable

    # Ensure frontend build exists
    dist_index = os.path.join("frontend", "dist", "index.html")
    if not os.path.exists(dist_index):
        print("[SETUP] Building React frontend production bundle...")
        subprocess.run(["npm", "run", "build"], cwd="frontend", shell=True, check=True)

    print("\n[READY] Starting Unified FastAPI Web Service on http://127.0.0.1:8000")
    print(" - Web Portal:         http://127.0.0.1:8000")
    print(" - Public Verifier:    http://127.0.0.1:8000/verify")
    print(" - Swagger API Docs:   http://127.0.0.1:8000/docs")
    print(" - Health Endpoint:    http://127.0.0.1:8000/health")
    print("=" * 70 + "\n")

    subprocess.run([venv_py, "-m", "uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"])

if __name__ == "__main__":
    main()
