# 🎓 BrightTutor Academic Portal

> **Comprehensive Ethiopian K-12 STEM Academic Management & Tutoring Clearinghouse Platform**

[![Angular](https://img.shields.io/badge/Angular-22.1-dd0031.svg?style=for-the-badge&logo=angular)](https://angular.dev/)
[![.NET Core](https://img.shields.io/badge/.NET_Core-8.0-512bd4.svg?style=for-the-badge&logo=dotnet)](https://dotnet.microsoft.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Production_Ready-006948.svg?style=for-the-badge)](https://github.com/Rihana-Jemal-2026/BrightTutor)

---

## 📌 Executive Overview

**BrightTutor** is a state-of-the-art educational management portal engineered for Ethiopian secondary STEM cohorts, home tutoring networks, and institutional academic governance. Integrated directly with Ministry of Education (MoE) curriculum standards, BrightTutor streamlines candidate admissions, facial biometric attendance, automated QR check-ins, automated ETB payroll clearing, weighted academic gradebooks, and digital certificate verification.

---

## 🚀 Key Portal Features

### 👨‍🎓 1. Student Admission & Registration Portal
* **Digital Self-Registration**: Streamlined admission workflows for Grade 9-12 STEM candidates with instant student code generation (`#STU-XXXX`).
* **GPS & Village Geocoding**: Automatic location tag mapping for Ethiopian home-visit tutoring routes.
* **Course Catalog & Delivery Choice**: Support for 1-on-1 Home Visit Tutoring, Online Live Classes, and Group Section Cohorts.
* **Real-time Field Validation**: Form validation with instant error highlights and toast notifications.

### 👩‍🏫 2. Teacher Screening & Application Portal
* **Educator Onboarding**: Comprehensive application workflow capturing specialization, qualification tier, CV uploads, and identification.
* **Administrative Vetting**: Multi-stage review pipeline supporting application approvals, status tracking, and structured rejection feedback modals.
* **Workload Allocation**: Assign educators to specific curriculum courses and class section groups.

### 🛡️ 3. Executive Admin Authority Console
* **System Metrics Dashboard**: Real-time financial volume tracking in Ethiopian Birr (`ETB`), active student ratios, and tutor metrics.
* **Role-Based Access Control (RBAC)**: Fine-grained permissions matrix across Super Admin, Admin, Certified Teacher, and Student/Parent roles.
* **Payment Clearinghouse & Approvals**: Student tuition fee verification, bank receipt upload checking, and automated invoice approval workflows.
* **Faculty Payroll System**: Automatic salary computation based on verified attendance records, hourly rates, and home visit travel allowances.

### 📊 4. Academic Assessments & Gradebook Matrix
* **MoE Curriculum Weighted Gradebook**: Automated calculation model:
  $$\text{Final Grade} = 30\% \text{ Homework} + 30\% \text{ Quizzes/Labs} + 40\% \text{ Midterm/Exam}$$
* **Interactive Testing Engine**: Online timed quizzes with auto-grading, question banks, and instant score reports.
* **Digital Certificate Authority**: Automated 3-month course completion diploma generation and 1-year educator service awards with SHA-256 verification and vector QR codes.

### 📷 5. Biometric & QR Attendance Telemetry
* **Face ID & Liveness Verification**: Biometric face detection using `@vladmandic/face-api`.
* **QR Code Scanner**: Fast mobile QR check-ins for home visit and classroom attendance.
* **Telemetry Scoreboards**: Comprehensive daily attendance logs, presence rates, tardiness tracking, and monthly reporting.

---

## 🏛️ System Architecture

```mermaid
graph TD
    User([User / Browser]) <--> AngularFrontend[Angular 22 Client<br/>Standalone Components & Signals]
    AngularFrontend <--> REST_API[ASP.NET Core Web API<br/>Clean Architecture & MediatR]
    REST_API <--> DB[(SQL Server / Entity Framework Core)]
    REST_API <--> FaceAPI[Face-API & Biometric Engine]
    REST_API <--> CertificateEngine[PDF & Certificate Generator]
```

---

## 💻 Tech Stack

| Layer | Technologies & Tools |
| :--- | :--- |
| **Frontend** | Angular 22, TypeScript 6.0, RxJS, Signals, Modern SCSS |
| **Backend** | .NET 8.0 C#, ASP.NET Core Web API, Entity Framework Core, MediatR |
| **Biometrics & PDF** | `@vladmandic/face-api`, `html2canvas`, `jsPDF`, `qrcode` |
| **Database** | Microsoft SQL Server |
| **Design System** | Google Material Symbols, Custom Tokens, Responsive Layouts |
| **Currency** | Ethiopian Birr (`ETB`) |

---

## 🛠️ Installation & Local Setup

### Prerequisites
* **Node.js**: `v20.x` or higher
* **npm**: `v10.x` or higher
* **.NET SDK**: `8.0`
* **SQL Server**: 2019+ or LocalDB

### 1. Backend Setup (.NET API)
```bash
# Navigate to backend directory
cd backend/BrightTutor.Api

# Restore dependencies & apply database migrations
dotnet restore
dotnet ef database update

# Run backend API server
dotnet run
```
> Server will start at `http://localhost:5198`.

### 2. Frontend Setup (Angular Client)
```bash
# Navigate to client directory
cd frontend/brighttutor-client

# Install dependencies
npm install

# Launch Angular development server
npm start
```
> Client portal will be accessible at `http://localhost:4200`.

---

## 📜 License & Copyright

Designed and developed for **BrightTutor Academy** & MoE Secondary STEM Program.  
All Rights Reserved © 2026.
