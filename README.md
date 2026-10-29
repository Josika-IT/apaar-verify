# APAAR-Verify: Student Data Management & Verification Platform
### Smart India Hackathon (SIH) • Problem ID 26263 • AICTE (Smart Automation)

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20TypeScript-61DAFB.svg?style=flat&logo=react)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Styles-Tailwind%20CSS-38B2AC.svg?style=flat&logo=tailwind-css)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen.svg)]()

> **One Nation, One Student ID (APAAR)**: A unified, tamper-proof academic data repository and verification engine for AICTE-approved institutions. Enforces statutory intake compliance, detects cross-university duplicate admissions, provides statistical anomaly monitoring, and issues consent-gated verifiable digital credentials with QR verification.

---

## 🏛️ Project Architecture & Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           AICTE "APAAR-VERIFY" ARCHITECTURE                     │
└─────────────────────────────────────────────────────────────────────────────────┘

 [ Institution ERP / Portal ]
             │
             ▼
   Admissions Upload (Single / Bulk CSV / Excel)
             │
             ▼
   Pre-Commit Validation Engine ────► Catch 12-digit format, age sanity, quota mismatch
             │
             ▼
   AICTE Central Registry (Database) 
             │
             ├────────────────────────────────┬───────────────────────────────┐
             ▼                                ▼                               ▼
  Cross-Institution Check           Statistical Anomaly Engine        Public Verifier
  (Flags duplicate APAARs           (Z-score utilization outlier,    (Consent-gated search
   across multiple universities)     intake overflow risk ranking)    & QR-linked PDF)
             │                                │                               │
             ▼                                ▼                               ▼
  Validation Flags Register         AICTE Admin Command Center       Download Verifiable
  (Critical / Error / Warning)      (Live Polling 10s Telemetry)     Academic Record PDF
```

---

## 🚀 Key Features

1. **Strict 12-Digit APAAR Format Validation**: Every student identity is validated against the national numeric 12-digit standard.
2. **Multi-Institution Duplicate Enrollment Detection**: Automatically detects and flags students registered concurrently across multiple universities (e.g., dual admissions fraud).
3. **Statutory Intake Quota Enforcement**: Flags colleges admitting regular students exceeding AICTE approved intake thresholds while exempting sanctioned supernumerary quotas.
4. **Statistical Anomaly Detection (Z-Score)**: Calculates mean utilization ($\mu$) and standard deviation ($\sigma$) across all accredited colleges to classify institutions into **Low**, **Medium**, and **High Risk** categories.
5. **Verifiable Student Record PDF with QR Code**: Generates tamper-evident certificates with the **APAAR ID prominently printed beside the institutional student roll ID**, satisfying **SIH Requirement 10**.
6. **Student Data Consent Management (Section 43A IT Act)**: Students hold consent flags; verifiers see masked fields (`R**** S*****`) when consent is restricted.
7. **Live-Polling National Dashboard**: AICTE central oversight command center updates every 10 seconds via background telemetry polling.
8. **Comprehensive Audit Ledger**: Every write operation (uploads, edits, audits, PDF downloads) generates an immutable audit log with user email, role, and IP address.
9. **Single Unified Deployable Service**: FastAPI serves both the high-performance backend API and the compiled React SPA from one unified container.

---

## 👥 Demo User Credentials

The database auto-seeds on first startup with realistic institutional datasets, cross-institution duplicate anomalies, and excess intake violations. **Quick-fill buttons are provided on the login page.**

| Role | Email | Password | Scope & Description |
| :--- | :--- | :--- | :--- |
| **AICTE Admin** | `admin@aicte.gov.in` | `Admin@123` | National command center, z-score anomaly matrix, state heatmaps, all-institution audit ledger |
| **Institution Admin** (IIT Delhi) | `admin@iitd.ac.in` | `Admin@123` | Compliant college intake, student single/bulk upload, branch-wise charts |
| **Institution Admin** (COEP Pune) | `admin@coep.ac.in` | `Admin@123` | **Exceeds Approved Intake (+18 seats overflow)** - Demonstrates red flag alert |
| **Institution Admin** (Jadavpur Univ) | `admin@jadavpur.edu` | `Admin@123` | **Exceeds Approved Intake (+14 seats overflow)** - High Risk anomaly demonstration |
| **Authorized Verifier** | `verifier@tcs.com` | `Verifier@123` | Corporate/employer read-only credential verification portal |

---

## 🎬 2-Minute Rapid Demo Script

Follow these steps to demonstrate the end-to-end functionality to evaluators:

### Step 1: Institutional Admission Upload & Row-Level Validation
1. Open `http://localhost:8000/login` and click **"IIT Delhi Admin"** quick-fill button, then click **Sign In**.
2. Navigate to **Student Data Upload** (`/upload`).
3. Click **"Download Sample CSV Template"** to inspect standardized columns.
4. Drag & drop or select any CSV with formatting errors: watch the **Pre-Commit Validation Preview Table** immediately catch 12-digit format violations, age sanity issues, or citizenship mismatches before committing.
5. Switch to **Single Student Entry Form** and create a student. Notice immediate inclusion in the institutional intake count.

### Step 2: AICTE Central Command & Statistical Anomaly Matrix
1. Click **Logout** and sign in using **"AICTE Admin"** (`admin@aicte.gov.in`).
2. Notice the **Live Polling Telemetry badge (10s)** updating real-time national counts.
3. Observe the **Critical Statutory Warning Panel**: **COEP Pune** and **Jadavpur University** are flagged in red for exceeding sanctioned intake.
4. Click **Anomaly Detection** (`/anomalies`) in the sidebar:
   - Review the national mean utilization and standard deviation ($\sigma$).
   - Observe COEP Pune's **Z-score (+2.15$\sigma$)** and High Risk classification with clear root-cause explanations.
5. Click **Validation & Flags** (`/validation`):
   - Review cross-institution duplicates (e.g., student registered at both IIT Bombay and DTU).
   - Test the **"Mark Resolved"** or **"Execute Fresh System Audit"** action buttons.

### Step 3: Public Credential Verification & Downloadable QR Record
1. Click **Verify Record** in the top navbar (`/verify`).
2. In the 12-digit search box, click the test pill **"889911223344 (Verified)"** and click **Authenticate**.
3. Observe the **Verified Status Badge**, masked sensitive fields, and legal consent notice.
4. Click **"Download Verifiable PDF"**:
   - Opens the tamper-proof PDF with embedded QR code.
   - Note that **APAAR ID is printed prominently beside the Student Roll ID** satisfying **Requirement 10**.
5. Test with non-existent ID `000000000000` to show the unverified fallback state.

---

## 💻 Local Development & Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### One-Command Start (Windows)
```cmd
start.bat
```

### One-Command Start (Linux / macOS)
```bash
chmod +x start.sh
./start.sh
```

### Manual Step-by-Step Setup

1. **Clone repository**:
   ```bash
   git clone https://github.com/josik64178/apaar-verify.git
   cd apaar-verify
   ```

2. **Backend Setup**:
   ```bash
   python -m venv .venv
   # Windows: .venv\Scripts\activate | Unix: source .venv/bin/activate
   pip install -r backend/requirements.txt
   ```

3. **Frontend Build**:
   ```bash
   cd frontend
   npm install
   npm run build
   cd ..
   ```

4. **Launch Unified Service**:
   ```bash
   uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

5. **Open Browser**:
   - Web Platform: `http://localhost:8000`
   - Public QR Verifier: `http://localhost:8000/verify`
   - Interactive Swagger API: `http://localhost:8000/docs`
   - Service Health Check: `http://localhost:8000/health`

---

## 🧪 Running Automated Tests

Run the backend integration test suite covering authentication, RBAC, anomaly z-scores, validation audits, PDF generation, and public verification:

```bash
pytest tests/test_api.py -v
```

All 12 test suites execute in < 5 seconds.

---

## 🐳 Docker Deployment

The application includes a multi-stage `Dockerfile` that packages both the React build and FastAPI backend into a single image:

```bash
# Build Docker image
docker build -t apaar-verify .

# Run container
docker run -p 8000:8000 -e SECRET_KEY="my-production-secret" apaar-verify
```

---

## ☁️ Cloud Deployment on Render (Free Tier)

This repository includes a `render.yaml` blueprint for one-click deployment.

### Click-by-Click Deployment Guide:
1. Create a free account at [render.com](https://render.com).
2. Click **"New +"** in the top right and select **"Web Service"**.
3. Connect your GitHub repository: `https://github.com/<your-username>/apaar-verify`.
4. Choose **"Docker"** as the Environment.
5. Set the following parameters:
   - **Name**: `apaar-verify`
   - **Region**: Oregon (US West) or Singapore
   - **Branch**: `main`
   - **Plan**: Free
   - **Health Check Path**: `/health`
6. Add the following **Environment Variables**:
   - `PORT`: `8000`
   - `SECRET_KEY`: `<generate-a-secure-random-32-char-string>`
   - `ENVIRONMENT`: `production`
   - `DATABASE_URL`: `sqlite:///./apaar_verify.db` (or connect free Render PostgreSQL)
7. Click **"Create Web Service"**. Render will build the React frontend and deploy the FastAPI container.
8. Once deployed, Render will assign your public HTTPS URL (e.g. `https://apaar-verify.onrender.com`).

---

## 📋 Architectural Assumptions & Design Decisions

In accordance with project specifications, the following design decisions were established:
1. **APAAR ID Specification**: Exactly 12 numeric digits assigned to higher technical education students; validated with zero-padding tolerance.
2. **Statutory Intake Cap**: Only `quota == "Regular"` admissions count toward the approved intake ceiling. `quota == "Supernumerary"` (e.g. PMSSS, defense, sports) and `quota == "NRI"` are exempt from the regular intake quota.
3. **Dual Enrollment Anomaly**: When an identical APAAR ID is associated with two distinct institution records, both are flagged with severity `CRITICAL` under `DUPLICATE_APAAR_CROSS`.
4. **Statistical Outlier Formula**: Outlier scoring uses a standard z-score $Z = (X - \mu)/\sigma$ on capacity utilization percentages across all institutions. Scores above 1.8$\sigma$ or negative outliers below -2.0$\sigma$ trigger risk index increments.
5. **Student Consent Model**: In compliance with Section 43A of the IT Act, each student record stores a boolean `consent_flag`. When false, public and authorized verification endpoints mask full name and identification roll numbers while confirming accredited academic enrollment status.
6. **Unified Monolith**: FastAPI serves static built assets from `frontend/dist` with single-page application fallback routing so the entire stack deploys as one single web service.

---

## 📜 Problem Statement Compliance Matrix

| Requirement | Implementation Detail | Status |
| :--- | :--- | :---: |
| **1. Landing Page** | Flow diagram, intro, public verify link, portal login | ✅ Verified |
| **2. Login Page** | Role-based redirect, mock OTP/captcha, forgot password stub, quick-fill accounts | ✅ Verified |
| **3. Institution Dashboard** | Intake cards, regular vs supernumerary, Recharts intake vs enrolment chart, alerts | ✅ Verified |
| **4. Student Data Upload** | Single entry + bulk CSV/Excel upload with downloadable template & preview table | ✅ Verified |
| **5. Student Records** | Searchable/filterable table, edit modal, status badges, audit history | ✅ Verified |
| **6. Validation Results** | Internal & cross-institution duplicates, excess intake, format/sanity errors | ✅ Verified |
| **7. AICTE Admin Dashboard** | National totals, state/institution breakdown, excess intake red flags, 10s polling | ✅ Verified |
| **8. Anomaly Detection** | Rule-based + statistical z-score outlier analysis, risk score per institution | ✅ Verified |
| **9. Verification Portal** | Public & Verifier lookup, 12-digit APAAR search, masked fields, consent notices | ✅ Verified |
| **10. Verifiable Student Record** | Downloadable PDF with QR code & APAAR ID printed beside student ID | ✅ Verified |
| **11. Reports Page** | Export CSV & PDF (Enrolment summary, excess intake, duplicates, accreditation) | ✅ Verified |
| **12. Audit Log Page** | AICTE Admin access: who did what, when, IP, action, entity | ✅ Verified |
| **13. Consent Management** | Consent-gated visibility, Section 43A IT Act compliance | ✅ Verified |
| **14. API Docs Page** | Link to `/docs`, `/redoc`, and ERP REST integration guide | ✅ Verified |

---

## ⚖️ License
Released under the MIT License. Developed for AICTE Smart India Hackathon (SIH Problem ID 26263).
