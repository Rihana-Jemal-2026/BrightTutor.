\# Bright Tutor — Backend (Attendance Module)



C#/.NET backend for the Bright Tutor tutoring management system, built with Clean Architecture.

This part of the backend covers the \*\*Attendance module\*\*: Group, Teacher, Home, and Online attendance, plus reporting.



\## Tech Stack

\- .NET 10, ASP.NET Core Web API

\- PostgreSQL + EF Core (Npgsql)

\- MediatR (CQRS pattern)

\- AutoMapper

\- FluentValidation

\- Swagger / Swashbuckle



\## Project Structure (Clean Architecture)



\## Setup

1\. Install .NET SDK and PostgreSQL.

2\. Create a database (e.g. `brighttutor`) in pgAdmin or `psql`.

3\. Set your connection string in `BrightTutor.Api/appsettings.Development.json` (not committed to git):

```json

{

&#x20; "ConnectionStrings": {

&#x20;   "DefaultConnection": "Host=localhost;Port=5432;Database=brighttutor;Username=postgres;Password=YOUR\_PASSWORD"

&#x20; }

}

```

4\. Apply migrations:

```powershell

dotnet ef database update --project BrightTutor.Infrastructure --startup-project BrightTutor.Api

```

5\. Run the API:

```powershell

cd BrightTutor.Api

dotnet run

```

6\. Open `http://localhost:XXXX/swagger` (port shown in terminal) to test endpoints.



\## Attendance API Endpoints



| Method | Route | Purpose |

|---|---|---|

| POST | `/api/attendance/group` | Mark group attendance (batch, one call per class session) |

| GET | `/api/attendance/group` | View group attendance for a class + date |

| POST | `/api/attendance/teacher` | Mark teacher attendance |

| GET | `/api/attendance/teacher` | View teacher attendance for a date |

| POST | `/api/attendance/online` | Mark online attendance |

| GET | `/api/attendance/online` | View online attendance for a class + date |

| POST | `/api/attendance/home/checkin` | Home visit check-in (with GPS) |

| POST | `/api/attendance/home/checkout` | Home visit check-out |

| POST | `/api/attendance/home/verify` | Admin verifies a home visit's location |

| GET | `/api/attendance/home` | View home attendance for a student + date |

| PUT | `/api/attendance/{attendanceId}` | Correct/edit an existing attendance record |

| GET | `/api/attendance/student-summary` | Student's attendance totals + % over a date range |

| GET | `/api/attendance/class-report` | Class totals + per-student breakdown over a date range |

| GET | `/api/attendance/teacher-report` | Teacher's attendance totals + % over a date range |

| GET | `/api/attendance/student-calendar` | Day-by-day attendance for a student, one month |

| GET | `/api/attendance/daily-overview` | System-wide snapshot for one date (students + teachers) |



\## Known Integration Points (pending Admin Core)

`StudentId`, `TeacherId`, and `ClassGroupId` are currently plain GUIDs with no foreign key constraints, since `Student`, `Teacher`, `Course`, `ClassGroup`, and `Enrollment` entities belong to the Admin Core module (built separately). Once those tables exist, navigation properties and FK constraints should be added via a new migration.



\## Not Yet Implemented

\- Authentication/authorization (pending Admin Core Auth module)

\- `AttendanceLink` (temporary QR check-in — marked as later-phase in the original spec)

\- `OnlineAttendanceDetail` (join time/duration — Online attendance works without it)

\- Excel/CSV export

