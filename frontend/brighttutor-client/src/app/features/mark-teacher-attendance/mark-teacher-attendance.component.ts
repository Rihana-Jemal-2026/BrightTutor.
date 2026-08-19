import { Component, inject, signal, OnInit } from "@angular/core";
import { ReactiveFormsModule, FormBuilder, Validators } from "@angular/forms";
import { AttendanceService } from "../../services/attendance.service";
import { ToastService } from "../../services/toast.service";
import { AttendanceStatus } from "../../models/attendance.model";

export interface TeacherOption {
  id: string;
  name: string;
}

@Component({
  selector: "app-mark-teacher-attendance",
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: "./mark-teacher-attendance.component.html",
  styleUrl: "./mark-teacher-attendance.component.scss",
})
export class MarkTeacherAttendanceComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(AttendanceService);
  private toast = inject(ToastService);

  readonly AttendanceStatus = AttendanceStatus;

  teachers: TeacherOption[] = [
    { id: "TCH-001", name: "Mr. Robert Davis" },
    { id: "TCH-002", name: "Dr. Sarah Jenkins" },
    { id: "TCH-003", name: "Ms. Amanda Clark" },
  ];

  statusOptions = [
    { label: "Present", value: AttendanceStatus.Present, icon: "✓", class: "status-present" },
    { label: "Absent", value: AttendanceStatus.Absent, icon: "✕", class: "status-absent" },
    { label: "Late", value: AttendanceStatus.Late, icon: "⏱", class: "status-late" },
    { label: "Excused", value: AttendanceStatus.Excused, icon: "✉", class: "status-excused" },
  ];

  resultMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    teacherId: ["TCH-001", Validators.required],
    attendanceDate: [new Date().toISOString().split("T")[0], Validators.required],
    status: [AttendanceStatus.Present, Validators.required],
    checkInTime: ["08:30"],
    checkOutTime: ["16:30"],
    notes: [""],
  });

  ngOnInit() {
    this.form.patchValue({
      attendanceDate: new Date().toISOString().split("T")[0],
    });
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
      teacherId: raw.teacherId,
      attendanceDate: raw.attendanceDate,
      status: raw.status,
      checkInTime: this.parseIsoDateTime(raw.attendanceDate, raw.checkInTime),
      checkOutTime: this.parseIsoDateTime(raw.attendanceDate, raw.checkOutTime),
      notes: raw.notes || undefined,
    };

    this.api.markTeacherAttendance(payload).subscribe({
      next: (attendanceId) => {
        const selectedTeacher = this.teachers.find((t) => t.id === raw.teacherId)?.name ?? raw.teacherId;
        const msg = `Success: Attendance recorded for ${selectedTeacher} on ${raw.attendanceDate}. (ID: ${attendanceId})`;
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