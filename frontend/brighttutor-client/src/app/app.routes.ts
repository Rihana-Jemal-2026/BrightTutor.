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
  { path: "", redirectTo: "mark-group-attendance", pathMatch: "full" },
];