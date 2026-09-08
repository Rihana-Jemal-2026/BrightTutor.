# 🎓 BrightTutor Academic Portal

> **Comprehensive Ethiopian K-12 STEM Academic Management & Tutoring Clearinghouse Platform**

[![Angular](https://img.shields.io/badge/Angular-22.1-dd0031.svg?style=for-the-badge&logo=angular)](https://angular.dev/)
[![.NET Core](https://img.shields.io/badge/.NET_Core-8.0-512bd4.svg?style=for-the-badge&logo=dotnet)](https://dotnet.microsoft.com/)
[![Clean Architecture](https://img.shields.io/badge/Architecture-Clean_Architecture-blue.svg?style=for-the-badge)](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Production_Ready-006948.svg?style=for-the-badge)](https://github.com/Rihana-Jemal-2026/BrightTutor)

---

## 📌 Executive Overview

**BrightTutor** is a state-of-the-art educational management portal engineered for Ethiopian secondary STEM cohorts, home tutoring networks, and institutional academic governance. Built directly in alignment with Ministry of Education (MoE) curriculum standards, BrightTutor streamlines candidate admissions, facial biometric attendance, automated QR check-ins, automated ETB payroll clearing, weighted academic gradebooks, and digital certificate verification.

---

## 📸 Complete Visual Tour & Page Screenshots

### 1. Portal Authentication & Account Login
The central gateway for Students, Teachers, Parents, and Administrators to access their role-specific dashboards using registered email addresses or student ID codes (`#STU-XXXXXX`).

![Account Login Portal](docs/screenshots/media_1788901345528.png)
*Figure 1.1: BrightTutor Portal Authentication Card supporting Email or Student ID Code login.*

---

### 2. Student Self-Registration & Course Enrollment Form
The Student Admission Portal enables Grade 9-12 STEM candidates across Ethiopia to register online, set their home address with GPS mapping, select learning delivery methods (Home Visit 1-on-1, Live Online Classes, or Group Cohorts), choose custom subjects, and request preferred learning days/hours.

![Student Admission Form - Candidate Info](docs/screenshots/media_1788901345549.png)
*Figure 2.1: Student Course Enrollment Form capturing personal details, Ethiopian (+251) phone number, GPS village location, and service delivery method.*

![Student Admission Form - Schedule Request](docs/screenshots/media_1788901345623.png)
*Figure 2.2: Course catalog selector, custom subject request field, and interactive learning days/hours picker (Mon, Wed, Fri 10:00 AM - 12:00 PM).*

![Student Registration Confirmation](docs/screenshots/media_1788813598065.png)
*Figure 2.3: Instant admission confirmation modal with generated student ID code and portal credentials.*

---

### 3. Educator Job Application & Screening Portal
Educator onboarding and screening workflow capturing academic qualifications, specialization subjects, degree uploads, CV documents, and background check statuses.

![Educator Job Application - Personal Details](docs/screenshots/media_1788901345579.png)
*Figure 3.1: Educator Application Form capturing full name, email, Ethiopian (+251) contact number, primary specialization, and years of experience.*

![Educator Job Application - CV & Bio Upload](docs/screenshots/media_1788901345632.png)
*Figure 3.2: CV / Resume document upload portal and professional teaching methodology bio summary.*

![Teacher Application Qualifications](docs/screenshots/media_1788812392593.png)
*Figure 3.3: Subject specialization selector, tutoring service preferences, and wage expectations.*

---

### 4. Executive System Authority Console (Admin Portal)
Central administrative command center providing real-time telemetry over system metrics, user account governance, course catalog management, student enrollment rosters, faculty allocations, class schedules, and campus announcements.

![Executive Admin Dashboard Telemetry](docs/screenshots/media_1788901495077.png)
*Figure 4.1: Executive Admin Dashboard displaying real-time system metrics (5 System Users, 2 Active Students, 2 Registered Teachers, 22 Active Courses), Academic Certificate Management launcher, and Campus Announcements Bulletin.*

![System Users Management Table](docs/screenshots/media_1788901495125.png)
*Figure 4.2: System Users Management interface listing accounts (Teachers, Students, Parents), Ethiopian (+251) phone contacts, active statuses, and account pause/edit actions.*

![Course Group & Class Management Catalog](docs/screenshots/media_1788901495153.png)
*Figure 4.3: Course & Class Management catalog managing Grade 12 National Exam Prep, Grade 8 Prep, Grade 6 Prep, KG-University Regular Tutoring, and Online 1-on-1 tutoring sessions.*

![Student Enrollments Management Console](docs/screenshots/media_1788901495168.png)
*Figure 4.4: Student Enrollments Management interface assigning registered candidates (seid Jemal #STU-000002, emran Jemal #STU-000001) to courses such as Artificial Intelligence & Machine Learning.*

![Teacher Course & Group Allocations Matrix](docs/screenshots/media_1788901495286.png)
*Figure 4.5: Teacher Course & Group Allocations matrix matching faculty members (Rihana Jemal TCH-296506) to curriculum courses and custom subject specializations.*

![Campus Announcements & Notifications](docs/screenshots/media_1788901803944.png)
*Figure 4.6: Campus Announcements & Push Dispatcher console allowing admins to target notices to Teachers, Students, Parents, or All Users.*

![Class Schedules & Timetables Planner](docs/screenshots/media_1788901803970.png)
*Figure 4.7: Class Schedules & Timetables planner supporting session filtering by course, class group, assigned teacher, and status.*

---

### 5. Student Portal & Learning Dashboard
Personalized student portal giving learners access to their enrolled courses, daily class schedules, assignment submissions, attendance history, and grade reports.

![Student Dashboard Portal](docs/screenshots/media_1788813785440.png)
*Figure 5.1: Student Portal Overview featuring upcoming class notifications, active courses, and tutor details.*

![Student Learning Telemetry](docs/screenshots/media_1788814116108.png)
*Figure 5.2: Course progress tracker, lesson completion stats, and downloadable study materials.*

---

### 6. Teacher Portal & Classroom Management Console
Dedicated workspace for tutors to manage assigned student cohorts, record lesson progress, mark attendance, conduct online quizzes, and enter weighted grades.

![Teacher Dashboard Console](docs/screenshots/media_1788814426930.png)
*Figure 6.1: Teacher Dashboard displaying active class rosters, student attendance metrics, and quick gradebook entry.*

---

### 7. Academic Assessments & Gradebook Matrix
Automated MoE weighted gradebook engine supporting quiz administration, assignment grading, midterms, and final exam calculations.

![Homework, Tests, Gradebook & Certification Console](docs/screenshots/media_1788902531060.png)
*Figure 7.1: Homework, Tests, Gradebook & Certification Console supporting test creation, course tasks filtering, master gradebook matrix, and final course grading.*

![Assessments & Gradebook Matrix](docs/screenshots/media_1788814348369.png)
*Figure 7.2: Academic Assessment Gradebook with MoE weighted formula calculation and export capabilities.*

---

### 8. Digital Certificate Authority & Accreditation
High-resolution vector diploma generation for 3-month course completion and 1-year tutor service awards, equipped with SHA-256 cryptographic hashes and verification QR codes.

![Digital Certificate Authority](docs/screenshots/media_1788814775781.png)
*Figure 8.1: Official 3-month completion diploma with security border, signature authorization, and vector QR code.*

![Certificate Verification Details](docs/screenshots/media_1788814775803.png)
*Figure 8.2: Public verification modal validating certificate authenticity, recipient identity, and issue timestamp.*

---

### 9. Attendance Telemetry & Biometric System
Multi-modal attendance system supporting Group Roster Attendance, Teacher Staff Attendance, 1-on-1 Online Session Attendance, Home Tutoring GPS Verification, and AI Facial Biometric Scanner.

![Facial Biometric & Camera Check-In](docs/screenshots/media_1788902206942.png)
*Figure 9.1: AI-powered facial biometric scanner with live camera alignment oval, master face ID enrollment, and token nonce verification.*

![Classroom Projector Display QR Code](docs/screenshots/media_1788902206857.png)
*Figure 9.2: Classroom Projector Display & Live Roll Call mode displaying dynamic QR tokens for instant student mobile check-ins.*

![Home Tutoring Visit Check-In & GPS Verification](docs/screenshots/media_1788902206831.png)
*Figure 9.3: Home Tutoring Visit Check-In & Check-Out module with live GPS coordinate recording (Lat: 8.9983, Long: 38.7039).*

![Mark Group Attendance Interface](docs/screenshots/media_1788901803996.png)
*Figure 9.4: Mark Group Attendance roster tool with assigned teacher selection, session date picker, and 1-click bulk marking.*

![Mark Teacher Staff Attendance Interface](docs/screenshots/media_1788901804047.png)
*Figure 9.5: Mark Teacher Staff Attendance form recording daily check-in/out times, presence status (Present/Absent/Late/Excused), and observer notes.*

![Mark 1-on-1 Online Attendance Interface](docs/screenshots/media_1788901804060.png)
*Figure 9.6: Mark 1-on-1 Online Tutoring Attendance form tracking private video session dates and student presence.*

![View Attendance History Records](docs/screenshots/media_1788902206943.png)
*Figure 9.7: View Attendance History Records console filtering across Group, Online, and Home Tutoring sessions.*

![Class Attendance Analytical Reports](docs/screenshots/media_1788902206880.png)
*Figure 9.8: Class Attendance Analytical Reports interface with custom date range filtering and presence summary metrics.*

![Student Attendance Summary Report](docs/screenshots/media_1788902530941.png)
*Figure 9.9: Student Attendance Summary Report interface providing date range filtering for individual learner telemetry.*

![Teacher Staff Attendance Summary Report](docs/screenshots/media_1788902530970.png)
*Figure 9.10: Teacher Staff Attendance Summary Report tracking individual educator attendance records over specified date ranges.*

![Student Attendance Calendar View](docs/screenshots/media_1788902530996.png)
*Figure 9.11: Student Attendance Calendar View providing monthly visual attendance heatmaps by year and month.*

![Daily Attendance Overview Dashboard](docs/screenshots/media_1788902531045.png)
*Figure 9.12: Daily Attendance Overview Dashboard summarizing campus-wide presence and absence telemetry for any selected date.*

![Financial Clearinghouse Console](docs/screenshots/media_1788719490468.png)
*Figure 9.13: Ethiopian Birr (ETB) tuition payment clearinghouse, bank slip verification, and automated invoice approval.*

---

## 🏛️ System Architecture & Clean Architecture Directory Structure

### High-Level Component Flow
```mermaid
graph TD
    User([User / Browser]) <--> AngularFrontend[Angular 22 Client<br/>Standalone Components & Signals]
    AngularFrontend <--> REST_API[ASP.NET Core Web API<br/>Clean Architecture & MediatR]
    REST_API <--> DB[(PostgreSQL / Entity Framework Core)]
    REST_API <--> FaceAPI[Face-API & Biometric Engine]
    REST_API <--> CertificateEngine[PDF & Certificate Generator]
```

### Backend Clean Architecture Directory Structure
The backend repository is organized following strict **Clean Architecture** separation of concerns:

```
backend/
├── BrightTutor.slnx
├── src/
│   ├── BrightTutor.Api/                # Presentation Layer (Controllers, Middleware, Swagger)
│   ├── BrightTutor.Application/        # Application Layer (CQRS Commands, Queries, MediatR, DTOs)
│   ├── BrightTutor.Domain/             # Domain Layer (Entities, Enums, Value Objects, Domain Logic)
│   ├── BrightTutor.Infrastructure/     # Infrastructure Layer (EF Core DbContext, Auth, Migrations)
│   └── BrightTutor.LivenessChecks/     # System Health Telemetry & Diagnostic Probes
└── tests/
    ├── BrightTutor.UnitTests/          # xUnit Domain & Application Unit Tests
    └── BrightTutor.IntegrationTests/   # xUnit API Controller & Infrastructure Integration Tests
```

---

## 💻 Technology Stack

| Layer | Technologies & Tools |
| :--- | :--- |
| **Frontend Framework** | Angular 22, TypeScript 6.0, RxJS, Angular Signals, Modern SCSS |
| **Backend Architecture** | .NET 8.0 C#, ASP.NET Core Web API, Clean Architecture, MediatR (CQRS) |
| **Data Persistence** | Entity Framework Core 8.0, PostgreSQL |
| **Biometrics & Rendering** | `@vladmandic/face-api`, `html2canvas`, `jsPDF`, `qrcode` |
| **Testing Suite** | xUnit, Microsoft.NET.Test.Sdk, Coverlet |
| **Design System** | Google Material Symbols Outlined, Custom CSS Tokens, Glassmorphism |
| **Financial Clearing** | Ethiopian Birr (`ETB`) |

---

## 🛠️ Installation & Local Setup

### Prerequisites
* **Node.js**: `v20.x` or higher
* **npm**: `v10.x` or higher
* **.NET SDK**: `8.0` / `10.0`
* **PostgreSQL / SQL Database**: Running instance configured in `appsettings.json`

### 1. Backend Setup (.NET Core API)
```bash
# Navigate to backend folder
cd backend

# Restore dependencies across all Clean Architecture projects
dotnet restore

# Build backend solution
dotnet build

# Run unit and integration tests
dotnet test

# Launch API server
cd src/BrightTutor.Api
dotnet run
```
> Server will start at `http://localhost:5198` (Swagger UI available at `http://localhost:5198`).

### 2. Frontend Setup (Angular Client)
```bash
# Navigate to frontend client folder
cd frontend/brighttutor-client

# Install frontend packages
npm install

# Start Angular dev server
npm start
```
> Portal will be accessible at `http://localhost:4200`.

---

## 📜 License & Copyright

Designed and developed for **BrightTutor Academy** & MoE Secondary STEM Program.  
All Rights Reserved © 2026.
