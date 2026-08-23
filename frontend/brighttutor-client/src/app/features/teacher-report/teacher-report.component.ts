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
  selector: "app-teacher-report",
  standalone: true,
  imports: [CommonModule, FormsModule, SearchableSelectComponent],
  templateUrl: "./teacher-report.component.html",
  styleUrl: "./teacher-report.component.scss",
})
export class TeacherReportComponent implements OnInit {
  private api = inject(AttendanceService);
  private userService = inject(UserService);
  public authService = inject(AuthService);

  teacherOptions = signal<SelectOption[]>([]);
  teacherId = signal("");
  startDate = signal("2026-08-01");
  endDate = signal(new Date().toISOString().slice(0, 10));

  reportResource = rxResource<any | null, unknown>({
    stream: () => {
      const id = this.teacherId();
      if (!id) return of(null);
      return this.api.getTeacherReport(id, this.startDate(), this.endDate());
    },
  });

  ngOnInit() {
    const user = this.authService.currentUser();

    if (this.authService.isTeacher() && user) {
      this.teacherId.set(user.userId);
      this.teacherOptions.set([{
        id: user.userId,
        name: `${user.firstName} ${user.lastName}`,
        subtext: user.email
      }]);
    } else {
      this.userService.getUsers(2).subscribe({
        next: (teachers) => {
          const opts = teachers.map(t => ({
            id: t.id,
            name: `${t.firstName} ${t.lastName}`,
            subtext: t.email
          }));
          this.teacherOptions.set(opts);
          if (opts.length > 0) {
            this.teacherId.set(opts[0].id);
          }
        }
      });
    }
  }

  onTeacherSelected(teacherId: string) {
    this.teacherId.set(teacherId);
    this.search();
  }

  search() {
    this.reportResource.reload();
  }
}