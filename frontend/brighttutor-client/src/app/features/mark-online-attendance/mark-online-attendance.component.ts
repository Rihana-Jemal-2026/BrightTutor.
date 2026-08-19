import { Component, inject, signal, OnInit } from "@angular/core";
import { ReactiveFormsModule, FormBuilder, Validators } from "@angular/forms";
import { AttendanceService } from "../../services/attendance.service";
import { ToastService } from "../../services/toast.service";
import { AttendanceStatus } from "../../models/attendance.model";

export interface AssignedOnlineStudent {
  studentId: string;
  studentName: string;
  subject: string;
  classGroupId: string;
  teacherId: string;
  teacherName: string;
}

export interface TeacherOption {
  id: string;
  name: string;
}

@Component({
  selector: "app-mark-online-attendance",
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: "./mark-online-attendance.component.html",
  styleUrl: "./mark-online-attendance.component.scss",
})
export class MarkOnlineAttendanceComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(AttendanceService);
  private toast = inject(ToastService);

  readonly AttendanceStatus = AttendanceStatus;

  teachers: TeacherOption[] = [
    { id: "TCH-001", name: "Mr. Robert Davis" },
    { id: "TCH-002", name: "Dr. Sarah Jenkins" },
    { id: "TCH-003", name: "Ms. Amanda Clark" },
  ];

  userRole = signal<"admin" | "teacher">("teacher");
  activeTeacherId = signal<string>("TCH-001");

  // Admin-assigned online students
  assignedStudents: AssignedOnlineStudent[] = [
    {
      studentId: "STD-ONLINE",
      studentName: "Emily Watson",
      subject: "Mathematics 1-on-1 Online",
      classGroupId: "GRP-001",
      teacherId: "TCH-001",
      teacherName: "Mr. Robert Davis",
    },
    {
      studentId: "STD-001",
      studentName: "Alex Morgan",
      subject: "Physics 1-on-1 Online",
      classGroupId: "GRP-001",
      teacherId: "TCH-001",
      teacherName: "Mr. Robert Davis",
    },
    {
      studentId: "STD-007",
      studentName: "Liam Smith",
      subject: "Chemistry 1-on-1 Online",
      classGroupId: "GRP-002",
      teacherId: "TCH-002",
      teacherName: "Dr. Sarah Jenkins",
    },
    {
      studentId: "STD-014",
      studentName: "Oliver Harris",
      subject: "Biology 1-on-1 Online",
      classGroupId: "GRP-004",
      teacherId: "TCH-003",
      teacherName: "Ms. Amanda Clark",
    },
  ];

  get visibleStudents(): AssignedOnlineStudent[] {
    if (this.userRole() === "admin") {
      return this.assignedStudents;
    }
    return this.assignedStudents.filter((s) => s.teacherId === this.activeTeacherId());
  }

  resultMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    studentId: ["STD-ONLINE", Validators.required],
    teacherId: ["TCH-001", Validators.required],
    classGroupId: ["GRP-001", Validators.required],
    attendanceDate: [new Date().toISOString().substring(0, 10), Validators.required],
    status: [AttendanceStatus.Present, Validators.required],
    notes: [""],
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

  selectStudent(student: AssignedOnlineStudent) {
    this.form.patchValue({
      studentId: student.studentId,
      teacherId: student.teacherId,
      classGroupId: student.classGroupId,
    });
  }

  studentStatusMap = signal<Record<string, AttendanceStatus>>({
    "STD-ONLINE": AttendanceStatus.Present,
    "STD-001": AttendanceStatus.Present,
    "STD-007": AttendanceStatus.Present,
    "STD-014": AttendanceStatus.Present,
  });

  getStudentStatus(studentId: string): AttendanceStatus {
    return this.studentStatusMap()[studentId] ?? AttendanceStatus.Present;
  }

  quickSubmitStatus(student: AssignedOnlineStudent, status: AttendanceStatus) {
    this.selectStudent(student);
    this.form.patchValue({ status });
    this.studentStatusMap.update((map) => ({ ...map, [student.studentId]: status }));
    this.submit();
  }

  submit() {
    this.errorMessage.set(null);
    this.resultMessage.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    this.api.markOnlineAttendance({ ...raw, notes: raw.notes || undefined }).subscribe({
      next: () => {
        const msg = `Success: Online attendance recorded for ${raw.studentId}.`;
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