import { Component, inject, signal, OnInit } from "@angular/core";
import { ReactiveFormsModule, FormBuilder, Validators } from "@angular/forms";
import { AttendanceService } from "../../services/attendance.service";
import { UserService } from "../../services/user.service";
import { CourseService } from "../../services/course.service";
import { AuthService } from "../../services/auth.service";
import { ToastService } from "../../services/toast.service";
import { AttendanceStatus } from "../../models/attendance.model";
import { SearchableSelectComponent, SelectOption } from "../../components/searchable-select/searchable-select.component";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-mark-online-attendance",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SearchableSelectComponent],
  templateUrl: "./mark-online-attendance.component.html",
  styleUrl: "./mark-online-attendance.component.scss",
})
export class MarkOnlineAttendanceComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(AttendanceService);
  private userService = inject(UserService);
  private courseService = inject(CourseService);
  public authService = inject(AuthService);
  private toast = inject(ToastService);

  readonly AttendanceStatus = AttendanceStatus;

  studentOptions = signal<SelectOption[]>([]);
  teacherOptions = signal<SelectOption[]>([]);
  groupOptions = signal<SelectOption[]>([]);

  selectedStudentId = signal<string>('');
  selectedTeacherId = signal<string>('');
  selectedGroupId = signal<string>('');

  resultMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  form = this.fb.group({
    studentId: ["", Validators.required],
    teacherId: ["", Validators.required],
    classGroupId: [""],
    attendanceDate: [new Date().toISOString().split("T")[0], Validators.required],
    status: [AttendanceStatus.Present, Validators.required],
    notes: [""],
  });

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    // Fetch Students (Role 3 = Student)
    this.userService.getUsers(3).subscribe({
      next: (students) => {
        const opts = students.map(s => ({
          id: s.id,
          name: `${s.firstName} ${s.lastName}`,
          subtext: s.email
        }));
        this.studentOptions.set(opts);
        if (opts.length > 0) this.onStudentSelected(opts[0].id);
      }
    });

    const user = this.authService.currentUser();
    if (this.authService.isTeacher() && user) {
      this.selectedTeacherId.set(user.userId);
      this.form.patchValue({ teacherId: user.userId });
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
          if (opts.length > 0) this.onTeacherSelected(opts[0].id);
        }
      });
    }

    // Fetch Class Groups
    this.courseService.getClassGroups().subscribe({
      next: (groups) => {
        const opts = groups.map(g => ({
          id: g.id,
          name: g.name,
          subtext: g.courseName
        }));
        this.groupOptions.set(opts);
        if (opts.length > 0) this.onGroupSelected(opts[0].id);
      }
    });
  }

  onStudentSelected(studentId: string) {
    this.selectedStudentId.set(studentId);
    this.form.patchValue({ studentId });
  }

  onTeacherSelected(teacherId: string) {
    this.selectedTeacherId.set(teacherId);
    this.form.patchValue({ teacherId });
  }

  onGroupSelected(groupId: string) {
    this.selectedGroupId.set(groupId);
    this.form.patchValue({ classGroupId: groupId });
  }

  setStatus(status: AttendanceStatus) {
    this.form.patchValue({ status });
  }

  submit() {
    this.errorMessage.set(null);
    this.resultMessage.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const payload = {
      studentId: raw.studentId!,
      teacherId: raw.teacherId!,
      classGroupId: raw.classGroupId || "",
      attendanceDate: raw.attendanceDate!,
      status: raw.status!,
      notes: raw.notes || undefined,
    };

    this.api.markOnlineAttendance(payload).subscribe({
      next: (res) => {
        const msg = `Success: Online session attendance recorded for date ${raw.attendanceDate}.`;
        this.resultMessage.set(msg);
        this.toast.showSuccess(msg);
      },
      error: (err) => {
        const messages = err?.error?.errors ?? err?.error ?? ["Something went wrong."];
        const errorText = Array.isArray(messages) ? messages.join(", ") : String(messages);
        this.errorMessage.set(errorText);
        this.toast.showError(errorText);
      },
    });
  }
}