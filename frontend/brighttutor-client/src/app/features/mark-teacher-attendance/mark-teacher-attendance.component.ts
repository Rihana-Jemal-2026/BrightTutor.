import { Component, inject, signal, OnInit } from "@angular/core";
import { ReactiveFormsModule, FormBuilder, Validators } from "@angular/forms";
import { AttendanceService } from "../../services/attendance.service";
import { UserService } from "../../services/user.service";
import { ToastService } from "../../services/toast.service";
import { AttendanceStatus } from "../../models/attendance.model";
import { SearchableSelectComponent, SelectOption } from "../../components/searchable-select/searchable-select.component";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-mark-teacher-attendance",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SearchableSelectComponent],
  templateUrl: "./mark-teacher-attendance.component.html",
  styleUrl: "./mark-teacher-attendance.component.scss",
})
export class MarkTeacherAttendanceComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(AttendanceService);
  private userService = inject(UserService);
  private toast = inject(ToastService);

  readonly AttendanceStatus = AttendanceStatus;

  teacherOptions = signal<SelectOption[]>([]);
  selectedTeacherId = signal<string>('');

  statusOptions = [
    { label: "Present", value: AttendanceStatus.Present, icon: "✓", class: "status-present" },
    { label: "Absent", value: AttendanceStatus.Absent, icon: "✕", class: "status-absent" },
    { label: "Late", value: AttendanceStatus.Late, icon: "⏱", class: "status-late" },
    { label: "Excused", value: AttendanceStatus.Excused, icon: "✉", class: "status-excused" },
  ];

  resultMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  form = this.fb.group({
    teacherId: ["", Validators.required],
    attendanceDate: [new Date().toISOString().split("T")[0], Validators.required],
    status: [null as AttendanceStatus | null, Validators.required],
    checkInTime: ["08:30"],
    checkOutTime: ["16:30"],
    notes: [""],
  });

  ngOnInit() {
    this.loadTeachers();
  }

  loadTeachers() {
    // Fetch real teachers from backend (Role 2 = Teacher)
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

  onTeacherSelected(teacherId: string) {
    this.selectedTeacherId.set(teacherId);
    this.form.patchValue({ teacherId });
  }

  setStatus(status: AttendanceStatus) {
    this.form.patchValue({ status });
  }

  private parseIsoDateTime(dateStr: string, timeStr: string | null | undefined): string | undefined {
    if (!timeStr) return undefined;
    try {
      if (timeStr.includes("T")) {
        return new Date(timeStr).toISOString();
      }
      return new Date(`${dateStr}T${timeStr}:00`).toISOString();
    } catch {
      return undefined;
    }
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
      teacherId: raw.teacherId!,
      attendanceDate: raw.attendanceDate!,
      status: raw.status !== null && raw.status !== undefined ? raw.status : AttendanceStatus.Present,
      checkInTime: this.parseIsoDateTime(raw.attendanceDate!, raw.checkInTime || undefined),
      checkOutTime: this.parseIsoDateTime(raw.attendanceDate!, raw.checkOutTime || undefined),
      notes: raw.notes || undefined,
    };

    this.api.markTeacherAttendance(payload).subscribe({
      next: (attendanceId) => {
        const msg = `Success: Teacher attendance recorded for date ${raw.attendanceDate}.`;
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