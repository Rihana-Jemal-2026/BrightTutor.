import { Component, inject, computed, signal, OnInit } from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import { of, map } from "rxjs";
import { AttendanceService } from "../../services/attendance.service";
import { CourseService } from "../../services/course.service";
import { TeacherAssignmentService } from "../../services/teacher-assignment.service";
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
  private teacherAssignmentService = inject(TeacherAssignmentService);
  public authService = inject(AuthService);

  groupOptions = signal<SelectOption[]>([]);
  classGroupId = signal("");
  attendanceDate = signal(new Date().toISOString().slice(0, 10));
  noAssignedClasses = signal(false);

  filtersTouched = signal(false);
  optionsError = signal('');
  canSearch = computed(() => !!this.attendanceDate() && !this.noAssignedClasses() && (!this.authService.isTeacher() || !!this.classGroupId()) && !this.optionsError());

  recordsResource = rxResource({
    params: () => this.filtersTouched() && this.canSearch() ? { classGroupId: this.classGroupId(), attendanceDate: this.attendanceDate() } : undefined,
    stream: ({ params }) => {
      const id = params.classGroupId;
      const currentUser = this.authService.currentUser();
      const teacherId = this.authService.isTeacher() && currentUser ? currentUser.userId : undefined;

      if (this.authService.isTeacher() && this.noAssignedClasses()) {
        return of([]);
      }

      return this.api.getGroupAttendance(id, params.attendanceDate, teacherId).pipe(
        map(records => {
          if (this.authService.isStudent() || this.authService.isParent()) {
            if (!currentUser) return records;
            return records.filter(r => 
              r.studentId === currentUser.userId || 
              r.studentName?.toLowerCase().includes(currentUser.firstName.toLowerCase())
            );
          }
          return records;
        })
      );
    },
  });

  ngOnInit() {
    const user = this.authService.currentUser();

    if (this.authService.isTeacher() && user) {
      // Filter ONLY assigned classes for Teacher role
      this.teacherAssignmentService.getTeacherAssignments(user.userId).subscribe({
        next: (assignments) => {
          const assignedGroupsMap = new Map<string, SelectOption>();
          assignments.forEach(a => {
            if (a.classGroupId) {
              assignedGroupsMap.set(a.classGroupId, {
                id: a.classGroupId,
                name: a.classGroupName || 'Assigned Group',
                subtext: a.courseName
              });
            }
          });

          const assignedOpts = Array.from(assignedGroupsMap.values());
          if (assignedOpts.length > 0) {
            this.noAssignedClasses.set(false);
            this.groupOptions.set(assignedOpts);
            this.classGroupId.set('');
          } else {
            this.noAssignedClasses.set(true);
            this.groupOptions.set([]);
            this.classGroupId.set('');
          }
        },
        error: () => { this.optionsError.set('Could not load class choices. Refresh the page to try again.'); }
      });
    } else {
      // Admin / SuperAdmin: See all classes and all modes
      this.courseService.getClassGroups().subscribe({
        next: (groups) => {
          const opts: SelectOption[] = [
            { id: '', name: ' All Attendance Records (Group, Online & Home)', subtext: 'View all session modes' },
            ...groups.map(g => ({
              id: g.id,
              name: g.name,
              subtext: g.courseName
            }))
          ];
          this.groupOptions.set(opts);
          this.classGroupId.set('');
        },
        error: () => this.optionsError.set('Could not load filter choices. Refresh the page to try again.')
      });
    }
  }

  onGroupSelected(groupId: string) {
    this.classGroupId.set(groupId);
    this.filtersTouched.set(true);
  }

  search() {
    if (!this.canSearch()) return;
    if (this.filtersTouched()) this.recordsResource.reload();
    else this.filtersTouched.set(true);
  }

  getTypeLabel(type?: number, groupName?: string): string {
    const name = groupName || '';
    if (type === 2 || name.toLowerCase().includes('online')) return ' 1-on-1 Online';
    if (type === 3 || name.toLowerCase().includes('home')) return ' Home Tutoring';
    if (type === 4) return ' Center QR Scan';
    return ' Group Class';
  }

  getTypeClass(type?: number, groupName?: string): string {
    const name = groupName || '';
    if (type === 2 || name.toLowerCase().includes('online')) return 'mode-online';
    if (type === 3 || name.toLowerCase().includes('home')) return 'mode-home';
    if (type === 4) return 'mode-qr';
    return 'mode-group';
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