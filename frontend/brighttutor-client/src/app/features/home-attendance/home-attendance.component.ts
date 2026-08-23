import { Component, inject, signal, OnInit } from "@angular/core";
import { ReactiveFormsModule, FormBuilder, Validators } from "@angular/forms";
import { AttendanceService } from "../../services/attendance.service";
import { UserService } from "../../services/user.service";
import { CourseService } from "../../services/course.service";
import { AuthService } from "../../services/auth.service";
import { ToastService } from "../../services/toast.service";
import { SearchableSelectComponent, SelectOption } from "../../components/searchable-select/searchable-select.component";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-home-attendance",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SearchableSelectComponent],
  templateUrl: "./home-attendance.component.html",
  styleUrl: "./home-attendance.component.scss",
})
export class HomeAttendanceComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(AttendanceService);
  private userService = inject(UserService);
  private courseService = inject(CourseService);
  public authService = inject(AuthService);
  private toast = inject(ToastService);

  studentOptions = signal<SelectOption[]>([]);
  teacherOptions = signal<SelectOption[]>([]);
  groupOptions = signal<SelectOption[]>([]);
  activeVisitOptions = signal<SelectOption[]>([]);

  selectedStudentId = signal<string>('');
  selectedTeacherId = signal<string>('');
  selectedGroupId = signal<string>('');
  selectedCheckOutAttendanceId = signal<string>('');

  checkInResult = signal<string | null>(null);
  checkInError = signal<string | null>(null);
  checkOutResult = signal<string | null>(null);
  checkOutError = signal<string | null>(null);

  checkInForm = this.fb.nonNullable.group({
    studentId: ["", Validators.required],
    teacherId: ["", Validators.required],
    classGroupId: ["", Validators.required],
    attendanceDate: [new Date().toISOString().substring(0, 10), Validators.required],
    checkInLatitude: [37.7749, Validators.required],
    checkInLongitude: [-122.4194, Validators.required],
    address: ["124 Maple Street, Apt 4B"],
    lessonCovered: ["General Review Session"],
  });

  checkOutForm = this.fb.nonNullable.group({
    attendanceId: ["", Validators.required],
    checkOutLatitude: [37.7749, Validators.required],
    checkOutLongitude: [-122.4194, Validators.required],
  });

  ngOnInit() {
    this.loadData();
    this.loadActiveVisits();
  }

  loadData() {
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
      this.checkInForm.patchValue({ teacherId: user.userId });
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

  loadActiveVisits() {
    const today = new Date().toISOString().substring(0, 10);
    this.api.getHomeAttendance(undefined, today).subscribe({
      next: (visits: any[]) => {
        const active = (visits || []).filter(v => !v.checkOutTime).map(v => ({
          id: v.id,
          name: `${v.studentName || 'Student Home Visit'}`,
          subtext: `Address: ${v.address || 'Home'} | Check-in: ${v.checkInTime ? new Date(v.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}`
        }));
        this.activeVisitOptions.set(active);
        if (active.length > 0) {
          this.onCheckOutSessionSelected(active[0].id);
        }
      },
      error: () => {}
    });
  }

  onStudentSelected(studentId: string) {
    this.selectedStudentId.set(studentId);
    this.checkInForm.patchValue({ studentId });
  }

  onTeacherSelected(teacherId: string) {
    this.selectedTeacherId.set(teacherId);
    this.checkInForm.patchValue({ teacherId });
  }

  onGroupSelected(groupId: string) {
    this.selectedGroupId.set(groupId);
    this.checkInForm.patchValue({ classGroupId: groupId });
  }

  onCheckOutSessionSelected(attendanceId: string) {
    this.selectedCheckOutAttendanceId.set(attendanceId);
    this.checkOutForm.patchValue({ attendanceId });
  }

  submitCheckIn() {
    this.checkInError.set(null);
    this.checkInResult.set(null);

    if (this.checkInForm.invalid) {
      this.checkInForm.markAllAsTouched();
      return;
    }

    const raw = this.checkInForm.getRawValue();
    this.api
      .checkInHomeAttendance({
        ...raw,
        targetLatitude: raw.checkInLatitude,
        targetLongitude: raw.checkInLongitude,
        address: raw.address || undefined,
        lessonCovered: raw.lessonCovered || undefined,
      })
      .subscribe({
        next: (attendanceId) => {
          const studentName = this.studentOptions().find(s => s.id === raw.studentId)?.name || "Student";
          const msg = `Checked in successfully at ${raw.address || "Home Tutoring Location"}.`;
          this.checkInResult.set(msg);
          this.toast.showSuccess(msg);

          const newOpt: SelectOption = {
            id: attendanceId,
            name: `${studentName} Home Visit`,
            subtext: `Address: ${raw.address || 'Home Location'} | Checked In Now`
          };
          this.activeVisitOptions.update(opts => [newOpt, ...opts]);
          this.onCheckOutSessionSelected(attendanceId);
        },
        error: (err) => {
          const messages = err?.error?.errors ?? err?.error ?? ["Something went wrong."];
          const errorText = Array.isArray(messages) ? messages.join(", ") : String(messages);
          this.checkInError.set(errorText);
          this.toast.showError(errorText);
        },
      });
  }

  submitCheckOut() {
    this.checkOutError.set(null);
    this.checkOutResult.set(null);

    if (this.checkOutForm.invalid) {
      this.checkOutForm.markAllAsTouched();
      return;
    }

    const attendanceId = this.checkOutForm.getRawValue().attendanceId;

    this.api.checkOutHomeAttendance(this.checkOutForm.getRawValue()).subscribe({
      next: (res) => {
        this.checkOutResult.set(res.message);
        this.toast.showSuccess(res.message);
        this.activeVisitOptions.update(opts => opts.filter(o => o.id !== attendanceId));
        this.selectedCheckOutAttendanceId.set('');
        this.checkOutForm.patchValue({ attendanceId: '' });
      },
      error: (err) => {
        const messages = err?.error?.errors ?? err?.error ?? ["Something went wrong during check-out."];
        const errorText = Array.isArray(messages) ? messages.join(", ") : String(messages);
        this.checkOutError.set(errorText);
        this.toast.showError(errorText);
      },
    });
  }
}