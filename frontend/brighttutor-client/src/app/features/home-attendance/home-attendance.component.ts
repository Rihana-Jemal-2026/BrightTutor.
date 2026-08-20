import { Component, inject, signal, OnInit } from "@angular/core";
import { ReactiveFormsModule, FormBuilder, Validators } from "@angular/forms";
import { AttendanceService } from "../../services/attendance.service";
import { ToastService } from "../../services/toast.service";

export interface AssignedHomeStudent {
  studentId: string;
  studentName: string;
  address: string;
  subject: string;
  classGroupId: string;
  teacherId: string;
  teacherName: string;
  homeLatitude: number;
  homeLongitude: number;
}

export interface TeacherOption {
  id: string;
  name: string;
}

@Component({
  selector: "app-home-attendance",
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: "./home-attendance.component.html",
  styleUrl: "./home-attendance.component.scss",
})
export class HomeAttendanceComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(AttendanceService);
  private toast = inject(ToastService);

  teachers: TeacherOption[] = [
    { id: "TCH-001", name: "Mr. Robert Davis" },
    { id: "TCH-002", name: "Dr. Sarah Jenkins" },
    { id: "TCH-003", name: "Ms. Amanda Clark" },
  ];

  userRole = signal<"admin" | "teacher">("teacher");
  activeTeacherId = signal<string>("TCH-001");

  // Admin-assigned home tutoring students
  assignedStudents: AssignedHomeStudent[] = [
    {
      studentId: "STD-HOME",
      studentName: "James Miller",
      address: "124 Maple Street, Apt 4B",
      subject: "Home Mathematics Tutoring",
      classGroupId: "GRP-001",
      teacherId: "TCH-001",
      teacherName: "Mr. Robert Davis",
      homeLatitude: 37.7749,
      homeLongitude: -122.4194,
    },
    {
      studentId: "STD-002",
      studentName: "Sophia Chen",
      address: "58 Oak Avenue, Suite 12",
      subject: "Home Science Tutoring",
      classGroupId: "GRP-001",
      teacherId: "TCH-001",
      teacherName: "Mr. Robert Davis",
      homeLatitude: 37.7752,
      homeLongitude: -122.4188,
    },
    {
      studentId: "STD-008",
      studentName: "Noah Williams",
      address: "89 Pine View Road",
      subject: "Home Physics Tutoring",
      classGroupId: "GRP-002",
      teacherId: "TCH-002",
      teacherName: "Dr. Sarah Jenkins",
      homeLatitude: 37.776,
      homeLongitude: -122.4201,
    },
  ];

  get visibleStudents(): AssignedHomeStudent[] {
    if (this.userRole() === "admin") {
      return this.assignedStudents;
    }
    return this.assignedStudents.filter((s) => s.teacherId === this.activeTeacherId());
  }

  checkInResult = signal<string | null>(null);
  checkInError = signal<string | null>(null);
  checkOutResult = signal<string | null>(null);
  checkOutError = signal<string | null>(null);

  lastAttendanceId = signal<string | null>(null);
  activeCheckInStudentId = signal<string | null>(null);

  checkInForm = this.fb.nonNullable.group({
    studentId: ["STD-HOME", Validators.required],
    teacherId: ["TCH-001", Validators.required],
    classGroupId: ["GRP-001", Validators.required],
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
    this.refreshSelection();
  }

  setRole(role: "admin" | "teacher") {
    this.userRole.set(role);
    this.refreshSelection();
  }

  onTeacherChange(teacherId: string) {
    this.activeTeacherId.set(teacherId);
    this.refreshSelection();
  }

  refreshSelection() {
    const list = this.visibleStudents;
    if (list.length > 0) {
      this.selectStudent(list[0]);
    }
  }

  selectedStudentTargetCoordinates = signal<{ lat: number; lng: number } | null>(null);

  selectStudent(student: AssignedHomeStudent) {
    this.selectedStudentTargetCoordinates.set({
      lat: student.homeLatitude,
      lng: student.homeLongitude,
    });
    this.checkInForm.patchValue({
      studentId: student.studentId,
      teacherId: student.teacherId,
      classGroupId: student.classGroupId,
      address: student.address,
      checkInLatitude: student.homeLatitude,
      checkInLongitude: student.homeLongitude,
    });
    this.checkOutForm.patchValue({
      checkOutLatitude: student.homeLatitude,
      checkOutLongitude: student.homeLongitude,
    });
  }

  quickCheckIn(student: AssignedHomeStudent) {
    this.selectStudent(student);
    this.submitCheckIn();
  }

  submitCheckIn() {
    this.checkInError.set(null);
    this.checkInResult.set(null);

    if (this.checkInForm.invalid) {
      this.checkInForm.markAllAsTouched();
      return;
    }

    const raw = this.checkInForm.getRawValue();
    const target = this.selectedStudentTargetCoordinates();
    this.api
      .checkInHomeAttendance({
        ...raw,
        targetLatitude: target?.lat,
        targetLongitude: target?.lng,
        address: raw.address || undefined,
        lessonCovered: raw.lessonCovered || undefined,
      })
      .subscribe({
        next: (attendanceId) => {
          const msg = `Checked in successfully at ${raw.address || "Student Home"}. Attendance ID: ${attendanceId}`;
          this.checkInResult.set(msg);
          this.toast.showSuccess(msg);
          this.lastAttendanceId.set(attendanceId);
          this.activeCheckInStudentId.set(raw.studentId);
          this.checkOutForm.patchValue({ attendanceId });
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

    this.api.checkOutHomeAttendance(this.checkOutForm.getRawValue()).subscribe({
      next: (res) => {
        this.checkOutResult.set(res.message);
        this.toast.showSuccess(res.message);
        this.activeCheckInStudentId.set(null);
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