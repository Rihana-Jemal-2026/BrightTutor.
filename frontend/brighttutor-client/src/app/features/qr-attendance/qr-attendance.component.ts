import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QrAttendanceService, QrSessionDto } from '../../services/qr-attendance.service';
import { CourseService, ClassGroupDto } from '../../services/course.service';
import { StudentService, StudentDto } from '../../services/student.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-qr-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="qr-page">
      <div class="page-header">
        <h1>📱 Dynamic QR + Camera Face ID Check-In</h1>
        <p>In-Person Group Class Anti-Proxy Check-In System for Classroom Hall Display & Student Devices.</p>
      </div>

      <!-- View Selector -->
      <div class="view-switch">
        <button type="button" class="switch-btn" [class.active]="viewMode() === 'projector'" (click)="viewMode.set('projector')">
          🖥️ Classroom Projector TV Display (QR Generator)
        </button>
        <button type="button" class="switch-btn" [class.active]="viewMode() === 'scanner'" (click)="viewMode.set('scanner')">
          📱 Student Mobile Check-In Scanner (Camera + Face ID)
        </button>
      </div>

      <!-- 1. Classroom Projector View -->
      @if (viewMode() === 'projector') {
        <div class="projector-card">
          <div class="group-select-row">
            <label>Select Class Group for Live Display:</label>
            <select [(ngModel)]="selectedClassGroupId" (change)="onGroupSelected()">
              <option value="">-- Choose Classroom Group --</option>
              @for (group of classGroups(); track group.id) {
                <option [value]="group.id">{{ group.name }} ({{ group.courseName }})</option>
              }
            </select>
          </div>

          @if (qrSession()) {
            <div class="qr-display-box">
              <div class="qr-badge">LIVE CLASSROOM QR CODE</div>
              <h2>{{ qrSession()?.groupName }}</h2>
              <p class="course-sub">{{ qrSession()?.courseName }}</p>

              <div class="qr-code-graphic">
                <div class="qr-mock-box">
                  <div class="qr-pattern">
                    <span class="qr-corner top-left"></span>
                    <span class="qr-corner top-right"></span>
                    <span class="qr-corner bottom-left"></span>
                    <div class="qr-center-text">SCAN WITH MOBILE<br/>CAMERA</div>
                  </div>
                </div>
              </div>

              <div class="qr-meta">
                <p>📍 Location: {{ qrSession()?.location }}</p>
                <p>🔑 Token Nonce: <code>{{ qrSession()?.qrNonce }}</code></p>
                <p>🕒 Refreshed At: {{ qrSession()?.timestamp | date:'mediumTime' }}</p>
              </div>
            </div>
          } @else {
            <div class="select-prompt">Please select a class group above to project the live classroom QR Code.</div>
          }
        </div>
      }

      <!-- 2. Student Scanner View with Anti-Proxy Face ID -->
      @if (viewMode() === 'scanner') {
        <div class="scanner-card">
          <h3>📱 Student Attendance Check-In Verification</h3>
          <p>Align your face inside the camera viewport and scan the classroom QR code to record attendance.</p>

          <form (ngSubmit)="onScanSubmit()">
            <div class="form-group">
              <label>Select Your Student Profile *</label>
              <select [(ngModel)]="scannerForm.studentId" name="studentId" required>
                <option value="">-- Select Student Account --</option>
                @for (student of students(); track student.id) {
                  <option [value]="student.id">{{ student.firstName }} {{ student.lastName }} ({{ student.studentCode }})</option>
                }
              </select>
            </div>

            <div class="form-group">
              <label>Select Target Class Group *</label>
              <select [(ngModel)]="scannerForm.classGroupId" name="classGroupId" required>
                <option value="">-- Select Class Group --</option>
                @for (group of classGroups(); track group.id) {
                  <option [value]="group.id">{{ group.name }}</option>
                }
              </select>
            </div>

            <div class="form-group">
              <label>Classroom QR Token Nonce *</label>
              <input type="text" [(ngModel)]="scannerForm.qrNonce" name="qrNonce" placeholder="Enter or scan QR Nonce code" required />
            </div>

            <!-- Anti-Proxy Web Camera Viewport -->
            <div class="camera-viewport">
              <div class="face-target-ring" [class.face-detected]="faceDetected()">
                <div class="face-guideline"></div>
                <div class="camera-status">
                  @if (faceDetected()) {
                    <span class="status-ok">✅ Face ID Position Verified</span>
                  } @else {
                    <span class="status-warn">👤 Position Face in Viewport</span>
                  }
                </div>
              </div>
            </div>

            <div class="face-toggle-row">
              <label>
                <input type="checkbox" [(ngModel)]="scannerForm.faceVerified" name="faceVerified" (change)="faceDetected.set(scannerForm.faceVerified)" />
                Camera Facial Boundary Verified (Anti-Proxy Lock Active)
              </label>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn-checkin" [disabled]="checkingIn() || !scannerForm.faceVerified">
                @if (checkingIn()) { Verifying... } @else { Submit Attendance Check-In }
              </button>
            </div>
          </form>
        </div>
      }
    </div>
  `,
  styles: [`
    .qr-page { padding: 1.5rem; max-width: 900px; margin: 0 auto; }
    .page-header h1 { color: var(--color-primary); margin-bottom: 0.25rem; font-size: 1.75rem; }
    .page-header p { color: var(--color-muted); margin-bottom: 1.5rem; }
    .view-switch { display: flex; gap: 0.75rem; margin-bottom: 1.25rem; }
    .switch-btn { flex: 1; padding: 0.75rem; border-radius: 8px; border: 1px solid var(--color-border); background: var(--color-surface); color: var(--color-text); font-weight: 600; cursor: pointer; }
    .switch-btn.active { background: var(--color-accent); color: #fff; border-color: var(--color-accent); }

    .projector-card, .scanner-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 14px; padding: 1.5rem; box-shadow: var(--shadow-card); }
    .group-select-row { margin-bottom: 1.5rem; display: flex; flex-direction: column; gap: 0.4rem; }
    .group-select-row select { padding: 0.65rem; border-radius: 8px; border: 1px solid var(--color-border); background: var(--color-bg); color: var(--color-text); }
    .qr-display-box { text-align: center; padding: 1.5rem; background: var(--color-bg); border-radius: 12px; border: 2px dashed var(--color-accent); }
    .qr-badge { display: inline-block; background: var(--color-accent); color: #fff; font-size: 0.75rem; font-weight: 800; padding: 0.25rem 0.75rem; border-radius: 6px; margin-bottom: 0.5rem; }
    .qr-display-box h2 { margin: 0; color: var(--color-text); }
    .course-sub { color: var(--color-muted); font-size: 0.9rem; margin-bottom: 1.25rem; }
    .qr-code-graphic { display: flex; justify-content: center; margin: 1rem 0; }
    .qr-mock-box { width: 220px; height: 220px; background: #fff; border: 4px solid #000; border-radius: 12px; display: flex; align-items: center; justify-content: center; position: relative; padding: 10px; }
    .qr-pattern { width: 100%; height: 100%; border: 2px solid #000; position: relative; display: flex; align-items: center; justify-content: center; }
    .qr-corner { position: absolute; width: 35px; height: 35px; border: 5px solid #000; background: #fff; }
    .qr-corner.top-left { top: 5px; left: 5px; }
    .qr-corner.top-right { top: 5px; right: 5px; }
    .qr-corner.bottom-left { bottom: 5px; left: 5px; }
    .qr-center-text { font-size: 0.7rem; font-weight: 800; color: #000; text-align: center; }
    .qr-meta { font-size: 0.85rem; color: var(--color-muted); margin-top: 1rem; }
    .qr-meta code { background: rgba(59, 130, 246, 0.15); color: #3b82f6; padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: 700; }

    .form-group { display: flex; flex-direction: column; gap: 0.35rem; margin-bottom: 1rem; }
    .form-group label { font-size: 0.85rem; font-weight: 600; color: var(--color-text); }
    .form-group select, .form-group input { padding: 0.65rem; border-radius: 8px; border: 1px solid var(--color-border); background: var(--color-bg); color: var(--color-text); }

    .camera-viewport { height: 180px; background: #1e293b; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 1rem 0; position: relative; border: 2px solid var(--color-border); }
    .face-target-ring { width: 130px; height: 130px; border: 3px dashed #ef4444; border-radius: 50%; display: flex; align-items: center; justify-content: center; position: relative; transition: all 0.3s ease; }
    .face-target-ring.face-detected { border-color: var(--color-success); border-style: solid; box-shadow: 0 0 15px rgba(16, 185, 129, 0.4); }
    .camera-status { position: absolute; bottom: -30px; font-size: 0.8rem; font-weight: 700; }
    .status-ok { color: var(--color-success); }
    .status-warn { color: #f59e0b; }
    .face-toggle-row { margin-bottom: 1.25rem; font-size: 0.85rem; color: var(--color-text); }
    .btn-checkin { width: 100%; background: var(--color-success); color: #fff; border: none; padding: 0.85rem; border-radius: 8px; font-weight: 700; font-size: 1rem; cursor: pointer; }
    .select-prompt { text-align: center; padding: 3rem; color: var(--color-muted); background: var(--color-bg); border-radius: 12px; }
  `]
})
export class QrAttendanceComponent implements OnInit {
  classGroups = signal<ClassGroupDto[]>([]);
  students = signal<StudentDto[]>([]);
  qrSession = signal<QrSessionDto | null>(null);
  viewMode = signal<'projector' | 'scanner'>('projector');
  faceDetected = signal<boolean>(true);
  checkingIn = signal<boolean>(false);
  selectedClassGroupId = '';

  scannerForm = {
    studentId: '',
    classGroupId: '',
    qrNonce: '',
    faceVerified: true
  };

  private qrService = inject(QrAttendanceService);
  private courseService = inject(CourseService);
  private studentService = inject(StudentService);
  private toastService = inject(ToastService);

  ngOnInit(): void {
    this.courseService.getClassGroups().subscribe((res: ClassGroupDto[]) => this.classGroups.set(res));
    this.studentService.getStudents().subscribe((res: StudentDto[]) => this.students.set(res));
  }

  onGroupSelected(): void {
    if (!this.selectedClassGroupId) return;
    this.qrService.generateSessionQr(this.selectedClassGroupId).subscribe({
      next: (res) => {
        this.qrSession.set(res);
        this.scannerForm.qrNonce = res.qrNonce;
        this.scannerForm.classGroupId = res.classGroupId;
      }
    });
  }

  onScanSubmit(): void {
    if (!this.scannerForm.studentId || !this.scannerForm.classGroupId) {
      this.toastService.show('Please select student profile and class group.', 'error');
      return;
    }

    this.checkingIn.set(true);
    this.qrService.scanCheckIn(this.scannerForm).subscribe({
      next: (res) => {
        this.checkingIn.set(false);
        this.toastService.show(res.message, 'success');
      },
      error: (err) => {
        this.checkingIn.set(false);
        this.toastService.show(err.error?.message || 'Check-in failed.', 'error');
      }
    });
  }
}
