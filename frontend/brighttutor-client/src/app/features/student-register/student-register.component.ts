import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudentRegistrationService, RegistrationTrackDto } from '../../services/student-registration.service';
import { CourseService, CourseDto } from '../../services/course.service';
import { ToastService } from '../../services/toast.service';
import { COUNTRY_PHONE_LIST } from '../../models/country-phone.data';

@Component({
  selector: 'app-student-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="register-page">
      <div class="page-header">
        <h1>🎓 BrightTutor Student Admission & Enrollment Portal</h1>
        <p>Apply for 1-on-1 and Group Classes, track tutor assignment (3–5 working hours SLA), and upload tuition payment receipts.</p>
      </div>

      <!-- Navigation Tabs -->
      <div class="portal-tabs">
        <button [class.active]="activeTab() === 'apply'" (click)="activeTab.set('apply')">
          📝 1. Apply as New Student
        </button>
        <button [class.active]="activeTab() === 'track'" (click)="activeTab.set('track')">
          🔍 2. Track Application & Upload Payment Slip
        </button>
      </div>

      <!-- TAB 1: NEW REGISTRATION FORM -->
      @if (activeTab() === 'apply') {
        <div class="registration-card">
          @if (currentStep() === 1) {
            <form (ngSubmit)="onSubmitRegistration()">
              <h3>Student Application Form</h3>
              <p class="subtitle">Complete your details to start the tutor availability check (Estimated 3–5 working hours).</p>

              <div class="form-row">
                <div class="form-group">
                  <label>First Name *</label>
                  <input type="text" [(ngModel)]="form.firstName" name="firstName" placeholder="e.g. Samuel" required />
                </div>
                <div class="form-group">
                  <label>Last Name *</label>
                  <input type="text" [(ngModel)]="form.lastName" name="lastName" placeholder="e.g. Bekele" required />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Email Address *</label>
                  <input type="email" [(ngModel)]="form.email" name="email" placeholder="samuel@gmail.com" required />
                </div>
                <div class="form-group">
                  <label>Phone Number *</label>
                  <div class="phone-input-container">
                    <select [(ngModel)]="selectedCountryCode" name="selectedCountryCode" class="country-code-select">
                      @for (c of countryList; track c.code) {
                        <option [value]="c.dialCode">{{ c.flag }} {{ c.dialCode }} ({{ c.name }})</option>
                      }
                    </select>
                    <input type="tel" [(ngModel)]="phoneNumberInput" name="phoneNumberInput" placeholder="911 000 000" required />
                  </div>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Grade Level / Academic Status *</label>
                  <input type="text" [(ngModel)]="form.gradeLevel" name="gradeLevel" placeholder="Grade 11 / University / Adult Learner" required />
                </div>
                <div class="form-group">
                  <label>Home Address / Subcity *</label>
                  <input type="text" [(ngModel)]="form.address" name="address" placeholder="Bole Subcity, Woreda 03, Addis Ababa" required />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Service Delivery Method *</label>
                  <select [(ngModel)]="form.desiredServiceType" name="desiredServiceType" required>
                    <option [ngValue]="1">💻 Online 1-on-1 Tutoring</option>
                    <option [ngValue]="2">👥 In-Person Group Class (Academic Center)</option>
                    <option [ngValue]="3">🏠 Home-to-Home Visit (Private Tutor)</option>
                  </select>
                </div>

                <div class="form-group">
                  <label>Select Course Curriculum *</label>
                  <select [(ngModel)]="form.courseId" name="courseId" required>
                    <option value="">-- Choose Course Catalog --</option>
                    @for (course of courses(); track course.id) {
                      <option [value]="course.id">{{ course.name }}</option>
                    }
                  </select>
                </div>
              </div>

              <div class="form-actions">
                <button type="submit" class="btn-primary" [disabled]="submitting()">
                  @if (submitting()) { Submitting Application... } @else { Submit Application & Initiate Tutor Check }
                </button>
              </div>
            </form>
          }

          @if (currentStep() === 2) {
            <div class="complete-step">
              <div class="sla-banner">
                <div class="sla-icon">⏳</div>
                <div class="sla-info">
                  <h2>Application Received — Pending Teacher Check</h2>
                  <p>Our academic coordinator is currently checking tutor availability for your requested course and location.</p>
                  <div class="sla-timer-badge">⏰ Estimated SLA: 3 to 5 Working Hours</div>
                </div>
              </div>

              <div class="tracking-summary-card">
                <h4>Your Tracking Information</h4>
                <p><strong>Tracking Email:</strong> {{ form.email }}</p>
                <p><strong>Registration Code:</strong> <code>{{ createdRegistrationId() }}</code></p>
                <p>You may use your email address or Registration Code to track tutor assignment status and upload payment slip at any time.</p>
              </div>

              <div class="action-buttons">
                <button type="button" class="btn-secondary" (click)="activeTab.set('track'); searchEmail = form.email; onSearchTrack()">
                  🔍 Track Application Status Now
                </button>
                <button type="button" class="btn-primary" (click)="resetForm()">Register Another Student</button>
              </div>
            </div>
          }
        </div>
      }

      <!-- TAB 2: TRACK APPLICATION & UPLOAD PAYMENT -->
      @if (activeTab() === 'track') {
        <div class="tracking-card">
          <h3>Look Up Registration & Payment Portal</h3>
          <p class="subtitle">Enter your Email Address or Registration Code to view tutor assignment and submit payment.</p>

          <form (ngSubmit)="onSearchTrack()" class="search-bar-form">
            <input type="text" [(ngModel)]="searchEmail" name="searchEmail" placeholder="Enter your email or registration code..." required />
            <button type="submit" class="btn-primary" [disabled]="searchingTrack()">
              @if (searchingTrack()) { Searching... } @else { Search Application }
            </button>
          </form>

          @if (trackedResult(); as res) {
            <div class="track-details-box">
              <div class="status-header">
                <div>
                  <h3>{{ res.fullName }}</h3>
                  <p class="course-name">Course: <strong>{{ res.courseName }}</strong> | Grade: {{ res.gradeLevel }}</p>
                </div>
                <div class="status-pill" [ngClass]="getStatusClass(res.statusCode)">
                  {{ res.statusText }}
                </div>
              </div>

              <div class="notice-banner" [ngClass]="getNoticeClass(res.statusCode)">
                📢 <strong>Status Update:</strong> {{ res.notice }}
              </div>

              @if (res.assignedTeacherName) {
                <div class="teacher-matched-card">
                  <span class="teacher-icon">👨‍🏫</span>
                  <div>
                    <strong>Assigned Tutor: {{ res.assignedTeacherName }}</strong>
                    <p>Verified & Matched for {{ res.courseName }}</p>
                  </div>
                </div>
              }

              <!-- PAYMENT PORTAL IF APPROVED -->
              @if (res.statusCode === 2) {
                <div class="payment-upload-section">
                  <h3>💰 Submit Tuition Payment Slip (CBE / Telebirr)</h3>
                  <p>Please pay your tuition fee and attach the transaction ID & screenshot slip below:</p>

                  <div class="bank-accounts-card">
                    <div class="account-item">
                      <span class="account-icon">🏦</span>
                      <div>
                        <strong>Commercial Bank of Ethiopia (CBE)</strong>
                        <p>Account: 1000123456789 | Name: BrightTutor Academy</p>
                      </div>
                    </div>
                    <div class="account-item">
                      <span class="account-icon">📱</span>
                      <div>
                        <strong>Telebirr Transfer / Merchant</strong>
                        <p>Mobile: 0911000000 | Merchant Shortcode: 889900</p>
                      </div>
                    </div>
                  </div>

                  <form (ngSubmit)="onSubmitReceiptForTrack(res.registrationId)">
                    <div class="form-row">
                      <div class="form-group">
                        <label>Payment Channel *</label>
                        <select [(ngModel)]="receiptForm.paymentChannel" name="paymentChannel">
                          <option value="CBE Birr">CBE Birr / CBE Bank</option>
                          <option value="Telebirr">Telebirr Transfer</option>
                          <option value="Bank Transfer">Other Bank Transfer</option>
                        </select>
                      </div>
                      <div class="form-group">
                        <label>Transaction Reference ID *</label>
                        <input type="text" [(ngModel)]="receiptForm.transactionId" name="transactionId" placeholder="e.g. FT26082699X" required />
                      </div>
                      <div class="form-group">
                        <label>Amount Paid (ETB) *</label>
                        <input type="number" [(ngModel)]="receiptForm.amountPaid" name="amountPaid" placeholder="3500.00" required />
                      </div>
                    </div>

                    <div class="form-group">
                      <label>Upload Receipt Screenshot *</label>
                      <input type="file" (change)="onFileSelected($event)" accept="image/*" required />
                    </div>

                    @if (receiptForm.receiptImageBase64) {
                      <div class="receipt-preview">
                        <p>Receipt Preview Screenshot:</p>
                        <img [src]="receiptForm.receiptImageBase64" alt="Receipt Screenshot" />
                      </div>
                    }

                    <div class="form-actions">
                      <button type="submit" class="btn-success" [disabled]="submittingReceipt()">
                        @if (submittingReceipt()) { Uploading... } @else { Upload Receipt & Request Final Verification }
                      </button>
                    </div>
                  </form>
                </div>
              }

              @if (res.statusCode === 4) {
                <div class="credentials-card">
                  <h4>🎉 Account Active & Credentials Dispatched!</h4>
                  <p>Student ID Code: <strong>{{ res.issuedStudentCode }}</strong></p>
                  <p>You can now log in using your email <code>{{ res.email }}</code> and your default password sent via email.</p>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .register-page { padding: 1.5rem; max-width: 950px; margin: 0 auto; }
    .page-header h1 { color: var(--color-primary); margin-bottom: 0.25rem; font-size: 1.75rem; }
    .page-header p { color: var(--color-muted); margin-bottom: 1.5rem; }
    
    .portal-tabs { display: flex; gap: 0.75rem; margin-bottom: 1.5rem; }
    .portal-tabs button { flex: 1; padding: 0.85rem 1rem; border: 1px solid var(--color-border); background: var(--color-surface); color: var(--color-text); border-radius: 10px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
    .portal-tabs button.active { background: var(--color-accent); color: #fff; border-color: var(--color-accent); box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25); }
    
    .registration-card, .tracking-card { background: var(--color-surface); border: 1px solid var(--color-border); padding: 1.75rem; border-radius: 14px; box-shadow: var(--shadow-card); }
    .subtitle { color: var(--color-muted); font-size: 0.88rem; margin-bottom: 1.25rem; }
    
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.35rem; }
    .form-group label { font-size: 0.85rem; font-weight: 600; color: var(--color-text); }
    .form-group input, .form-group select { padding: 0.7rem; border-radius: 8px; border: 1px solid var(--color-border); background: var(--color-bg); color: var(--color-text); }
    .phone-input-container { display: flex; gap: 0.5rem; }
    .country-code-select { flex: 0 0 150px; font-weight: 600; cursor: pointer; }
    .phone-input-container input { flex: 1; }
    .form-actions { margin-top: 1.5rem; text-align: right; }
    
    .btn-primary { background: var(--color-accent); color: #fff; padding: 0.75rem 1.5rem; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }
    .btn-secondary { background: var(--color-bg); color: var(--color-text); border: 1px solid var(--color-border); padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600; cursor: pointer; }
    .btn-success { background: #10b981; color: #fff; padding: 0.75rem 1.5rem; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }
    
    .sla-banner { display: flex; gap: 1.25rem; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); padding: 1.25rem; border-radius: 12px; margin-bottom: 1.25rem; }
    .sla-icon { font-size: 2.5rem; }
    .sla-info h2 { font-size: 1.25rem; color: #d97706; margin-bottom: 0.25rem; }
    .sla-info p { margin: 0 0 0.5rem 0; color: var(--color-text); }
    .sla-timer-badge { display: inline-block; background: #f59e0b; color: #fff; font-weight: 700; font-size: 0.8rem; padding: 0.3rem 0.75rem; border-radius: 20px; }
    
    .tracking-summary-card { background: var(--color-bg); padding: 1rem 1.25rem; border-radius: 10px; border: 1px solid var(--color-border); margin-bottom: 1.5rem; }
    .action-buttons { display: flex; gap: 1rem; justify-content: flex-end; }
    
    .search-bar-form { display: flex; gap: 0.75rem; margin-bottom: 1.5rem; }
    .search-bar-form input { flex: 1; padding: 0.75rem 1rem; border-radius: 8px; border: 1px solid var(--color-border); background: var(--color-bg); color: var(--color-text); }
    
    .track-details-box { background: var(--color-bg); border: 1px solid var(--color-border); border-radius: 12px; padding: 1.25rem; }
    .status-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; }
    .status-header h3 { margin: 0 0 0.25rem 0; color: var(--color-text); }
    .course-name { margin: 0; font-size: 0.85rem; color: var(--color-muted); }
    
    .status-pill { padding: 0.4rem 0.85rem; border-radius: 20px; font-weight: 700; font-size: 0.8rem; }
    .status-pending { background: rgba(245, 158, 11, 0.2); color: #d97706; border: 1px solid #f59e0b; }
    .status-payment { background: rgba(59, 130, 246, 0.2); color: #2563eb; border: 1px solid #3b82f6; }
    .status-submitted { background: rgba(139, 92, 246, 0.2); color: #7c3aed; border: 1px solid #8b5cf6; }
    .status-verified { background: rgba(16, 185, 129, 0.2); color: #059669; border: 1px solid #10b981; }
    .status-rejected { background: rgba(239, 68, 68, 0.2); color: #dc2626; border: 1px solid #ef4444; }
    
    .notice-banner { padding: 0.85rem 1rem; border-radius: 8px; margin-bottom: 1rem; font-size: 0.88rem; }
    .notice-warning { background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); color: #b45309; }
    .notice-info { background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); color: #1d4ed8; }
    .notice-success { background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); color: #047857; }
    
    .teacher-matched-card { display: flex; align-items: center; gap: 0.75rem; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); padding: 0.85rem 1rem; border-radius: 10px; margin-bottom: 1.25rem; }
    .teacher-icon { font-size: 1.75rem; }
    .teacher-matched-card strong { color: #047857; font-size: 0.95rem; }
    .teacher-matched-card p { margin: 0; font-size: 0.8rem; color: var(--color-muted); }
    
    .bank-accounts-card { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.25rem; background: var(--color-surface); padding: 1rem; border-radius: 10px; border: 1px solid var(--color-border); }
    .account-item { display: flex; align-items: center; gap: 0.75rem; }
    .account-icon { font-size: 1.5rem; }
    .account-item strong { display: block; font-size: 0.88rem; color: var(--color-text); }
    .account-item p { margin: 0; font-size: 0.78rem; color: var(--color-muted); }
    .receipt-preview img { max-width: 240px; max-height: 240px; border-radius: 8px; border: 1px solid var(--color-border); margin-top: 0.5rem; }
    
    .credentials-card { background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); padding: 1.25rem; border-radius: 10px; text-align: center; }
    .credentials-card h4 { color: #047857; margin-bottom: 0.5rem; }
  `]
})
export class StudentRegisterComponent implements OnInit {
  countryList = COUNTRY_PHONE_LIST;
  selectedCountryCode = '+251';
  phoneNumberInput = '';

  activeTab = signal<'apply' | 'track'>('apply');
  courses = signal<CourseDto[]>([]);
  currentStep = signal<number>(1);
  submitting = signal<boolean>(false);
  submittingReceipt = signal<boolean>(false);
  createdRegistrationId = signal<string>('');

  searchEmail = '';
  searchingTrack = signal<boolean>(false);
  trackedResult = signal<RegistrationTrackDto | null>(null);

  form = {
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    gradeLevel: '',
    address: '',
    desiredServiceType: 1,
    courseId: ''
  };

  receiptForm = {
    paymentChannel: 'CBE Birr',
    transactionId: '',
    amountPaid: 3500,
    receiptImageBase64: ''
  };

  private registrationService = inject(StudentRegistrationService);
  private courseService = inject(CourseService);
  private toastService = inject(ToastService);

  ngOnInit(): void {
    this.courseService.getCourses().subscribe(res => this.courses.set(res));
  }

  onSubmitRegistration(): void {
    if (!this.form.firstName || !this.form.email || !this.form.courseId || !this.phoneNumberInput) {
      this.toastService.show('Please fill in all required fields including phone number.', 'error');
      return;
    }

    this.form.phoneNumber = `${this.selectedCountryCode} ${this.phoneNumberInput.trim()}`;

    this.submitting.set(true);
    this.registrationService.submitRegistration(this.form).subscribe({
      next: (res) => {
        this.submitting.set(false);
        this.createdRegistrationId.set(res.registrationId);
        this.currentStep.set(2);
        this.toastService.show(res.message, 'success');
      },
      error: (err) => {
        this.submitting.set(false);
        this.toastService.show(err.error?.message || 'Registration failed.', 'error');
      }
    });
  }

  onSearchTrack(): void {
    if (!this.searchEmail) {
      this.toastService.show('Please enter your email or tracking code.', 'error');
      return;
    }

    this.searchingTrack.set(true);
    this.registrationService.trackRegistration(this.searchEmail).subscribe({
      next: (res) => {
        this.searchingTrack.set(false);
        this.trackedResult.set(res);
      },
      error: (err) => {
        this.searchingTrack.set(false);
        this.toastService.show(err.error?.message || 'No registration found.', 'error');
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.receiptForm.receiptImageBase64 = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmitReceiptForTrack(registrationId: string): void {
    if (!this.receiptForm.transactionId) {
      this.toastService.show('Please enter transaction reference ID.', 'error');
      return;
    }

    this.submittingReceipt.set(true);
    this.registrationService.uploadReceipt({
      registrationId,
      ...this.receiptForm
    }).subscribe({
      next: (res) => {
        this.submittingReceipt.set(false);
        this.toastService.show(res.message, 'success');
        this.onSearchTrack();
      },
      error: (err) => {
        this.submittingReceipt.set(false);
        this.toastService.show(err.error?.message || 'Receipt upload failed.', 'error');
      }
    });
  }

  resetForm(): void {
    this.currentStep.set(1);
    this.form = { firstName: '', lastName: '', email: '', phoneNumber: '', gradeLevel: '', address: '', desiredServiceType: 1, courseId: '' };
    this.receiptForm = { paymentChannel: 'CBE Birr', transactionId: '', amountPaid: 3500, receiptImageBase64: '' };
  }

  getStatusClass(code: number): string {
    switch (code) {
      case 1: return 'status-pending';
      case 2: return 'status-payment';
      case 3: return 'status-submitted';
      case 4: return 'status-verified';
      case 5: return 'status-rejected';
      default: return 'status-pending';
    }
  }

  getNoticeClass(code: number): string {
    switch (code) {
      case 1: return 'notice-warning';
      case 2: return 'notice-info';
      case 3: return 'notice-info';
      case 4: return 'notice-success';
      case 5: return 'notice-warning';
      default: return 'notice-info';
    }
  }
}
