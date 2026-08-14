import { Component, inject, signal } from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import { AttendanceService } from "../../services/attendance.service";

@Component({
  selector: "app-student-calendar",
  standalone: true,
  imports: [FormsModule],
  templateUrl: "./student-calendar.component.html",
  styleUrl: "./student-calendar.component.scss",
})
export class StudentCalendarComponent {
  private api = inject(AttendanceService);

  studentId = signal("33333333-3333-3333-3333-333333333333");
  year = signal(2026);
  month = signal(8);

  statusLabels: Record<number, string> = { 0: "Present", 1: "Absent", 2: "Late", 3: "Excused" };
  typeLabels: Record<number, string> = { 0: "Online", 1: "Group", 2: "Home" };

  calendarResource = rxResource<any[], unknown>({
    stream: () => this.api.getStudentCalendar(this.studentId(), this.year(), this.month()),
  });

  search() {
    this.calendarResource.reload();
  }
}