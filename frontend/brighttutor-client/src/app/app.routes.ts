import { Routes } from "@angular/router";

export const routes: Routes = [
  {
    path: "mark-group-attendance",
    loadComponent: () =>
      import("./features/mark-group-attendance/mark-group-attendance.component").then(
        (m) => m.MarkGroupAttendanceComponent
      ),
  },
  { path: "", redirectTo: "mark-group-attendance", pathMatch: "full" },
];