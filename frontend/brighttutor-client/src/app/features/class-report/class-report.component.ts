import { Component, inject, signal } from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import { AttendanceService } from "../../services/attendance.service";
import { ClassAttendanceReport } from "../../models/attendance.model";

@Component({
  selector: "app-class-report",
  standalone: true,
  imports: [FormsModule],
  templateUrl: "./class-report.component.html",
  styleUrl: "./class-report.component.scss",
})
export class ClassReportComponent {
  private api = inject(AttendanceService);

  classGroupId = signal("11111111-1111-1111-1111-111111111111");
  startDate = signal("2026-08-01");
  endDate = signal(new Date().toISOString().slice(0, 10));

  reportResource = rxResource<ClassAttendanceReport, unknown>({
    stream: () => this.api.getClassReport(this.classGroupId(), this.startDate(), this.endDate()),
  });

  search() {
    this.reportResource.reload();
  }
}