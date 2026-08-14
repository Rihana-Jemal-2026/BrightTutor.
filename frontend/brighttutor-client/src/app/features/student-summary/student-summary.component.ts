import { Component, inject, signal } from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import { AttendanceService } from "../../services/attendance.service";
import { StudentAttendanceSummary } from "../../models/attendance.model";

@Component({
  selector: "app-student-summary",
  standalone: true,
  imports: [FormsModule],
  templateUrl: "./student-summary.component.html",
  styleUrl: "./student-summary.component.scss",
})
export class StudentSummaryComponent {
  private api = inject(AttendanceService);

  studentId = signal("33333333-3333-3333-3333-333333333333");
  startDate = signal("2026-08-01");
  endDate = signal(new Date().toISOString().slice(0, 10));

  summaryResource = rxResource<StudentAttendanceSummary, unknown>({
    stream: () => this.api.getStudentSummary(this.studentId(), this.startDate(), this.endDate()),
  });

  search() {
    this.summaryResource.reload();
  }
}