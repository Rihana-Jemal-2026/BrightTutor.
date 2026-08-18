import { Component, inject, signal } from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import { AttendanceService } from "../../services/attendance.service";
import { AttendanceStatus, GroupAttendanceRecord } from "../../models/attendance.model";

@Component({
  selector: "app-view-group-attendance",
  standalone: true,
  imports: [FormsModule],
  templateUrl: "./view-group-attendance.component.html",
  styleUrl: "./view-group-attendance.component.scss",
})
export class ViewGroupAttendanceComponent {
  private api = inject(AttendanceService);

  classGroupId = signal("GRP-001");
  attendanceDate = signal(new Date().toISOString().slice(0, 10));

  statusLabels: Record<AttendanceStatus, string> = {
    [AttendanceStatus.Present]: "Present",
    [AttendanceStatus.Absent]: "Absent",
    [AttendanceStatus.Late]: "Late",
    [AttendanceStatus.Excused]: "Excused",
  };

  recordsResource = rxResource<GroupAttendanceRecord[], unknown>({
    stream: () => this.api.getGroupAttendance(this.classGroupId(), this.attendanceDate()),
  });

  search() {
    this.recordsResource.reload();
  }
}