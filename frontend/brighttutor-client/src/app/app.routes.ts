import { Routes } from "@angular/router";

export const routes: Routes = [
  { path: "login", loadComponent: () => import("./features/auth/login.component").then((m) => m.LoginComponent) },
  { path: "dashboard", loadComponent: () => import("./features/dashboard/dashboard.component").then((m) => m.DashboardComponent) },
  { path: "users", loadComponent: () => import("./features/users/users.component").then((m) => m.UsersComponent) },
  { path: "courses", loadComponent: () => import("./features/courses/courses.component").then((m) => m.CoursesComponent) },
  { path: "enrollments", loadComponent: () => import("./features/enrollments/enrollments.component").then((m) => m.EnrollmentsComponent) },
  { path: "teacher-assignments", loadComponent: () => import("./features/teacher-assignments/teacher-assignments.component").then((m) => m.TeacherAssignmentsComponent) },
  { path: "schedules", loadComponent: () => import("./features/schedules/schedules.component").then((m) => m.SchedulesComponent) },
  { path: "announcements", loadComponent: () => import("./features/announcements/announcements.component").then((m) => m.AnnouncementsComponent) },
  { path: "permissions", loadComponent: () => import("./features/permissions/permissions.component").then((m) => m.PermissionsComponent) },

  // Attendance Features
  { path: "mark-group-attendance", loadComponent: () => import("./features/mark-group-attendance/mark-group-attendance.component").then((m) => m.MarkGroupAttendanceComponent) },
  { path: "view-group-attendance", loadComponent: () => import("./features/view-group-attendance/view-group-attendance.component").then((m) => m.ViewGroupAttendanceComponent) },
  { path: "class-report", loadComponent: () => import("./features/class-report/class-report.component").then((m) => m.ClassReportComponent) },
  { path: "mark-teacher-attendance", loadComponent: () => import("./features/mark-teacher-attendance/mark-teacher-attendance.component").then((m) => m.MarkTeacherAttendanceComponent) },
  { path: "mark-online-attendance", loadComponent: () => import("./features/mark-online-attendance/mark-online-attendance.component").then((m) => m.MarkOnlineAttendanceComponent) },
  { path: "home-attendance", loadComponent: () => import("./features/home-attendance/home-attendance.component").then((m) => m.HomeAttendanceComponent) },
  { path: "student-summary", loadComponent: () => import("./features/student-summary/student-summary.component").then((m) => m.StudentSummaryComponent) },
  { path: "teacher-report", loadComponent: () => import("./features/teacher-report/teacher-report.component").then((m) => m.TeacherReportComponent) },
  { path: "student-calendar", loadComponent: () => import("./features/student-calendar/student-calendar.component").then((m) => m.StudentCalendarComponent) },
  { path: "daily-overview", loadComponent: () => import("./features/daily-overview/daily-overview.component").then((m) => m.DailyOverviewComponent) },
  { path: "admin-actions", loadComponent: () => import("./features/admin-actions/admin-actions.component").then((m) => m.AdminActionsComponent) },
  { path: "payroll", loadComponent: () => import("./features/payroll/payroll.component").then((m) => m.PayrollComponent) },

  // BrightTutor v2.0 Next-Gen Modules
  { path: "student-register", loadComponent: () => import("./features/student-register/student-register.component").then((m) => m.StudentRegisterComponent) },
  { path: "payment-approvals", loadComponent: () => import("./features/payment-approvals/payment-approvals.component").then((m) => m.PaymentApprovalsComponent) },
  { path: "teacher-apply", loadComponent: () => import("./features/teacher-apply/teacher-apply.component").then((m) => m.TeacherApplyComponent) },
  { path: "teacher-screening", loadComponent: () => import("./features/teacher-screening/teacher-screening.component").then((m) => m.TeacherScreeningComponent) },
  { path: "qr-attendance", loadComponent: () => import("./features/qr-attendance/qr-attendance.component").then((m) => m.QrAttendanceComponent) },
  { path: "certificates", loadComponent: () => import("./features/certificates/certificates.component").then((m) => m.CertificatesComponent) },

  { path: "", redirectTo: "login", pathMatch: "full" },
];