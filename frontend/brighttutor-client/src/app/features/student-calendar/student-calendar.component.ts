import { Component, inject, signal, OnInit } from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import { of } from "rxjs";
import { AttendanceService } from "../../services/attendance.service";
import { UserService } from "../../services/user.service";
import { AuthService } from "../../services/auth.service";
import { SearchableSelectComponent, SelectOption } from "../../components/searchable-select/searchable-select.component";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-student-calendar",
  standalone: true,
  imports: [CommonModule, FormsModule, SearchableSelectComponent],
  templateUrl: "./student-calendar.component.html",
  styleUrl: "./student-calendar.component.scss",
})
export class StudentCalendarComponent implements OnInit {
  private api = inject(AttendanceService);
  private userService = inject(UserService);
  public authService = inject(AuthService);

  studentOptions = signal<SelectOption[]>([]);
  studentId = signal("");
  year = signal(2026);
  month = signal(8);

  calendarResource = rxResource<any[], unknown>({
    stream: () => {
      const id = this.studentId();
      if (!id) return of([]);
      return this.api.getStudentCalendar(id, this.year(), this.month());
    },
  });

  ngOnInit() {
    const user = this.authService.currentUser();

    if (this.authService.isStudent() && user) {
      this.studentId.set(user.userId);
      this.studentOptions.set([{
        id: user.userId,
        name: `${user.firstName} ${user.lastName}`,
        subtext: user.email
      }]);
      this.search();
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
            this.search();
          }
        }
      });
    }
  }

  onStudentSelected(studentId: string) {
    this.studentId.set(studentId);
    this.search();
  }

  search() {
    this.calendarResource.reload();
  }

  getStatusLabel(status: any): string {
    const s = String(status).toLowerCase();
    if (s === '0' || s === 'present') return 'Present';
    if (s === '1' || s === 'absent') return 'Absent';
    if (s === '2' || s === 'late') return 'Late';
    if (s === '3' || s === 'excused') return 'Excused';
    return 'Present';
  }

  getStatusClass(status: any): string {
    const s = String(status).toLowerCase();
    if (s === '0' || s === 'present') return 'present';
    if (s === '1' || s === 'absent') return 'absent';
    if (s === '2' || s === 'late') return 'late';
    if (s === '3' || s === 'excused') return 'excused';
    return 'present';
  }

  getTypeLabel(type: any): string {
    const t = String(type).toLowerCase();
    if (t === '0' || t === 'online') return 'Online';
    if (t === '1' || t === 'group') return 'Group';
    if (t === '2' || t === 'home') return 'Home Visit';
    return 'Group';
  }
}