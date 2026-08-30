import { Component, inject, signal, OnInit } from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import { CommonModule, DatePipe } from "@angular/common";
import { AttendanceService } from "../../services/attendance.service";
import { UserService } from "../../services/user.service";
import { AuthService } from "../../services/auth.service";
import { SearchableSelectComponent, SelectOption } from "../../components/searchable-select/searchable-select.component";

@Component({
  selector: "app-student-calendar",
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, SearchableSelectComponent],
  templateUrl: "./student-calendar.component.html",
  styleUrl: "./student-calendar.component.scss",
})
export class StudentCalendarComponent implements OnInit {
  private api = inject(AttendanceService);
  private userService = inject(UserService);
  public authService = inject(AuthService);

  studentOptions = signal<SelectOption[]>([]);
  studentId = signal<string>("");
  year = signal<number>(new Date().getFullYear());
  month = signal<number>(new Date().getMonth() + 1);

  statusLabels: Record<number, string> = { 0: "Present", 1: "Absent", 2: "Late", 3: "Excused" };
  typeLabels: Record<number, string> = { 0: "Online", 1: "Group", 2: "Home" };

  calendarResource = rxResource<any[], unknown>({
    stream: () => this.api.getStudentCalendar(this.studentId(), this.year(), this.month()),
  });

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (this.authService.isStudent() && user) {
      this.studentId.set(user.userId);
      this.studentOptions.set([{
        id: user.userId,
        name: `${user.firstName} ${user.lastName}`,
        subtext: user.email
      }]);
    } else {
      this.userService.getUsers(3).subscribe({
        next: (students) => {
          const opts = students.map(s => ({
            id: s.id,
            name: `${s.firstName} ${s.lastName}`,
            subtext: s.email
          }));
          this.studentOptions.set(opts);
          if (opts.length > 0) {
            this.studentId.set(opts[0].id);
          }
        }
      });
    }
  }

  onStudentSelected(id: string): void {
    this.studentId.set(id);
    this.search();
  }

  getTypeLabel(type: number): string {
    return this.typeLabels[type] || "General";
  }

  getStatusLabel(status: number): string {
    return this.statusLabels[status] || "Unknown";
  }

  getStatusClass(status: number): string {
    if (status === 0) return "present";
    if (status === 1) return "absent";
    if (status === 2) return "late";
    if (status === 3) return "excused";
    return "";
  }

  search(): void {
    this.calendarResource.reload();
  }
}