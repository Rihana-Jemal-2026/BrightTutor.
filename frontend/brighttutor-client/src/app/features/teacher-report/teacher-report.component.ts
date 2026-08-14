import { Component, inject, signal } from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import { AttendanceService } from "../../services/attendance.service";

@Component({
  selector: "app-teacher-report",
  standalone: true,
  imports: [FormsModule],
  templateUrl: "./teacher-report.component.html",
  styleUrl: "./teacher-report.component.scss",
})
export class TeacherReportComponent {
  private api = inject(AttendanceService);

  teacherId = signal("22222222-2222-2222-2222-222222222222");
  startDate = signal("2026-08-01");
  endDate = signal(new Date().toISOString().slice(0, 10));

  reportResource = rxResource<any, unknown>({
    stream: () => this.api.getTeacherReport(this.teacherId(), this.startDate(), this.endDate()),
  });

  search() {
    this.reportResource.reload();
  }
}