import { Routes } from "@angular/router";

export const routes: Routes = [
  {
    path: "mark-group-attendance",
    loadComponent: () =>
      import("./features/mark-group-attendance/mark-group-attendance.component").then(
        (m) => m.MarkGroupAttendanceComponent
      ),
  },
  {
    path: "view-group-attendance",
    loadComponent: () =>
      import("./features/view-group-attendance/view-group-attendance.component").then(
        (m) => m.ViewGroupAttendanceComponent
      ),
  },
  {
    path: "class-report",
    loadComponent: () =>
      import("./features/class-report/class-report.component").then((m) => m.ClassReportComponent),
  },
  {
    path: "mark-teacher-attendance",
    loadComponent: () =>
      import("./features/mark-teacher-attendance/mark-teacher-attendance.component").then(
        (m) => m.MarkTeacherAttendanceComponent
      ),
  },
  {
    path: "mark-online-attendance",
    loadComponent: () =>
      import("./features/mark-online-attendance/mark-online-attendance.component").then(
        (m) => m.MarkOnlineAttendanceComponent
      ),
  },
  {
    path: "home-attendance",
    loadComponent: () =>
      import("./features/home-attendance/home-attendance.component").then(
        (m) => m.HomeAttendanceComponent
      ),
  },
  { path: "", redirectTo: "mark-group-attendance", pathMatch: "full" },
];