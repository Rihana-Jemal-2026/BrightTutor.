import { Component, inject, computed, signal, OnInit } from "@angular/core";
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

  filtersTouched = signal(false);
  optionsError = signal('');
  canSearch = computed(() => Number.isInteger(this.year()) && this.year() >= 1 && this.year() <= 9999 && Number.isInteger(this.month()) && this.month() >= 1 && this.month() <= 12 && !!this.studentId() && !this.optionsError());

  calendarResource = rxResource({
    params: () => this.filtersTouched() && this.canSearch() ? { studentId: this.studentId(), year: this.year(), month: this.month() } : undefined,
    stream: ({ params }) => this.api.getStudentCalendar(params.studentId, params.year, params.month),
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
        },
        error: () => this.optionsError.set('Could not load filter choices. Refresh the page to try again.')
      });
    }
  }

  onStudentSelected(id: string): void {
    this.studentId.set(id);
    this.filtersTouched.set(true);

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
    if (!this.canSearch()) return;
    if (this.filtersTouched()) this.calendarResource.reload();
    else this.filtersTouched.set(true);
  }
}