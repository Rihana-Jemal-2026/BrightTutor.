import { Component, inject, signal, OnInit } from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import { of } from "rxjs";
import { AttendanceService } from "../../services/attendance.service";
import { UserService } from "../../services/user.service";
import { AuthService } from "../../services/auth.service";
import { StudentAttendanceSummary } from "../../models/attendance.model";
import { SearchableSelectComponent, SelectOption } from "../../components/searchable-select/searchable-select.component";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-student-summary",
  standalone: true,
  imports: [CommonModule, FormsModule, SearchableSelectComponent],
  templateUrl: "./student-summary.component.html",
  styleUrl: "./student-summary.component.scss",
})
export class StudentSummaryComponent implements OnInit {
  private api = inject(AttendanceService);
  private userService = inject(UserService);
  public authService = inject(AuthService);

  studentOptions = signal<SelectOption[]>([]);
  studentId = signal("");
  startDate = signal("2026-08-01");
  endDate = signal(new Date().toISOString().slice(0, 10));

  summaryResource = rxResource<StudentAttendanceSummary | null, unknown>({
    stream: () => {
      const id = this.studentId();
      if (!id) return of(null);
      return this.api.getStudentSummary(id, this.startDate(), this.endDate());
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
    this.summaryResource.reload();
  }
}