import { Component, inject, signal, OnInit } from "@angular/core";
import { ReactiveFormsModule, FormBuilder, Validators } from "@angular/forms";
import { AttendanceService } from "../../services/attendance.service";
import { AttendanceStatus, StudentAttendanceEntry } from "../../models/attendance.model";

export interface EnrolledStudent {
  studentId: string;
  studentName: string;
}

export interface ClassGroupMeta {
  groupId: string;
  groupName: string;
  defaultTeacherId: string;
  defaultTeacherName: string;
  students: EnrolledStudent[];
}

export interface TeacherOption {
  id: string;
  name: string;
}

@Component({
  selector: "app-mark-group-attendance",
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: "./mark-group-attendance.component.html",
  styleUrl: "./mark-group-attendance.component.scss",
})
export class MarkGroupAttendanceComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(AttendanceService);

  // Enum references for template bindings
  readonly AttendanceStatus = AttendanceStatus;

  // Registered Teachers
  teachers: TeacherOption[] = [
    { id: "TCH-001", name: "Mr. Robert Davis" },
    { id: "TCH-002", name: "Dr. Sarah Jenkins" },
    { id: "TCH-003", name: "Ms. Amanda Clark" },
  ];

  // Role Filtering State ('admin' sees all groups; 'teacher' sees ONLY assigned groups)
  userRole = signal<"admin" | "teacher">("teacher");
  activeTeacherId = signal<string>("TCH-001");

  // Registered class groups & rosters
  classGroups: ClassGroupMeta[] = [
    {
      groupId: "GRP-001",
      groupName: "Grade 10 - Mathematics (Group A)",
      defaultTeacherId: "TCH-001",
      defaultTeacherName: "Mr. Robert Davis",
      students: [
        { studentId: "STD-001", studentName: "Alex Morgan" },
        { studentId: "STD-002", studentName: "Sophia Chen" },
        { studentId: "STD-003", studentName: "Marcus Johnson" },
        { studentId: "STD-004", studentName: "Emma Watson" },
        { studentId: "STD-005", studentName: "Daniel Kim" },
        { studentId: "STD-006", studentName: "Olivia Taylor" },
      ],
    },
    {
      groupId: "GRP-002",
      groupName: "Grade 11 - Physics (Group B)",
      defaultTeacherId: "TCH-002",
      defaultTeacherName: "Dr. Sarah Jenkins",
      students: [
        { studentId: "STD-007", studentName: "Liam Smith" },
        { studentId: "STD-008", studentName: "Noah Williams" },
        { studentId: "STD-009", studentName: "Ava Brown" },
        { studentId: "STD-010", studentName: "Isabella Davis" },
      ],
    },
    {
      groupId: "GRP-003",
      groupName: "Grade 12 - Advanced Chemistry (Group C)",
      defaultTeacherId: "TCH-001",
      defaultTeacherName: "Mr. Robert Davis",
      students: [
        { studentId: "STD-011", studentName: "Ethan Jones" },
        { studentId: "STD-012", studentName: "Mia Garcia" },
        { studentId: "STD-013", studentName: "Lucas Miller" },
      ],
    },
    {
      groupId: "GRP-004",
      groupName: "Grade 9 - Biology Fundamentals (Group D)",
      defaultTeacherId: "TCH-003",
      defaultTeacherName: "Ms. Amanda Clark",
      students: [
        { studentId: "STD-014", studentName: "Oliver Harris" },
        { studentId: "STD-015", studentName: "Charlotte Martin" },
        { studentId: "STD-016", studentName: "Benjamin Lee" },
      ],
    },
  ];

  selectedGroup = signal<ClassGroupMeta | null>(null);
  submitted = signal(false);
  errorMessage = signal<string | null>(null);
  resultMessage = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    classGroupId: ["GRP-001", Validators.required],
    teacherId: ["TCH-001", Validators.required],
    attendanceDate: [new Date().toISOString().substring(0, 10), Validators.required],
    students: this.fb.array<ReturnType<typeof this.buildStudentRow>>([]),
  });

  // Getter for groups filtered by assigned role/teacher
  get visibleClassGroups(): ClassGroupMeta[] {
    if (this.userRole() === "admin") {
      return this.classGroups;
    }
    return this.classGroups.filter((g) => g.defaultTeacherId === this.activeTeacherId());
  }

  ngOnInit() {
    this.refreshGroupSelection();
  }

  get students() {
    return this.form.controls.students;
  }

  buildStudentRow(studentId = "", studentName = "", status = AttendanceStatus.Present, notes = "") {
    return this.fb.nonNullable.group({
      studentId: [studentId, Validators.required],
      studentName: [studentName],
      status: [status, Validators.required],
      notes: [notes],
    });
  }

  setRole(role: "admin" | "teacher") {
    this.userRole.set(role);
    this.refreshGroupSelection();
  }

  onTeacherChange(teacherId: string) {
    this.activeTeacherId.set(teacherId);
    this.refreshGroupSelection();
  }

  refreshGroupSelection() {
    const visible = this.visibleClassGroups;
    if (visible.length > 0) {
      this.onGroupSelectChange(visible[0].groupId);
    } else {
      this.selectedGroup.set(null);
      this.students.clear();
      this.form.patchValue({ classGroupId: "", teacherId: this.activeTeacherId() });
    }
  }

  onGroupSelectChange(groupId: string) {
    const found = this.classGroups.find((g) => g.groupId === groupId);
    if (found) {
      this.selectedGroup.set(found);
      this.form.patchValue({
        classGroupId: found.groupId,
        teacherId: found.defaultTeacherId,
      });
      this.loadGroupRoster(found);
    }
  }

  loadGroupRoster(group: ClassGroupMeta) {
    this.students.clear();
    for (const s of group.students) {
      this.students.push(this.buildStudentRow(s.studentId, s.studentName, AttendanceStatus.Present));
    }
  }

  setStatus(index: number, status: AttendanceStatus) {
    const row = this.students.at(index);
    if (row) {
      row.patchValue({ status });
    }
  }

  markAllStatus(status: AttendanceStatus) {
    for (let i = 0; i < this.students.length; i++) {
      this.setStatus(i, status);
    }
  }

  addCustomStudent() {
    const nextNum = this.students.length + 1;
    this.students.push(
      this.buildStudentRow(`STD-00${nextNum}`, `Guest Student #${nextNum}`, AttendanceStatus.Present)
    );
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
      students: raw.students.map((s) => ({
        studentId: s.studentId,
        status: s.status,
        notes: s.notes,
      })) as StudentAttendanceEntry[],
    };

    this.api.markGroupAttendance(payload).subscribe({
      next: (response) => {
        this.submitted.set(true);
        this.resultMessage.set(
          `Success: ${response.recordsCreated} attendance record(s) submitted for group ${raw.classGroupId} on ${response.attendanceDate}.`
        );
      },
      error: (err) => {
        const messages = err?.error?.errors ?? err?.error ?? ["Something went wrong."];
        this.errorMessage.set(Array.isArray(messages) ? messages.join(", ") : String(messages));
      },
    });
  }
}