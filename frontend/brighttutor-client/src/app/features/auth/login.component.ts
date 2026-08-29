import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { StudentRegistrationService } from '../../services/student-registration.service';
import { TeacherApplicationService } from '../../services/teacher-application.service';
import { CourseService, CourseDto } from '../../services/course.service';
import { COUNTRY_PHONE_LIST } from '../../models/country-phone.data';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-fullscreen">
      <div class="glass-card" [class.wide-card]="activeTab() !== 'login'">
        <div class="login-header">
          <div class="logo">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/>
              <path d="M5 13.18v4.27l7 3.82 7-3.82v-4.27l-7 3.82-7-3.82z"/>
            </svg>
          </div>
          <h2>BrightTutor</h2>
          <p>Academic Tutoring & Professional Training Academy</p>
        </div>

        <!-- Mode Switcher Tabs -->
        <div class="login-tabs">
          <button type="button" class="tab-btn" [class.active]="activeTab() === 'login'" (click)="activeTab.set('login')">
            🔒 Account Login
          </button>
          <button type="button" class="tab-btn" [class.active]="activeTab() === 'student'" (click)="activeTab.set('student')">
            🎓 Student Admissions & Pay
          </button>
          <button type="button" class="tab-btn" [class.active]="activeTab() === 'teacher'" (click)="activeTab.set('teacher')">
            👨‍🏫 Apply as Educator
          </button>
        </div>

        <!-- TAB 1: Standard Account Login Form -->
        @if (activeTab() === 'login') {
          <form (ngSubmit)="onLogin()" class="login-form">
            @if (errorMessage()) {
              <div class="alert-error">
                <span class="alert-icon">⚠️</span>
                <span>{{ errorMessage() }}</span>
              </div>
            }

            <div class="form-group">
              <label for="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                [(ngModel)]="email"
                placeholder="Enter your email address"
                required
              />
            </div>

            <div class="form-group">
              <label for="password">Password</label>
              <div class="password-input-wrapper">
                <input
                  [type]="showPassword() ? 'text' : 'password'"
                  id="password"
                  name="password"
                  [(ngModel)]="password"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  class="btn-toggle-password"
                  (click)="toggleShowPassword()"
                  title="Toggle Password Visibility"
                >
                  {{ showPassword() ? '🙈 Hide' : '👁️ Show' }}
                </button>
              </div>
            </div>

            <button type="submit" class="btn-submit" [disabled]="loading()">
              @if (loading()) { Signing In... } @else { Sign In to Portal }
            </button>
          </form>
        }

        <!-- TAB 2: Student Self-Registration & CBE/Telebirr Slip Upload -->
        @if (activeTab() === 'student') {
          <div class="public-registration-box">
            @if (studentStep() === 1) {
              <form (ngSubmit)="onSubmitStudentReg()">
                <h3>🎓 Student Course Enrollment Form</h3>

                <div class="form-row">
                  <div class="form-group">
                    <label>First Name *</label>
                    <input type="text" [(ngModel)]="studentForm.firstName" name="sFirstName" placeholder="Samuel" required />
                  </div>
                  <div class="form-group">
                    <label>Last Name *</label>
                    <input type="text" [(ngModel)]="studentForm.lastName" name="sLastName" placeholder="Bekele" required />
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label>Email Address *</label>
                    <input type="email" [(ngModel)]="studentForm.email" name="sEmail" placeholder="samuel@gmail.com" required />
                  </div>
                  <div class="form-group">
                    <label>Insert Your Phone Number *</label>
                    <div class="phone-input-container">
                      <select [(ngModel)]="studentCountryCode" name="studentCountryCode" class="country-code-select">
                        @for (c of countryList; track c.code) {
                          <option [value]="c.dialCode">{{ c.flag }} {{ c.dialCode }} ({{ c.name }})</option>
                        }
                      </select>
                      <input type="tel" [(ngModel)]="studentPhoneInput" name="studentPhoneInput" placeholder="Insert your phone number (e.g. 911 000 000)" required />
                    </div>
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label>Insert Your Grade Level *</label>
                    <input type="text" [(ngModel)]="studentForm.gradeLevel" name="sGrade" placeholder="Insert your grade level (e.g. Grade 9, Grade 10, Grade 11, Grade 12, University)" required />
                  </div>
                  <div class="form-group">
                    <label>Home Address / GPS *</label>
                    <input type="text" [(ngModel)]="studentForm.address" name="sAddress" placeholder="Bole Subcity, Addis Ababa" required />
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label>Service Delivery Method *</label>
                    <select [(ngModel)]="studentForm.desiredServiceType" name="sServiceType" required>
                      <option [ngValue]="1">💻 Online 1-on-1 Tutoring</option>
                      <option [ngValue]="2">👥 In-Person Group Class (Center)</option>
                      <option [ngValue]="3">🏠 Home-to-Home Visit (Personal Tutor)</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>Course Catalog Selection *</label>
                    <select [(ngModel)]="selectedStudentCourseOption" name="sCourseId" required>
                      <option value="">-- Choose Course --</option>
                      @for (c of courses(); track c.id) {
                        <option [value]="c.id">{{ c.name }}</option>
                      }
                      <option value="OTHER">➕ Other / Request Custom Course (Not Listed Above)</option>
                    </select>
                  </div>
                </div>

                @if (selectedStudentCourseOption === 'OTHER') {
                  <div class="form-group custom-course-box">
                    <label class="custom-label">➕ Insert Desired Course / Special Subject Name *</label>
                    <input type="text" [(ngModel)]="customStudentCourseInput" name="customCourseNameInput" placeholder="Insert the course name or subject you want to learn (e.g. Python for Data Science, SAT Chemistry, Amharic Literature)" required />
                  </div>
                }

                <button type="submit" class="btn-submit" [disabled]="submittingStudent()">
                  @if (submittingStudent()) { Submitting... } @else { Submit & Proceed to Payment Slip }
                </button>
              </form>
            }

            @if (studentStep() === 2) {
              <div class="payment-slip-box">
                <h3>💳 Upload CBE Birr / Telebirr Tuition Receipt</h3>
                <div class="bank-accounts">
                  <p>🏦 <strong>CBE Account:</strong> 1000123456789 (BrightTutor Academy)</p>
                  <p>📱 <strong>Telebirr Transfer:</strong> 0911000000 / Merchant 889900</p>
                </div>

                <form (ngSubmit)="onSubmitStudentReceipt()">
                  <div class="form-row">
                    <div class="form-group">
                      <label>Payment Channel *</label>
                      <select [(ngModel)]="receiptForm.paymentChannel" name="pChannel">
                        <option value="CBE Birr">CBE Birr / CBE Bank</option>
                        <option value="Telebirr">Telebirr Transfer</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label>Transaction Reference ID *</label>
                      <input type="text" [(ngModel)]="receiptForm.transactionId" name="pTxnId" placeholder="FT26082699X" required />
                    </div>
                    <div class="form-group">
                      <label>Amount Paid (ETB) *</label>
                      <input type="number" [(ngModel)]="receiptForm.amountPaid" name="pAmount" placeholder="3500.00" required />
                    </div>
                  </div>

                  <div class="form-group">
                    <label>Upload Receipt Screenshot *</label>
                    <input type="file" (change)="onFileSelected($event)" accept="image/*" required />
                  </div>

                  <button type="submit" class="btn-submit" [disabled]="submittingReceipt()">
                    @if (submittingReceipt()) { Uploading... } @else { Upload Receipt & Request Verification }
                  </button>
                </form>
              </div>
            }

            @if (studentStep() === 3) {
              <div class="success-alert">
                <h3>🎉 Submission Successful!</h3>
                <p>Status: <strong>Pending Payment Verification (1 - 3 business hours)</strong></p>
                <p>Your Student ID credentials will be dispatched to <strong>{{ studentForm.email }}</strong> upon admin approval.</p>
                <button type="button" class="btn-submit" (click)="studentStep.set(1)">Register Another Student</button>
              </div>
            }
          </div>
        }

        <!-- TAB 3: Teacher Candidate Job Application -->
        @if (activeTab() === 'teacher') {
          <div class="public-registration-box">
            @if (!teacherSubmitted()) {
              <form (ngSubmit)="onSubmitTeacherApp()">
                <h3>👨‍🏫 Educator Job Application Form</h3>

                <div class="form-row">
                  <div class="form-group">
                    <label>First Name *</label>
                    <input type="text" [(ngModel)]="teacherForm.firstName" name="tFirstName" placeholder="Abebe" required />
                  </div>
                  <div class="form-group">
                    <label>Last Name *</label>
                    <input type="text" [(ngModel)]="teacherForm.lastName" name="tLastName" placeholder="Kebede" required />
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label>Email Address *</label>
                    <input type="email" [(ngModel)]="teacherForm.email" name="tEmail" placeholder="abebe@gmail.com" required />
                  </div>
                  <div class="form-group">
                    <label>Insert Your Phone Number *</label>
                    <div class="phone-input-container">
                      <select [(ngModel)]="teacherCountryCode" name="teacherCountryCode" class="country-code-select">
                        @for (c of countryList; track c.code) {
                          <option [value]="c.dialCode">{{ c.flag }} {{ c.dialCode }} ({{ c.name }})</option>
                        }
                      </select>
                      <input type="tel" [(ngModel)]="teacherPhoneInput" name="teacherPhoneInput" placeholder="Insert your phone number (e.g. 911 222 333)" required />
                    </div>
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label>Primary Specialization *</label>
                    <input type="text" [(ngModel)]="teacherForm.specialization" name="tSpec" placeholder="Web Dev / Physics / SAT Math" required />
                  </div>
                  <div class="form-group">
                    <label>Years of Experience *</label>
                    <input type="number" [(ngModel)]="teacherForm.yearsOfExperience" name="tExp" placeholder="3" required />
                  </div>
                </div>

                <div class="form-group">
                  <label>CV / Resume Document URL *</label>
                  <input type="url" [(ngModel)]="teacherForm.cvDocumentUrl" name="tCv" placeholder="https://drive.google.com/your-cv.pdf" required />
                </div>

                <div class="form-group">
                  <label>Professional Bio Summary *</label>
                  <textarea [(ngModel)]="teacherForm.bioSummary" name="tBio" rows="3" placeholder="Describe your teaching methodology..." required></textarea>
                </div>

                <button type="submit" class="btn-submit" [disabled]="submittingTeacher()">
                  @if (submittingTeacher()) { Submitting... } @else { Submit Application for Screening }
                </button>
              </form>
            } @else {
              <div class="success-alert">
                <h3>🎉 Application Submitted!</h3>
                <p>Status: <strong>Pending CV Document Screening</strong></p>
                <p>Our academic board will review your credentials and send credentials to <strong>{{ teacherForm.email }}</strong>.</p>
                <button type="button" class="btn-submit" (click)="teacherSubmitted.set(false)">Submit Another Application</button>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .login-fullscreen {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0B3D2E 0%, #071712 50%, #0B3D2E 100%);
      padding: 1.5rem;
      overflow-y: auto;
    }
    .glass-card {
      background: rgba(255, 255, 255, 0.98);
      backdrop-filter: blur(12px);
      border-radius: 20px;
      padding: 2.25rem 2rem;
      width: 100%;
      max-width: 440px;
      box-shadow: 0 25px 50px -12px rgba(11, 61, 46, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.2);
      transition: max-width 0.3s ease;
    }
    .glass-card.wide-card { max-width: 760px; }

    .login-header { text-align: center; margin-bottom: 1.5rem; }
    .logo {
      width: 50px;
      height: 50px;
      background: linear-gradient(135deg, #0B3D2E, #10B981);
      color: white;
      border-radius: 12px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 0.75rem;
      box-shadow: 0 4px 14px rgba(11, 61, 46, 0.35);
      svg { width: 28px; height: 28px; }
    }
    .login-header h2 { font-size: 1.6rem; color: #0B3D2E; margin: 0 0 0.25rem 0; font-weight: 800; }
    .login-header p { color: #5C786A; font-size: 0.85rem; margin: 0; }

    .login-tabs { display: flex; gap: 0.4rem; background: #e2e8f0; padding: 0.3rem; border-radius: 10px; margin-bottom: 1.5rem; }
    .tab-btn { flex: 1; border: none; background: none; padding: 0.55rem 0.4rem; font-size: 0.78rem; font-weight: 700; color: #64748b; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
    .tab-btn.active { background: #fff; color: #0B3D2E; box-shadow: 0 2px 6px rgba(0,0,0,0.1); }

    .alert-error { background: #fef2f2; border: 1px solid #fca5a5; color: #991b1b; padding: 0.75rem 1rem; border-radius: 10px; font-size: 0.85rem; font-weight: 600; margin-bottom: 1.25rem; display: flex; align-items: center; gap: 0.5rem; }
    .form-group { margin-bottom: 1rem; flex: 1; }
    .form-group label { display: block; font-size: 0.8rem; font-weight: 600; color: #0B241B; margin-bottom: 0.35rem; }
    .form-group input, .form-group select, .form-group textarea {
      width: 100%; padding: 0.65rem 0.85rem; border-radius: 8px; border: 1px solid #DCE8E1; font-size: 0.9rem; background: #fff; color: #0f172a;
      &:focus { outline: none; border-color: #10B981; box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2); }
    }
    .form-row { display: flex; gap: 0.75rem; }
    .phone-input-container { display: flex; gap: 0.5rem; width: 100%; }
    .country-code-select { flex: 0 0 140px; font-weight: 600; cursor: pointer; }
    .phone-input-container input { flex: 1; }

    .custom-course-box { background: rgba(16, 185, 129, 0.08); border: 1px solid #10B981; padding: 0.85rem; border-radius: 10px; margin-bottom: 1rem; }
    .custom-label { color: #059669 !important; font-weight: 700 !important; }

    .password-input-wrapper { position: relative; display: flex; align-items: center; }
    .password-input-wrapper input { padding-right: 4.5rem; }
    .btn-toggle-password { position: absolute; right: 8px; background: none; border: none; color: #059669; font-size: 0.8rem; font-weight: 600; cursor: pointer; }

    .btn-submit { width: 100%; padding: 0.85rem; background: linear-gradient(135deg, #0B3D2E, #059669); color: white; border: none; border-radius: 10px; font-weight: 700; font-size: 0.95rem; cursor: pointer; margin-top: 0.5rem; }
    .btn-submit:hover { background: linear-gradient(135deg, #14523F, #10B981); }

    .public-registration-box h3 { margin: 0 0 1rem 0; font-size: 1.1rem; color: #0B3D2E; }
    .bank-accounts { background: #f1f5f9; padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem; font-size: 0.82rem; color: #334155; }
    .bank-accounts p { margin: 0.2rem 0; }
    .success-alert { text-align: center; padding: 1.5rem; color: #065f46; }
  `]
})
export class LoginComponent implements OnInit {
  countryList = COUNTRY_PHONE_LIST;
  studentCountryCode = '+251';
  studentPhoneInput = '';

  teacherCountryCode = '+251';
  teacherPhoneInput = '';

  selectedStudentCourseOption = '';
  customStudentCourseInput = '';

  activeTab = signal<'login' | 'student' | 'teacher'>('login');
  email = '';
  password = '';
  loading = signal<boolean>(false);
  showPassword = signal<boolean>(false);
  errorMessage = signal<string>('');

  // Student Self-Registration State
  courses = signal<CourseDto[]>([]);
  studentStep = signal<number>(1);
  submittingStudent = signal<boolean>(false);
  submittingReceipt = signal<boolean>(false);
  createdRegId = signal<string>('');

  studentForm = {
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

  // Teacher Candidate Application State
  submittingTeacher = signal<boolean>(false);
  teacherSubmitted = signal<boolean>(false);
  teacherForm = {
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    specialization: '',
    yearsOfExperience: 3,
    cvDocumentUrl: '',
    bioSummary: ''
  };

  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private studentRegService = inject(StudentRegistrationService);
  private teacherAppService = inject(TeacherApplicationService);
  private courseService = inject(CourseService);

  ngOnInit(): void {
    this.courseService.getCourses().subscribe(res => this.courses.set(res));
  }

  toggleShowPassword(): void {
    this.showPassword.update(v => !v);
  }

  onLogin(): void {
    this.errorMessage.set('');
    if (!this.email || !this.password) {
      const msg = 'Please enter both email address and password.';
      this.errorMessage.set(msg);
      this.toastService.showError(msg);
      return;
    }

    this.loading.set(true);
    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (user) => {
        this.loading.set(false);
        this.toastService.showSuccess(`Welcome back, ${user.firstName}!`);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        const errorMsg = this.extractErrorMessage(err);
        this.errorMessage.set(errorMsg);
        this.toastService.showError(errorMsg);
      }
    });
  }

  onSubmitStudentReg(): void {
    if (!this.studentForm.firstName || !this.studentForm.email || !this.selectedStudentCourseOption || !this.studentPhoneInput || !this.studentForm.gradeLevel) {
      this.toastService.showError('Please fill in all required fields including grade level and phone number.');
      return;
    }

    if (this.selectedStudentCourseOption === 'OTHER') {
      if (!this.customStudentCourseInput || !this.customStudentCourseInput.trim()) {
        this.toastService.showError('Please insert the name of your desired custom course.');
        return;
      }
      const customCourse = this.courses().find(c => c.name.toLowerCase().includes('custom') || c.name.toLowerCase().includes('requested')) || this.courses()[0];
      this.studentForm.courseId = customCourse.id;
      this.studentForm.gradeLevel = `${this.studentForm.gradeLevel.trim()} (Requested Custom Subject: ${this.customStudentCourseInput.trim()})`;
    } else {
      this.studentForm.courseId = this.selectedStudentCourseOption;
    }

    this.studentForm.phoneNumber = `${this.studentCountryCode} ${this.studentPhoneInput.trim()}`;

    this.submittingStudent.set(true);
    this.studentRegService.submitRegistration(this.studentForm).subscribe({
      next: (res) => {
        this.submittingStudent.set(false);
        this.createdRegId.set(res.registrationId);
        this.studentStep.set(2);
        this.toastService.showSuccess(res.message);
      },
      error: (err) => {
        this.submittingStudent.set(false);
        this.toastService.showError(err.error?.message || 'Registration failed.');
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

  onSubmitStudentReceipt(): void {
    if (!this.receiptForm.transactionId) {
      this.toastService.showError('Please enter transaction reference ID.');
      return;
    }
    this.submittingReceipt.set(true);
    this.studentRegService.uploadReceipt({
      registrationId: this.createdRegId(),
      ...this.receiptForm
    }).subscribe({
      next: (res) => {
        this.submittingReceipt.set(false);
        this.studentStep.set(3);
        this.toastService.showSuccess(res.message);
      },
      error: (err) => {
        this.submittingReceipt.set(false);
        this.toastService.showError(err.error?.message || 'Receipt upload failed.');
      }
    });
  }

  onSubmitTeacherApp(): void {
    if (!this.teacherForm.firstName || !this.teacherForm.email || !this.teacherForm.specialization || !this.teacherPhoneInput) {
      this.toastService.showError('Please fill in all required fields including phone number.');
      return;
    }
    this.teacherForm.phoneNumber = `${this.teacherCountryCode} ${this.teacherPhoneInput.trim()}`;

    this.submittingTeacher.set(true);
    this.teacherAppService.applyTeacher(this.teacherForm).subscribe({
      next: (res) => {
        this.submittingTeacher.set(false);
        this.teacherSubmitted.set(true);
        this.toastService.showSuccess(res.message);
      },
      error: (err) => {
        this.submittingTeacher.set(false);
        this.toastService.showError(err.error?.message || 'Application failed.');
      }
    });
  }

  private extractErrorMessage(err: any): string {
    if (typeof err?.error === 'string' && err.error.trim().length > 0) return err.error;
    if (err?.error?.message) return err.error.message;
    if (Array.isArray(err?.error?.errors) && err.error.errors.length > 0) return err.error.errors[0];
    if (err?.message) return err.message;
    return 'Incorrect email or password.';
  }
}
