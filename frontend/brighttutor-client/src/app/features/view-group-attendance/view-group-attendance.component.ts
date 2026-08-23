import { Component, inject, signal, OnInit } from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import { of, map } from "rxjs";
import { AttendanceService } from "../../services/attendance.service";
import { CourseService } from "../../services/course.service";
import { AuthService } from "../../services/auth.service";
import { GroupAttendanceRecord } from "../../models/attendance.model";
import { SearchableSelectComponent, SelectOption } from "../../components/searchable-select/searchable-select.component";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-view-group-attendance",
  standalone: true,
  imports: [CommonModule, FormsModule, SearchableSelectComponent],
  templateUrl: "./view-group-attendance.component.html",
  styleUrl: "./view-group-attendance.component.scss",
})
export class ViewGroupAttendanceComponent implements OnInit {
  private api = inject(AttendanceService);
  private courseService = inject(CourseService);
  public authService = inject(AuthService);

  groupOptions = signal<SelectOption[]>([]);
  classGroupId = signal("");
  attendanceDate = signal(new Date().toISOString().slice(0, 10));

  recordsResource = rxResource<GroupAttendanceRecord[], unknown>({
    stream: () => {
      const id = this.classGroupId();
      if (!id) return of([]);
      return this.api.getGroupAttendance(id, this.attendanceDate()).pipe(
        map(records => {
          if (this.authService.isStudent() || this.authService.isParent()) {
            const current = this.authService.currentUser();
            if (!current) return records;
            return records.filter(r => 
              r.studentId === current.userId || 
              r.studentName?.toLowerCase().includes(current.firstName.toLowerCase())
            );
          }
          return records;
        })
      );
    },
  });

  ngOnInit() {
    this.courseService.getClassGroups().subscribe({
      next: (groups) => {
        const opts = groups.map(g => ({
          id: g.id,
          name: g.name,
          subtext: g.courseName
        }));
        this.groupOptions.set(opts);
        if (opts.length > 0) {
          this.classGroupId.set(opts[0].id);
          this.search();
        }
      }
    });
  }

  onGroupSelected(groupId: string) {
    this.classGroupId.set(groupId);
    this.search();
  }

  search() {
    this.recordsResource.reload();
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
}