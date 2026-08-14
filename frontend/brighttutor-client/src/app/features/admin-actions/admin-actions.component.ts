import { Component, inject, signal } from "@angular/core";
import { ReactiveFormsModule, FormBuilder, Validators } from "@angular/forms";
import { AttendanceService } from "../../services/attendance.service";
import { AttendanceStatus } from "../../models/attendance.model";

@Component({
  selector: "app-admin-actions",
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: "./admin-actions.component.html",
  styleUrl: "./admin-actions.component.scss",
})
export class AdminActionsComponent {
  private fb = inject(FormBuilder);
  private api = inject(AttendanceService);

  statusOptions = [
    { label: "Present", value: AttendanceStatus.Present },
    { label: "Absent", value: AttendanceStatus.Absent },
    { label: "Late", value: AttendanceStatus.Late },
    { label: "Excused", value: AttendanceStatus.Excused },
  ];

  updateResult = signal<string | null>(null);
  updateError = signal<string | null>(null);
  verifyResult = signal<string | null>(null);
  verifyError = signal<string | null>(null);

  updateForm = this.fb.nonNullable.group({
    attendanceId: ["", Validators.required],
    newStatus: [AttendanceStatus.Present, Validators.required],
    notes: [""],
  });

  verifyForm = this.fb.nonNullable.group({
    attendanceId: ["", Validators.required],
    isVerified: [true, Validators.required],
    distanceFromStudentHomeInMeters: [0],
  });

  submitUpdate() {
    this.updateError.set(null);
    this.updateResult.set(null);
    if (this.updateForm.invalid) { this.updateForm.markAllAsTouched(); return; }

    const raw = this.updateForm.getRawValue();
    this.api.updateAttendance(raw.attendanceId, raw.newStatus, raw.notes || undefined).subscribe({
      next: (res) => this.updateResult.set(res.message),
      error: (err) => {
        const messages = err?.error?.errors ?? err?.error ?? ["Something went wrong."];
        this.updateError.set(Array.isArray(messages) ? messages.join(", ") : String(messages));
      },
    });
  }

  submitVerify() {
    this.verifyError.set(null);
    this.verifyResult.set(null);
    if (this.verifyForm.invalid) { this.verifyForm.markAllAsTouched(); return; }

    const raw = this.verifyForm.getRawValue();
    this.api.verifyHomeAttendance(raw.attendanceId, raw.isVerified, raw.distanceFromStudentHomeInMeters).subscribe({
      next: (res) => this.verifyResult.set(res.message),
      error: (err) => {
        const messages = err?.error?.errors ?? err?.error ?? ["Something went wrong."];
        this.verifyError.set(Array.isArray(messages) ? messages.join(", ") : String(messages));
      },
    });
  }
}