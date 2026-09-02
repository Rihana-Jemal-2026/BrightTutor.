import { Component, inject, signal, OnInit } from "@angular/core";
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, FormArray, AbstractControl } from "@angular/forms";
import { AttendanceService } from "../../services/attendance.service";
import { UserService } from "../../services/user.service";
import { CourseService } from "../../services/course.service";
import { AuthService } from "../../services/auth.service";
import { ToastService } from "../../services/toast.service";
import { AttendanceStatus, StudentAttendanceEntry } from "../../models/attendance.model";
import { SearchableSelectComponent, SelectOption } from "../../components/searchable-select/searchable-select.component";
import { EnrollmentService } from "../../services/enrollment.service";
import { CommonModule } from "@angular/common";

export interface GroupRosterItem {
  studentId: string;
  studentName: string;
}

@Component({
  selector: "app-mark-group-attendance",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SearchableSelectComponent],
  templateUrl: "./mark-group-attendance.component.html",
  styleUrl: "./mark-group-attendance.component.scss",
})
export class MarkGroupAttendanceComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(AttendanceService);
  private userService = inject(UserService);
  private courseService = inject(CourseService);
  private enrollmentService = inject(EnrollmentService);
  public authService = inject(AuthService);
  private toast = inject(ToastService);

  readonly AttendanceStatus = AttendanceStatus;

  teacherOptions = signal<SelectOption[]>([]);
  groupOptions = signal<SelectOption[]>([]);

  selectedGroupId = signal<string>('');
  selectedTeacherId = signal<string>('');

  submitted = signal<boolean>(false);
  resultMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  form = this.fb.group({
    classGroupId: ["", Validators.required],
    teacherId: ["", Validators.required],
    attendanceDate: [new Date().toISOString().split("T")[0], Validators.required],
    students: this.fb.array<FormGroup>([]),
  });

  ngOnInit() {
    this.loadTeachers();
    this.loadClassGroups();
  }

  get students(): FormArray {
    return this.form.controls.students as FormArray;
  }

  asFormGroup(control: AbstractControl): FormGroup {
    return control as FormGroup;
  }

  loadTeachers() {
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
          if (opts.length > 0) {
            this.onTeacherSelected(opts[0].id);
          }
        },
        error: () => {}
      });
    }
  }

  loadClassGroups() {
    this.courseService.getClassGroups().subscribe({
      next: (groups) => {
        const opts = groups.map(g => ({
          id: g.id,
          name: g.name,
          subtext: `Course: ${g.courseName} | Capacity: ${g.maximumStudents}`
        }));
        this.groupOptions.set(opts);
        if (opts.length > 0) {
          this.onGroupSelected(opts[0].id);
        }
      },
      error: () => {}
    });
  }

  onTeacherSelected(teacherId: string) {
    this.selectedTeacherId.set(teacherId);
    this.form.patchValue({ teacherId });
  }

  onGroupSelected(groupId: string) {
    this.selectedGroupId.set(groupId);
    this.form.patchValue({ classGroupId: groupId });

    this.enrollmentService.getEnrollments(undefined, groupId).subscribe({
      next: (enrollmentsList) => {
        this.students.clear();
        if (enrollmentsList && enrollmentsList.length > 0) {
          enrollmentsList.forEach(e => {
            this.students.push(this.fb.group({
              studentId: [e.studentId, Validators.required],
              studentName: [e.studentName || 'Enrolled Student'],
              status: [null],
              notes: ['']
            }));
          });
        } else {
          // Fallback if no specific group enrollment rows exist
          this.userService.getUsers(3).subscribe({
            next: (studentsList) => {
              this.students.clear();
              studentsList.forEach(s => {
                this.students.push(this.fb.group({
                  studentId: [s.id, Validators.required],
                  studentName: [`${s.firstName} ${s.lastName}`],
                  status: [null],
                  notes: ['']
                }));
              });
            }
          });
        }
      }
    });
  }

  setStatus(index: number, status: AttendanceStatus) {
    const row = this.students.at(index);
    if (row) {
      row.patchValue({ status });
    }
  }

  markAllStatus(status: AttendanceStatus) {
    for (let i = 0; i < this.students.length; i++) {
      this.setStatus(i, status);
    }
  }

  submit() {
    this.errorMessage.set(null);
    this.resultMessage.set(null);

    if (this.form.invalid || this.students.length === 0) {
      this.form.markAllAsTouched();
      if (this.students.length === 0) {
        this.errorMessage.set("No students found in this group to submit.");
      }
      return;
    }

    const raw = this.form.getRawValue();
    const payload = {
      classGroupId: raw.classGroupId!,
      teacherId: raw.teacherId!,
      attendanceDate: raw.attendanceDate!,
      students: raw.students.map((s: any) => ({
        studentId: s.studentId,
        status: s.status !== null && s.status !== undefined ? s.status : AttendanceStatus.Present,
        notes: s.notes,
      })) as StudentAttendanceEntry[],
    };

    this.api.markGroupAttendance(payload).subscribe({
      next: (response) => {
        this.submitted.set(true);
        const msg = `Success: ${response.recordsCreated} attendance record(s) submitted on ${response.attendanceDate}.`;
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