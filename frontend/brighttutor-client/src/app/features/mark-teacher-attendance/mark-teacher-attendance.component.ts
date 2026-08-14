import { Component, inject, signal } from "@angular/core";
import { ReactiveFormsModule, FormBuilder, Validators } from "@angular/forms";
import { AttendanceService } from "../../services/attendance.service";
import { AttendanceStatus } from "../../models/attendance.model";

@Component({
  selector: "app-mark-teacher-attendance",
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: "./mark-teacher-attendance.component.html",
  styleUrl: "./mark-teacher-attendance.component.scss",
})
export class MarkTeacherAttendanceComponent {
  private fb = inject(FormBuilder);
  private api = inject(AttendanceService);

  statusOptions = [
    { label: "Present", value: AttendanceStatus.Present },
    { label: "Absent", value: AttendanceStatus.Absent },
    { label: "Late", value: AttendanceStatus.Late },
    { label: "Excused", value: AttendanceStatus.Excused },
  ];

  resultMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    teacherId: ["", Validators.required],
    attendanceDate: ["", Validators.required],
    status: [AttendanceStatus.Present, Validators.required],
    checkInTime: [""],
    checkOutTime: [""],
    notes: [""],
  });

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
      checkInTime: raw.checkInTime ? new Date(raw.checkInTime).toISOString() : undefined,
      checkOutTime: raw.checkOutTime ? new Date(raw.checkOutTime).toISOString() : undefined,
      notes: raw.notes || undefined,
    };

    this.api.markTeacherAttendance(payload).subscribe({
      next: () => this.resultMessage.set("Teacher attendance recorded successfully."),
      error: (err) => {
        const messages = err?.error?.errors ?? err?.error ?? ["Something went wrong."];
        this.errorMessage.set(Array.isArray(messages) ? messages.join(", ") : String(messages));
      },
    });
  }
}