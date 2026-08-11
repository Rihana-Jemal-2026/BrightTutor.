import { Component, inject, signal } from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import { AttendanceService } from "../../services/attendance.service";
import { AttendanceStatus } from "../../models/attendance.model";

@Component({
  selector: "app-view-group-attendance",
  standalone: true,
  imports: [FormsModule],
  templateUrl: "./view-group-attendance.component.html",
  styleUrl: "./view-group-attendance.component.scss",
})
export class ViewGroupAttendanceComponent {
  private api = inject(AttendanceService);

  classGroupId = signal("11111111-1111-1111-1111-111111111111");
  attendanceDate = signal(new Date().toISOString().slice(0, 10));

  statusLabels: Record<AttendanceStatus, string> = {
    [AttendanceStatus.Present]: "Present",
    [AttendanceStatus.Absent]: "Absent",
    [AttendanceStatus.Late]: "Late",
    [AttendanceStatus.Excused]: "Excused",
  };

  // rxResource re-runs the loader automatically whenever any signal read inside
  // it changes — so typing a new classGroupId or date automatically refetches.
  recordsResource = rxResource({
    loader: () => this.api.getGroupAttendance(this.classGroupId(), this.attendanceDate()),
  });

  search() {
    this.recordsResource.reload();
  }
}