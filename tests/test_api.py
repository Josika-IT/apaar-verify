import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"
    assert res.json()["service"] == "apaar-verify"

def test_login_aicte_admin():
    res = client.post("/api/v1/auth/login", json={
        "email": "admin@aicte.gov.in",
        "password": "Admin@123"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["role"] == "aicte_admin"

def test_login_verifier():
    res = client.post("/api/v1/auth/login", json={
        "email": "verifier@tcs.com",
        "password": "Verifier@123"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["user"]["role"] == "verifier"

def test_aicte_dashboard():
    login_res = client.post("/api/v1/auth/login", json={
        "email": "admin@aicte.gov.in",
        "password": "Admin@123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/v1/dashboard/aicte", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total_institutions"] >= 8
    assert data["total_actual_enrolment"] > 500
    assert data["excess_enrolment_institutions_count"] >= 2
    assert len(data["state_breakdown"]) > 0

def test_institution_dashboard():
    login_res = client.post("/api/v1/auth/login", json={
        "email": "admin@iitd.ac.in",
        "password": "Admin@123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/v1/dashboard/institution", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "total_approved_intake" in data
    assert len(data["course_breakdown"]) > 0

def test_validation_report():
    login_res = client.post("/api/v1/auth/login", json={
        "email": "admin@aicte.gov.in",
        "password": "Admin@123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/v1/validation/report", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total_flags"] > 0
    assert data["duplicate_internal_count"] >= 1
    assert data["duplicate_cross_count"] >= 1
    assert data["excess_intake_count"] >= 1

def test_anomalies():
    login_res = client.post("/api/v1/auth/login", json={
        "email": "admin@aicte.gov.in",
        "password": "Admin@123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/v1/anomalies", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "high_risk_count" in data
    assert len(data["anomalies"]) >= 8

def test_public_verify():
    # Test valid duplicate apaar
    res = client.get("/api/v1/verify/889911223344")
    assert res.status_code == 200
    data = res.json()
    assert data["is_valid"] is True
    assert data["apaar_id"] == "889911223344"
    assert "name_masked" in data

    # Test non-existent apaar
    res_fake = client.get("/api/v1/verify/000000000000")
    assert res_fake.status_code == 200
    assert res_fake.json()["is_valid"] is False

def test_verifiable_record_pdf():
    res = client.get("/api/v1/records/889911223344/pdf")
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/pdf"
    assert len(res.content) > 1000

def test_reports_export_csv():
    login_res = client.post("/api/v1/auth/login", json={
        "email": "admin@aicte.gov.in",
        "password": "Admin@123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/v1/reports/enrolment-summary?format=csv", headers=headers)
    assert res.status_code == 200
    assert "text/csv" in res.headers["content-type"]

def test_reports_export_pdf():
    login_res = client.post("/api/v1/auth/login", json={
        "email": "admin@aicte.gov.in",
        "password": "Admin@123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/v1/reports/excess-intake?format=pdf", headers=headers)
    assert res.status_code == 200
    assert "application/pdf" in res.headers["content-type"]

def test_audit_logs():
    login_res = client.post("/api/v1/auth/login", json={
        "email": "admin@aicte.gov.in",
        "password": "Admin@123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/v1/audit-logs", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert len(data) > 0
