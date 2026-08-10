import { Component, inject, signal } from "@angular/core";
import { ReactiveFormsModule, FormBuilder, Validators } from "@angular/forms";
import { AttendanceService } from "../../services/attendance.service";
import { AttendanceStatus, StudentAttendanceEntry } from "../../models/attendance.model";

@Component({
  selector: "app-mark-group-attendance",
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: "./mark-group-attendance.component.html",
  styleUrl: "./mark-group-attendance.component.scss",
})
export class MarkGroupAttendanceComponent {
  private fb = inject(FormBuilder);
  private api = inject(AttendanceService);

  // Exposes the enum to the template so we can build a dropdown from it
  statusOptions = [
    { label: "Present", value: AttendanceStatus.Present },
    { label: "Absent", value: AttendanceStatus.Absent },
    { label: "Late", value: AttendanceStatus.Late },
    { label: "Excused", value: AttendanceStatus.Excused },
  ];

  submitted = signal(false);
  errorMessage = signal<string | null>(null);
  resultMessage = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    classGroupId: ["", Validators.required],
    teacherId: ["", Validators.required],
    attendanceDate: ["", Validators.required],
    students: this.fb.array<ReturnType<typeof this.buildStudentRow>>([]),
  });

  get students() {
    return this.form.controls.students;
  }

  buildStudentRow() {
    return this.fb.nonNullable.group({
      studentId: ["", Validators.required],
      status: [AttendanceStatus.Present, Validators.required],
      notes: [""],
    });
  }

  addStudent() {
    this.students.push(this.buildStudentRow());
  }

  removeStudent(index: number) {
    this.students.removeAt(index);
  }

  submit() {
    this.errorMessage.set(null);
    this.resultMessage.set(null);

    if (this.form.invalid || this.students.length === 0) {
      this.form.markAllAsTouched();
      if (this.students.length === 0) {
        this.errorMessage.set("Add at least one student before submitting.");
      }
      return;
    }

    const raw = this.form.getRawValue();
    const payload = {
      classGroupId: raw.classGroupId,
      teacherId: raw.teacherId,
      attendanceDate: raw.attendanceDate,
      students: raw.students as StudentAttendanceEntry[],
    };

    this.api.markGroupAttendance(payload).subscribe({
      next: (response) => {
        this.submitted.set(true);
        this.resultMessage.set(
          `Success: ${response.recordsCreated} attendance record(s) created for ${response.attendanceDate}.`
        );
      },
      error: (err) => {
        const messages = err?.error?.errors ?? err?.error ?? ["Something went wrong."];
        this.errorMessage.set(Array.isArray(messages) ? messages.join(", ") : String(messages));
      },
    });
  }
}