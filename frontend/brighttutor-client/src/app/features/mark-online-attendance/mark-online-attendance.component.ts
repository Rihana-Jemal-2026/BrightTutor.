import { Component, inject, signal } from "@angular/core";
import { ReactiveFormsModule, FormBuilder, Validators } from "@angular/forms";
import { AttendanceService } from "../../services/attendance.service";
import { AttendanceStatus } from "../../models/attendance.model";

@Component({
  selector: "app-mark-online-attendance",
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: "./mark-online-attendance.component.html",
  styleUrl: "./mark-online-attendance.component.scss",
})
export class MarkOnlineAttendanceComponent {
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
    studentId: ["", Validators.required],
    teacherId: ["", Validators.required],
    classGroupId: ["", Validators.required],
    attendanceDate: ["", Validators.required],
    status: [AttendanceStatus.Present, Validators.required],
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
    this.api.markOnlineAttendance({ ...raw, notes: raw.notes || undefined }).subscribe({
      next: () => this.resultMessage.set("Online attendance recorded successfully."),
      error: (err) => {
        const messages = err?.error?.errors ?? err?.error ?? ["Something went wrong."];
        this.errorMessage.set(Array.isArray(messages) ? messages.join(", ") : String(messages));
      },
    });
  }
}