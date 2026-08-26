import { Component, inject, signal, OnInit } from "@angular/core";
import { ReactiveFormsModule, FormBuilder, Validators } from "@angular/forms";
import { AttendanceService } from "../../services/attendance.service";
import { ToastService } from "../../services/toast.service";
import { UserService, UserDto } from "../../services/user.service";
import { NotificationService } from "../../services/notification.service";
import { AttendanceStatus } from "../../models/attendance.model";
import { SearchableSelectComponent, SelectOption } from "../../components/searchable-select/searchable-select.component";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-admin-actions",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SearchableSelectComponent],
  templateUrl: "./admin-actions.component.html",
  styleUrl: "./admin-actions.component.scss",
})
export class AdminActionsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(AttendanceService);
  private userService = inject(UserService);
  private notificationService = inject(NotificationService);
  private toast = inject(ToastService);

  readonly AttendanceStatus = AttendanceStatus;

  attendanceRecordOptions = signal<SelectOption[]>([]);
  userOptions = signal<SelectOption[]>([]);
  selectedUpdateId = signal<string>('');
  selectedVerifyId = signal<string>('');
  selectedNotifUserId = signal<string>('');

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
  notifResult = signal<string | null>(null);
  notifError = signal<string | null>(null);
  sendingNotif = signal<boolean>(false);

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

  notifForm = this.fb.nonNullable.group({
    userId: ["", Validators.required],
    title: ["", Validators.required],
    message: ["", Validators.required],
    type: [1, Validators.required]
  });

  ngOnInit() {
    this.loadAttendanceRecords();
    this.loadUsers();
  }

  loadUsers() {
    this.userService.getUsers().subscribe({
      next: (users) => {
        const opts = users.map(u => ({
          id: u.id,
          name: `${u.firstName} ${u.lastName}`,
          subtext: `${u.email} (${u.role === 1 ? 'Admin' : u.role === 2 ? 'Teacher' : u.role === 3 ? 'Student' : 'Parent'})`
        }));
        this.userOptions.set(opts);
        if (opts.length > 0) {
          this.onNotifUserSelected(opts[0].id);
        }
      }
    });
  }

  loadAttendanceRecords() {
    const today = new Date().toISOString().slice(0, 10);
    this.api.getDailyOverview(today).subscribe({
      next: (res) => {
        const records = res.records || [];
        const opts: SelectOption[] = records.map((r: any) => ({
          id: r.id || r.attendanceId,
          name: `Record: ${r.studentName || r.studentId || 'Attendance'}`,
          subtext: `Date: ${r.date || today} | Status: ${r.statusName || r.status}`
        }));
        
        this.attendanceRecordOptions.set(opts);
        if (opts.length > 0) {
          this.onUpdateRecordSelected(opts[0].id);
          this.onVerifyRecordSelected(opts[0].id);
        }
      },
      error: () => {}
    });
  }

  onUpdateRecordSelected(id: string) {
    this.selectedUpdateId.set(id);
    this.updateForm.patchValue({ attendanceId: id });
  }

  onVerifyRecordSelected(id: string) {
    this.selectedVerifyId.set(id);
    this.verifyForm.patchValue({ attendanceId: id });
  }

  onNotifUserSelected(id: string) {
    this.selectedNotifUserId.set(id);
    this.notifForm.patchValue({ userId: id });
  }

  submitUpdate() {
    this.updateError.set(null);
    this.updateResult.set(null);
    if (this.updateForm.invalid) { this.updateForm.markAllAsTouched(); return; }

    const raw = this.updateForm.getRawValue();
    this.api.updateAttendance(raw.attendanceId, raw.newStatus, raw.notes || undefined).subscribe({
      next: (res) => {
        this.updateResult.set(res.message);
        this.toast.showSuccess(res.message);
      },
      error: (err) => {
        const messages = err?.error?.errors ?? err?.error ?? ["Something went wrong."];
        const errorText = Array.isArray(messages) ? messages.join(", ") : String(messages);
        this.updateError.set(errorText);
        this.toast.showError(errorText);
      },
    });
  }

  submitVerify() {
    this.verifyError.set(null);
    this.verifyResult.set(null);
    if (this.verifyForm.invalid) { this.verifyForm.markAllAsTouched(); return; }

    const raw = this.verifyForm.getRawValue();
    this.api.verifyHomeAttendance(raw.attendanceId, raw.isVerified, raw.distanceFromStudentHomeInMeters).subscribe({
      next: (res) => {
        this.verifyResult.set(res.message);
        this.toast.showSuccess(res.message);
      },
      error: (err) => {
        const messages = err?.error?.errors ?? err?.error ?? ["Something went wrong."];
        const errorText = Array.isArray(messages) ? messages.join(", ") : String(messages);
        this.verifyError.set(errorText);
        this.toast.showError(errorText);
      },
    });
  }

  submitSendNotification() {
    this.notifError.set(null);
    this.notifResult.set(null);
    if (this.notifForm.invalid) { this.notifForm.markAllAsTouched(); return; }

    const raw = this.notifForm.getRawValue();
    this.sendingNotif.set(true);

    this.notificationService.sendNotification({
      userId: raw.userId,
      title: raw.title,
      message: raw.message,
      type: Number(raw.type)
    }).subscribe({
      next: () => {
        this.sendingNotif.set(false);
        this.notifResult.set("Notification dispatched successfully to user inbox!");
        this.toast.showSuccess("Notification dispatched successfully!");
        this.notifForm.patchValue({ title: '', message: '' });
      },
      error: (err) => {
        this.sendingNotif.set(false);
        const errMsg = err?.error?.message || err?.error || "Failed to dispatch notification.";
        this.notifError.set(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg));
        this.toast.showError(errMsg);
      }
    });
  }
}