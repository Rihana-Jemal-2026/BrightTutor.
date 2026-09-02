import { Component, inject, signal, OnInit } from "@angular/core";
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

  recordsResource = rxResource<GroupAttendanceRecord[], unknown>({
    stream: () => {
      const id = this.classGroupId();
      const currentUser = this.authService.currentUser();
      const teacherId = this.authService.isTeacher() && currentUser ? currentUser.userId : undefined;

      if (this.authService.isTeacher() && this.noAssignedClasses()) {
        return of([]);
      }

      return this.api.getGroupAttendance(id, this.attendanceDate(), teacherId).pipe(
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
            this.classGroupId.set(assignedOpts[0].id);
          } else {
            this.noAssignedClasses.set(true);
            this.groupOptions.set([]);
            this.classGroupId.set('');
          }
          this.search();
        },
        error: () => {
          this.noAssignedClasses.set(true);
          this.groupOptions.set([]);
          this.classGroupId.set('');
        }
      });
    } else {
      // Admin / SuperAdmin: See all classes and all modes
      this.courseService.getClassGroups().subscribe({
        next: (groups) => {
          const opts: SelectOption[] = [
            { id: '', name: '🌟 All Attendance Records (Group, Online & Home)', subtext: 'View all session modes' },
            ...groups.map(g => ({
              id: g.id,
              name: g.name,
              subtext: g.courseName
            }))
          ];
          this.groupOptions.set(opts);
          this.classGroupId.set('');
          this.search();
        }
      });
    }
  }

  onGroupSelected(groupId: string) {
    this.classGroupId.set(groupId);
    this.search();
  }

  search() {
    this.recordsResource.reload();
  }

  getTypeLabel(type?: number, groupName?: string): string {
    const name = groupName || '';
    if (type === 2 || name.toLowerCase().includes('online')) return '💻 1-on-1 Online';
    if (type === 3 || name.toLowerCase().includes('home')) return '🏠 Home Tutoring';
    if (type === 4) return '📱 Center QR Scan';
    return '👥 Group Class';
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