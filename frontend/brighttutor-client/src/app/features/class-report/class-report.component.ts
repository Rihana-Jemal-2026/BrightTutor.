import { Component, inject, signal, OnInit } from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { of } from "rxjs";
import { AttendanceService } from "../../services/attendance.service";
import { CourseService } from "../../services/course.service";
import { TeacherAssignmentService } from "../../services/teacher-assignment.service";
import { AuthService } from "../../services/auth.service";
import { ClassAttendanceReport } from "../../models/attendance.model";
import { SearchableSelectComponent, SelectOption } from "../../components/searchable-select/searchable-select.component";

@Component({
  selector: "app-class-report",
  standalone: true,
  imports: [CommonModule, FormsModule, SearchableSelectComponent],
  templateUrl: "./class-report.component.html",
  styleUrl: "./class-report.component.scss",
})
export class ClassReportComponent implements OnInit {
  private api = inject(AttendanceService);
  private courseService = inject(CourseService);
  private teacherAssignmentService = inject(TeacherAssignmentService);
  public authService = inject(AuthService);

  groupOptions = signal<SelectOption[]>([]);
  classGroupId = signal("");
  startDate = signal("2026-08-01");
  endDate = signal(new Date().toISOString().slice(0, 10));
  noAssignedClasses = signal(false);

  reportResource = rxResource<ClassAttendanceReport, unknown>({
    stream: () => {
      const user = this.authService.currentUser();
      const teacherId = this.authService.isTeacher() && user ? user.userId : undefined;

      if (this.authService.isTeacher() && this.noAssignedClasses()) {
        return of({
          classGroupId: '',
          classGroupName: 'No Assigned Classes',
          startDate: this.startDate(),
          endDate: this.endDate(),
          totalSessions: 0,
          totalRecords: 0,
          presentCount: 0,
          absentCount: 0,
          lateCount: 0,
          excusedCount: 0,
          overallAttendancePercentage: 0,
          studentBreakdown: []
        });
      }

      return this.api.getClassReport(this.classGroupId(), this.startDate(), this.endDate(), teacherId);
    },
  });

  ngOnInit(): void {
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
            { id: '', name: '🌟 All Classes & Attendance Modes (Group, Online & Home)', subtext: 'Comprehensive report' },
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

  onGroupSelected(groupId: string): void {
    this.classGroupId.set(groupId);
    this.search();
  }

  search(): void {
    this.reportResource.reload();
  }
}