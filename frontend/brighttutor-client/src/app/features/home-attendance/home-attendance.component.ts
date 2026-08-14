import { Component, inject, signal } from "@angular/core";
import { ReactiveFormsModule, FormBuilder, Validators } from "@angular/forms";
import { AttendanceService } from "../../services/attendance.service";

@Component({
  selector: "app-home-attendance",
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: "./home-attendance.component.html",
  styleUrl: "./home-attendance.component.scss",
})
export class HomeAttendanceComponent {
  private fb = inject(FormBuilder);
  private api = inject(AttendanceService);

  checkInResult = signal<string | null>(null);
  checkInError = signal<string | null>(null);
  checkOutResult = signal<string | null>(null);
  checkOutError = signal<string | null>(null);

  // Once check-in succeeds, we store the returned Id here and
  // auto-fill it into the check-out form below — mirrors the real
  // workflow: you can't check out a visit that hasn't checked in.
  lastAttendanceId = signal<string | null>(null);

  checkInForm = this.fb.nonNullable.group({
    studentId: ["", Validators.required],
    teacherId: ["", Validators.required],
    classGroupId: ["", Validators.required],
    attendanceDate: ["", Validators.required],
    checkInLatitude: [0, Validators.required],
    checkInLongitude: [0, Validators.required],
    address: [""],
    lessonCovered: [""],
  });

  checkOutForm = this.fb.nonNullable.group({
    attendanceId: ["", Validators.required],
    checkOutLatitude: [0, Validators.required],
    checkOutLongitude: [0, Validators.required],
  });

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
        address: raw.address || undefined,
        lessonCovered: raw.lessonCovered || undefined,
      })
      .subscribe({
        next: (attendanceId) => {
          this.checkInResult.set(`Checked in successfully. Attendance ID: ${attendanceId}`);
          this.lastAttendanceId.set(attendanceId);
          this.checkOutForm.patchValue({ attendanceId });
        },
        error: (err) => {
          const messages = err?.error?.errors ?? err?.error ?? ["Something went wrong."];
          this.checkInError.set(Array.isArray(messages) ? messages.join(", ") : String(messages));
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

    this.api.checkOutHomeAttendance(this.checkOutForm.getRawValue()).subscribe({
      next: (res) => this.checkOutResult.set(res.message),
      error: (err) => {
        const messages = err?.error?.errors ?? err?.error ?? ["Something went wrong."];
        this.checkOutError.set(Array.isArray(messages) ? messages.join(", ") : String(messages));
      },
    });
  }
}