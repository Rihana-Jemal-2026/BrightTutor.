import { Component, inject, signal, OnInit } from "@angular/core";
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, FormArray, AbstractControl } from "@angular/forms";
import { AttendanceService } from "../../services/attendance.service";
import { ToastService } from "../../services/toast.service";
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
  private toast = inject(ToastService);

  readonly AttendanceStatus = AttendanceStatus;

  teachers: TeacherOption[] = [
    { id: "TCH-001", name: "Mr. Robert Davis" },
    { id: "TCH-002", name: "Dr. Sarah Jenkins" },
    { id: "TCH-003", name: "Ms. Amanda Clark" },
  ];

  classGroups: ClassGroupMeta[] = [
    {
      groupId: "GRP-001",
      groupName: "Grade 10 Mathematics - Group A",
      defaultTeacherId: "TCH-001",
      defaultTeacherName: "Mr. Robert Davis",
      students: [
        { studentId: "STD-001", studentName: "Michael Brown" },
        { studentId: "STD-002", studentName: "Emily Davis" },
        { studentId: "STD-003", studentName: "James Wilson" },
        { studentId: "STD-004", studentName: "Sophia Taylor" },
        { studentId: "STD-005", studentName: "Daniel Anderson" },
      ],
    },
    {
      groupId: "GRP-002",
      groupName: "Physics Advanced - Group B",
      defaultTeacherId: "TCH-002",
      defaultTeacherName: "Dr. Sarah Jenkins",
      students: [
        { studentId: "STD-006", studentName: "Oliver Martinez" },
        { studentId: "STD-007", studentName: "Ava White" },
        { studentId: "STD-008", studentName: "Lucas Harris" },
        { studentId: "STD-009", studentName: "Mia Martin" },
      ],
    },
    {
      groupId: "GRP-003",
      groupName: "Chemistry Honors - Group C",
      defaultTeacherId: "TCH-003",
      defaultTeacherName: "Ms. Amanda Clark",
      students: [
        { studentId: "STD-010", studentName: "Ethan Jackson" },
        { studentId: "STD-011", studentName: "Isabella Thompson" },
        { studentId: "STD-012", studentName: "Alexander Lee" },
      ],
    },
  ];

  userRole = signal<"admin" | "teacher">("teacher");
  activeTeacherId = signal<string>("TCH-001");
  selectedGroup = signal<ClassGroupMeta | null>(null);

  submitted = signal<boolean>(false);
  resultMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  form = this.fb.group({
    classGroupId: ["", Validators.required],
    teacherId: ["", Validators.required],
    attendanceDate: [new Date().toISOString().split("T")[0], Validators.required],
    students: this.fb.array<FormGroup>([]),
  });

  get visibleClassGroups(): ClassGroupMeta[] {
    if (this.userRole() === "admin") {
      return this.classGroups;
    }
    return this.classGroups.filter((g) => g.defaultTeacherId === this.activeTeacherId());
  }

  ngOnInit() {
    this.refreshGroupSelection();
  }

  get students(): FormArray {
    return this.form.controls.students as FormArray;
  }

  asFormGroup(control: AbstractControl): FormGroup {
    return control as FormGroup;
  }

  buildStudentRow(studentId = "", studentName = "", status: AttendanceStatus | null = null, notes = "") {
    return this.fb.group({
      studentId: [studentId, Validators.required],
      studentName: [studentName],
      status: [status], // Starts unselected (null) so no full color is shown by default
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
      // Pass null for status so no button is full color initially
      this.students.push(this.buildStudentRow(s.studentId, s.studentName, null));
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
      this.buildStudentRow(`STD-00${nextNum}`, `Guest Student #${nextNum}`, null)
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
      classGroupId: raw.classGroupId!,
      teacherId: raw.teacherId!,
      attendanceDate: raw.attendanceDate!,
      // If student status was not explicitly chosen, default to Present (0) on submit
      students: raw.students.map((s: any) => ({
        studentId: s.studentId,
        status: s.status !== null && s.status !== undefined ? s.status : AttendanceStatus.Present,
        notes: s.notes,
      })) as StudentAttendanceEntry[],
    };

    this.api.markGroupAttendance(payload).subscribe({
      next: (response) => {
        this.submitted.set(true);
        const msg = `Success: ${response.recordsCreated} attendance record(s) submitted for group ${raw.classGroupId} on ${response.attendanceDate}.`;
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