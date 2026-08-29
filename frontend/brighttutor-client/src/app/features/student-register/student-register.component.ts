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
    <div class="register-portal-page">
      <div class="portal-header">
        <h1>🎓 Student Admissions & Tutoring Portal</h1>
        <p>Register for 1-on-1 tutoring, check teacher availability (3-5 hr SLA), and manage payment slips.</p>
      </div>

      <div class="portal-tabs">
        <button type="button" class="tab-btn" [class.active]="activeTab() === 'apply'" (click)="activeTab.set('apply')">
          📝 Submit New Admission Request
        </button>
        <button type="button" class="tab-btn" [class.active]="activeTab() === 'track'" (click)="activeTab.set('track')">
          🔍 Track Admission Status & Pay
        </button>
      </div>

      <!-- TAB 1: SUBMIT NEW ADMISSION REQUEST -->
      @if (activeTab() === 'apply') {
        <div class="portal-card">
          @if (currentStep() === 1) {
            <form (ngSubmit)="onSubmitRegistration()">
              <h3>Student Registration & Tutor Screening Form</h3>

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
                  <label>Insert Your Phone Number *</label>
                  <div class="phone-input-container">
                    <select [(ngModel)]="selectedCountryCode" name="selectedCountryCode" class="country-code-select">
                      @for (c of countryList; track c.code) {
                        <option [value]="c.dialCode">{{ c.flag }} {{ c.dialCode }} ({{ c.name }})</option>
                      }
                    </select>
                    <input type="tel" [(ngModel)]="phoneNumberInput" name="phoneNumberInput" placeholder="Insert your phone number (e.g. 911 000 000)" required />
                  </div>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Insert Your Grade Level *</label>
                  <input type="text" [(ngModel)]="form.gradeLevel" name="gradeLevel" placeholder="Insert your grade level (e.g. Grade 9, Grade 10, Grade 11, Grade 12, University)" required />
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
                  <label>Select Course Catalog</label>
                  <select [(ngModel)]="selectedCourseOption" name="selectedCourseOption">
                    <option value="">-- Choose From Available Course Catalog --</option>
                    @for (course of courses(); track course.id) {
                      <option [value]="course.id">{{ course.name }}</option>
                    }
                    <option value="OTHER">➕ Other / Request Custom Course (Not Listed)</option>
                  </select>
                </div>
              </div>

              <!-- DEDICATED PERMANENT PLACE FOR CUSTOM REQUESTED COURSE -->
              <div class="form-group custom-course-box">
                <label class="custom-label">✏️ Can't find your course above? Insert your requested course or subject here:</label>
                <input
                  type="text"
                  [(ngModel)]="customCourseInput"
                  name="customCourseInput"
                  placeholder="Insert the custom course name or subject you want to learn (e.g. Python for Data Science, SAT Chemistry, Amharic Literature)"
                />
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

          <div class="search-bar">
            <input type="text" [(ngModel)]="searchEmail" name="searchEmail" placeholder="Enter Email or Reg ID (e.g. samuel@gmail.com)" (keyup.enter)="onSearchTrack()" />
            <button type="button" class="btn-primary" (click)="onSearchTrack()" [disabled]="searchingTrack()">
              @if (searchingTrack()) { Searching... } @else { Search Status }
            </button>
          </div>

          @if (trackedResult()) {
            <div class="result-box">
              <div class="status-header" [ngClass]="trackedResult()!.status.toLowerCase()">
                <div class="status-badge">{{ trackedResult()!.statusText }}</div>
                <h3>{{ trackedResult()!.fullName }}</h3>
                <p>Course: <strong>{{ trackedResult()!.courseName }}</strong> | Email: {{ trackedResult()!.email }}</p>
              </div>

              <div class="notice-card">
                <div class="notice-title">📋 Status Notice:</div>
                <p>{{ trackedResult()!.notice }}</p>
              </div>

              @if (trackedResult()!.assignedTeacherName) {
                <div class="teacher-card">
                  <div class="teacher-icon">👨‍🏫</div>
                  <div>
                    <h4>Assigned Certified Educator</h4>
                    <p class="teacher-name">{{ trackedResult()!.assignedTeacherName }}</p>
                  </div>
                </div>
              }

              <!-- PAYMENT SLIP UPLOAD CARD -->
              @if (trackedResult()!.statusCode === 2 || trackedResult()!.statusCode === 3) {
                <div class="payment-card">
                  <h3>💳 Tuition Payment Instructions</h3>
                  <p>Please send tuition fees to one of the official BrightTutor accounts below:</p>

                  <div class="bank-options">
                    <div class="bank-pill">
                      <strong>🏦 Commercial Bank of Ethiopia (CBE)</strong><br />
                      Account No: <code>1000123456789</code><br />
                      Account Name: BrightTutor Academy PLC
                    </div>
                    <div class="bank-pill">
                      <strong>📱 Telebirr Mobile Transfer</strong><br />
                      Mobile / Till: <code>0911000000</code> / Merchant ID 889900<br />
                      Account Name: BrightTutor Academy
                    </div>
                  </div>

                  <form (ngSubmit)="onSubmitReceipt(trackedResult()!.registrationId)" class="receipt-form">
                    <h4>Upload Payment Receipt Slip</h4>
                    <div class="form-row">
                      <div class="form-group">
                        <label>Payment Channel *</label>
                        <select [(ngModel)]="receiptForm.paymentChannel" name="pChannel" required>
                          <option value="CBE Birr">CBE Birr / Bank Transfer</option>
                          <option value="Telebirr">Telebirr Transfer</option>
                        </select>
                      </div>
                      <div class="form-group">
                        <label>Transaction Reference ID *</label>
                        <input type="text" [(ngModel)]="receiptForm.transactionId" name="pTxn" placeholder="e.g. FT26082699X" required />
                      </div>
                      <div class="form-group">
                        <label>Amount Paid (ETB) *</label>
                        <input type="number" [(ngModel)]="receiptForm.amountPaid" name="pAmount" placeholder="3500" required />
                      </div>
                    </div>

                    <div class="form-group">
                      <label>Upload Screenshot / Photo of Receipt Slip *</label>
                      <input type="file" (change)="onFileSelected($event)" accept="image/*" required />
                      @if (receiptForm.receiptImageBase64) {
                        <div class="preview-box">
                          <p>✅ Screenshot attached cleanly.</p>
                          <img [src]="receiptForm.receiptImageBase64" alt="Receipt Preview" />
                        </div>
                      }
                    </div>

                    <button type="submit" class="btn-success" [disabled]="submittingReceipt()">
                      @if (submittingReceipt()) { Submitting Receipt... } @else { Submit Payment Receipt for Admin Verification }
                    </button>
                  </form>
                </div>
              }

              @if (trackedResult()!.issuedStudentCode) {
                <div class="credentials-card">
                  <h3>🎉 Registration Complete & Verified</h3>
                  <p>Your permanent Student ID: <strong>{{ trackedResult()!.issuedStudentCode }}</strong></p>
                  <p>You can now sign in using your registered email and default password sent to your email.</p>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .register-portal-page { padding: 1.5rem; max-width: 900px; margin: 0 auto; }
    .portal-header h1 { color: var(--color-primary); margin-bottom: 0.25rem; font-size: 1.75rem; }
    .portal-header p { color: var(--color-muted); margin-bottom: 1.5rem; }

    .portal-tabs { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; }
    .tab-btn { flex: 1; padding: 0.75rem 1rem; border: 1px solid var(--color-border); background: var(--color-surface); border-radius: 10px; font-weight: 700; cursor: pointer; color: var(--color-text-muted); }
    .tab-btn.active { background: var(--color-accent); color: #fff; border-color: var(--color-accent); }

    .portal-card, .tracking-card { background: var(--color-surface); border: 1px solid var(--color-border); padding: 1.75rem; border-radius: 14px; box-shadow: var(--shadow-card); }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.35rem; margin-bottom: 1rem; }
    .form-group label { font-size: 0.85rem; font-weight: 600; color: var(--color-text); }
    .form-group input, .form-group select { padding: 0.7rem; border-radius: 8px; border: 1px solid var(--color-border); background: var(--color-bg); color: var(--color-text); }

    .phone-input-container { display: flex; gap: 0.5rem; }
    .country-code-select { flex: 0 0 150px; font-weight: 600; cursor: pointer; }
    .phone-input-container input { flex: 1; }

    .custom-course-box { background: rgba(16, 185, 129, 0.08); border: 1.5px dashed var(--color-accent); padding: 1rem; border-radius: 10px; margin-bottom: 1rem; }
    .custom-label { color: var(--color-accent) !important; font-weight: 700 !important; font-size: 0.9rem !important; }

    .form-actions { margin-top: 1.5rem; text-align: right; }
    .btn-primary { background: var(--color-accent); color: #fff; padding: 0.75rem 1.5rem; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }
    .btn-secondary { background: var(--color-surface-hover); color: var(--color-text); padding: 0.75rem 1.5rem; border: 1px solid var(--color-border); border-radius: 8px; font-weight: 600; cursor: pointer; }
    .btn-success { background: #10B981; color: #fff; padding: 0.85rem 1.75rem; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; width: 100%; margin-top: 1rem; }

    .sla-banner { display: flex; gap: 1rem; background: rgba(245, 158, 11, 0.1); border: 1px solid #F59E0B; padding: 1.25rem; border-radius: 12px; margin-bottom: 1.5rem; align-items: center; }
    .sla-icon { font-size: 2.5rem; }
    .sla-info h2 { color: #B45309; margin: 0 0 0.25rem 0; font-size: 1.25rem; }
    .sla-info p { margin: 0 0 0.5rem 0; font-size: 0.9rem; color: #78350F; }
    .sla-timer-badge { display: inline-block; background: #F59E0B; color: #fff; padding: 0.25rem 0.75rem; border-radius: 20px; font-weight: 700; font-size: 0.85rem; }

    .tracking-summary-card { background: var(--color-bg); padding: 1rem; border-radius: 10px; margin-bottom: 1.5rem; }
    .action-buttons { display: flex; gap: 1rem; justify-content: flex-end; }

    .search-bar { display: flex; gap: 0.75rem; margin-top: 1rem; margin-bottom: 1.5rem; }
    .search-bar input { flex: 1; padding: 0.75rem; border-radius: 8px; border: 1px solid var(--color-border); background: var(--color-bg); }

    .result-box { background: var(--color-bg); border: 1px solid var(--color-border); border-radius: 12px; padding: 1.25rem; }
    .status-badge { display: inline-block; background: var(--color-accent); color: white; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.8rem; font-weight: 700; margin-bottom: 0.5rem; }
    .notice-card { background: var(--color-surface); padding: 1rem; border-radius: 10px; border-left: 4px solid var(--color-accent); margin: 1rem 0; }
    .notice-title { font-weight: 700; margin-bottom: 0.25rem; color: var(--color-text); }
    .teacher-card { display: flex; gap: 0.75rem; background: rgba(16, 185, 129, 0.1); padding: 1rem; border-radius: 10px; margin-bottom: 1rem; align-items: center; }
    .teacher-icon { font-size: 2rem; }
    .teacher-name { font-size: 1.1rem; font-weight: 700; color: var(--color-accent); margin: 0; }

    .payment-card { background: var(--color-surface); border: 1px solid var(--color-border); padding: 1.25rem; border-radius: 12px; margin-top: 1.5rem; }
    .bank-options { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: 1rem 0; }
    .bank-pill { background: var(--color-bg); padding: 0.85rem; border-radius: 8px; border: 1px solid var(--color-border); font-size: 0.85rem; }
    .preview-box { margin-top: 0.5rem; }
    .preview-box img { max-width: 250px; border-radius: 8px; border: 1px solid var(--color-border); margin-top: 0.5rem; }
    .credentials-card { background: rgba(16, 185, 129, 0.15); border: 1px solid #10B981; padding: 1.25rem; border-radius: 12px; text-align: center; margin-top: 1rem; }
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

  selectedCourseOption = '';
  customCourseInput = '';

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
    if (!this.form.firstName || !this.form.email || (!this.selectedCourseOption && !this.customCourseInput) || !this.phoneNumberInput || !this.form.gradeLevel) {
      this.toastService.show('Please fill in all required fields including grade level, phone number, and selected/custom course.', 'error');
      return;
    }

    // If student entered a custom requested course name in the dedicated input field
    if (this.customCourseInput && this.customCourseInput.trim().length > 0) {
      const customCourse = this.courses().find(c => c.name.toLowerCase().includes('custom') || c.name.toLowerCase().includes('requested')) || this.courses()[0];
      this.form.courseId = customCourse.id;
      this.form.gradeLevel = `${this.form.gradeLevel.trim()} (Requested Custom Subject: ${this.customCourseInput.trim()})`;
    } else {
      this.form.courseId = this.selectedCourseOption;
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
      this.toastService.show('Please enter your email or registration code.', 'error');
      return;
    }

    this.searchingTrack.set(true);
    this.registrationService.trackRegistration(this.searchEmail.trim()).subscribe({
      next: (res) => {
        this.searchingTrack.set(false);
        this.trackedResult.set(res);
      },
      error: (err) => {
        this.searchingTrack.set(false);
        this.toastService.show(err.error?.message || 'No registration record found.', 'error');
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => this.receiptForm.receiptImageBase64 = e.target.result;
      reader.readAsDataURL(file);
    }
  }

  onSubmitReceipt(regId: string): void {
    if (!this.receiptForm.transactionId || !this.receiptForm.receiptImageBase64) {
      this.toastService.show('Please enter transaction ID and attach receipt image.', 'error');
      return;
    }

    this.submittingReceipt.set(true);
    this.registrationService.uploadReceipt({
      registrationId: regId,
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
    this.selectedCourseOption = '';
    this.customCourseInput = '';
    this.phoneNumberInput = '';
    this.form = {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      gradeLevel: '',
      address: '',
      desiredServiceType: 1,
      courseId: ''
    };
  }
}
