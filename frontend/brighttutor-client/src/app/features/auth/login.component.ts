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
             Account Login
          </button>
          <button type="button" class="tab-btn" [class.active]="activeTab() === 'student'" (click)="activeTab.set('student')">
             Student Admissions & Pay
          </button>
          <button type="button" class="tab-btn" [class.active]="activeTab() === 'teacher'" (click)="activeTab.set('teacher')">
             Apply as Educator
          </button>
        </div>

        <!-- TAB 1: Standard Account Login Form -->
        @if (activeTab() === 'login') {
          <form (ngSubmit)="onLogin()" class="login-form">
            @if (errorMessage()) {
              <div class="alert-error">
                <span class="alert-icon"></span>
                <span>{{ errorMessage() }}</span>
              </div>
            }

            <div class="form-group">
              <label for="email">Email Address or Student ID Code (e.g. STU-000001) *</label>
              <input
                type="text"
                id="email"
                name="email"
                [(ngModel)]="email"
                placeholder="Enter Email Address or Student ID Code (e.g. STU-000001)"
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
                  {{ showPassword() ? ' Hide' : ' Show' }}
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
            <button type="button" class="btn-back-login-tab" (click)="activeTab.set('login')">← Back to Account Login</button>
            @if (studentStep() === 1) {
              <form (ngSubmit)="onSubmitStudentReg()">
                <h3>Student Course Enrollment Form</h3>

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
                      <div class="flag-badge" title="Selected Country Flag">
                        <img [src]="getSelectedCountryFlagUrl(studentCountryCode)" [alt]="studentCountryCode" class="flag-img" />
                      </div>
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
                      <option [ngValue]="1"> Online 1-on-1 Tutoring</option>
                      <option [ngValue]="2"> In-Person Group Class (Center)</option>
                      <option [ngValue]="3"> Home-to-Home Visit (Personal Tutor)</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>Course Catalog Selection</label>
                    <select [(ngModel)]="selectedStudentCourseOption" name="sCourseId">
                      <option value="">-- Choose From Available Course Catalog --</option>
                      @for (c of courses(); track c.id) {
                        <option [value]="c.id">{{ c.name }}</option>
                      }
                      <option value="OTHER"> Other / Request Custom Course (Not Listed)</option>
                    </select>
                  </div>
                </div>

                <!-- DEDICATED PERMANENT PLACE FOR CUSTOM REQUESTED COURSE -->
                <div class="form-group custom-course-box">
                  <label class="custom-label"><svg class="ui-icon action-glyph" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 3a2.1 2.1 0 0 1 3 3L7 18l-4 1 1-4L16 3ZM14 5l3 3"/></svg> Can't find your course above? Insert your requested course or subject here:</label>
                  <input
                    type="text"
                    [(ngModel)]="customStudentCourseInput"
                    name="customCourseNameInput"
                    placeholder="Insert the custom course name or subject you want to learn (e.g. Python for Data Science, SAT Chemistry, Amharic Literature)"
                  />
                </div>

                <!-- 1-ON-1 SCHEDULE SELECTION FOR ONLINE & HOME TUTORING -->
                @if (studentForm.desiredServiceType === 1 || studentForm.desiredServiceType === 3) {
                  <div class="schedule-config-card">
                    <h4> Select Wanted Learning Days & Hours Request</h4>
                    <p class="subtitle">Select your preferred learning days and time window so our admin can match an available teacher.</p>

                    <div class="form-group">
                      <label>Select Wanted Learning Days *</label>
                      <div class="days-pill-group">
                        @for (day of availableDays; track day) {
                          <button
                            type="button"
                            class="day-pill"
                            [class.selected]="selectedDays.includes(day)"
                            (click)="toggleDay(day)"
                          >
                            {{ selectedDays.includes(day) ? '✓ ' : '' }}{{ day }}
                          </button>
                        }
                      </div>
                    </div>

                    <div class="form-row">
                      <div class="form-group">
                        <label>Wanted Learning Time (From) *</label>
                        <input type="time" [(ngModel)]="wantedTimeFrom" name="sWantedFrom" required />
                      </div>
                      <div class="form-group">
                        <label>Wanted Learning Time (To) *</label>
                        <input type="time" [(ngModel)]="wantedTimeTo" name="sWantedTo" required />
                      </div>
                    </div>
                  </div>
                }

                <!-- GROUP CLASS FIXED SCHEDULE & PRICING DISPLAY -->
                @if (studentForm.desiredServiceType === 2) {
                  <div class="group-schedule-card">
                    <h4> Group Class Schedule (Company Fixed)</h4>
                    <p> <strong>Days:</strong> Mon, Wed, Fri |  <strong>Time:</strong> 10:00 AM – 12:00 PM (Center Session)</p>
                  </div>
                }

                <button type="submit" class="btn-submit" [disabled]="submittingStudent()">
                  @if (submittingStudent()) { Submitting Application... } @else { Submit Application & Check Teacher Availability (3-5 hrs SLA) }
                </button>
              </form>
            }

            @if (studentStep() === 2) {
              <div class="pending-step-box">
                <div class="success-icon"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="5"/><path d="m8 12-2 9 6-3 6 3-2-9"/></svg></div>
                <h3>Registration Application Submitted!</h3>
                <div class="pending-badge">Status:  Pending Admin & Teacher Availability Review (3-5 Hours)</div>
                <p>Thank you for applying to BrightTutor Academy!</p>
                <p>Our academic coordinator is currently checking tutor availability for your requested course and schedule window.</p>

                <div class="credentials-info-box" style="background: rgba(var(--color-accent-rgb), 0.08); border: 1.5px solid var(--color-primary); border-radius: 10px; padding: 1rem; margin: 1rem 0; text-align: left;">
                  <h4 style="margin: 0 0 0.5rem 0; color: var(--color-primary); font-weight: 700; font-size: 0.95rem;"> Your Student Portal Login Credentials</h4>
                  <p style="margin: 0 0 0.25rem 0; font-size: 0.88rem;"><strong>Login Email:</strong> <code>{{ studentForm.email }}</code></p>
                  <p style="margin: 0 0 0.4rem 0; font-size: 0.88rem;"><strong>Default Initial Password:</strong> <code style="background: var(--color-action); color: #fff; padding: 2px 6px; border-radius: 4px; font-weight: bold;">StudentPass123!</code></p>
                  <p style="margin: 0; font-size: 0.8rem; color: #4b5563;">Use your email address and default password <code>StudentPass123!</code> to sign in to your dashboard at any time. You can change your password anytime after logging in.</p>
                </div>

                <div class="no-payment-notice">
                   <strong>No payment is required today.</strong> Payment instructions & receipt upload will be unlocked on your tracking page <strong>only after admin approves teacher availability</strong>.
                </div>
                <div class="action-buttons-row">
                  <button type="button" class="btn-submit" (click)="activeTab.set('login')"> Go to Student Login</button>
                </div>
              </div>
            }
          </div>
        }

        <!-- TAB 3: Teacher Candidate Job Application -->
        @if (activeTab() === 'teacher') {
          <div class="public-registration-box">
            <button type="button" class="btn-back-login-tab" (click)="activeTab.set('login')">← Back to Account Login</button>
            @if (!teacherSubmitted()) {
              <form (ngSubmit)="onSubmitTeacherApp()">
                <h3>Educator Job Application Form</h3>

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
                      <div class="flag-badge" title="Selected Country Flag">
                        <img [src]="getSelectedCountryFlagUrl(teacherCountryCode)" [alt]="teacherCountryCode" class="flag-img" />
                      </div>
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
                <h3>Application Submitted!</h3>
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
      background: linear-gradient(135deg, var(--color-primary) 0%, #071712 50%, var(--color-primary) 100%);
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
      box-shadow: var(--shadow-card);
      border: 1px solid rgba(255, 255, 255, 0.2);
      transition: max-width 0.3s ease;
    }
    .glass-card.wide-card { max-width: 760px; }

    .login-header { text-align: center; margin-bottom: 1.5rem; }
    .logo {
      width: 50px;
      height: 50px;
      background: var(--color-action);
      color: white;
      border-radius: var(--radius-lg);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 0.75rem;
      box-shadow: var(--shadow-card);
      svg { width: 28px; height: 28px; }
    }
    .login-header h2 { font-size: 1.6rem; color: var(--color-primary); margin: 0 0 0.25rem 0; font-weight: 800; }
    .login-header p { color: var(--color-muted); font-size: 0.85rem; margin: 0; }

    .login-tabs { display: flex; gap: 0.4rem; background: var(--color-border); padding: 0.3rem; border-radius: 10px; margin-bottom: 1.5rem; }
    .tab-btn { flex: 1; border: none; background: none; padding: 0.55rem 0.4rem; font-size: 0.78rem; font-weight: 700; color: var(--color-muted); border-radius: 8px; cursor: pointer; transition: all 0.2s; }
    .tab-btn.active { background: var(--color-surface); color: var(--color-primary); box-shadow: 0 2px 6px rgba(0,0,0,0.1); }

    .alert-error { background: var(--color-error-bg); border: 1px solid #fca5a5; color: var(--color-error); padding: 0.75rem 1rem; border-radius: 10px; font-size: 0.85rem; font-weight: 600; margin-bottom: 1.25rem; display: flex; align-items: center; gap: 0.5rem; }
    .form-group { margin-bottom: 1rem; flex: 1; width: 100%; box-sizing: border-box; }
    .form-group label { display: block; font-size: 0.8rem; font-weight: 600; color: var(--color-text); margin-bottom: 0.35rem; }
    .form-group input, .form-group select, .form-group textarea {
      width: 100%; box-sizing: border-box; padding: 0.65rem 0.85rem; border-radius: 8px; border: 1px solid var(--color-border); font-size: 0.9rem; background: var(--color-surface); color: var(--color-text);
      &:focus { outline: none; border-color: var(--color-accent); box-shadow: 0 0 0 3px rgba(var(--color-accent-rgb), 0.2); }
    }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; width: 100%; box-sizing: border-box; }

    .phone-input-container {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      width: 100%;
      box-sizing: border-box;

      .flag-badge {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: 8px;
        padding: 0.35rem 0.5rem;
        height: 38px;
        box-sizing: border-box;
      }

      .flag-img {
        width: 24px;
        height: 16px;
        object-fit: cover;
        border-radius: 3px;
      }

      .country-code-select {
        width: 125px;
        flex-shrink: 0;
        font-weight: 600;
        cursor: pointer;
        height: 38px;
      }

      input {
        flex: 1;
        min-width: 0;
        width: 100%;
        height: 38px;
      }
    }

    .btn-back-login-tab { background: none; border: 1.5px solid var(--color-border); color: var(--color-primary); padding: 0.45rem 0.9rem; border-radius: 8px; font-weight: 700; font-size: 0.84rem; cursor: pointer; margin-bottom: 1rem; transition: all 0.2s; display: inline-flex; align-items: center; gap: 0.35rem; }
    .btn-back-login-tab:hover { background: var(--color-action); color: white; border-color: var(--color-primary); transform: translateX(-3px); }

    .custom-course-box { background: rgba(var(--color-accent-rgb), 0.08); border: 1.5px dashed var(--color-accent); padding: 0.85rem; border-radius: 10px; margin-bottom: 1rem; width: 100%; box-sizing: border-box; }
    .custom-label { color: var(--color-accent) !important; font-weight: 700 !important; font-size: 0.85rem !important; }

    .schedule-config-card { background: rgba(59, 130, 246, 0.05); border: 1px solid #93c5fd; padding: 0.85rem 1rem; border-radius: 10px; margin-bottom: 1rem; h4 { margin: 0 0 0.25rem 0; font-size: 0.95rem; color: #1e40af; } .subtitle { font-size: 0.78rem; color: var(--color-muted); margin: 0 0 0.75rem 0; } }
    .days-pill-group { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-top: 0.35rem; }
    .day-pill { border: 1px solid var(--color-border); background: var(--color-surface); padding: 0.35rem 0.65rem; border-radius: 20px; font-size: 0.78rem; font-weight: 700; color: var(--color-muted); cursor: pointer; transition: all 0.2s; }
    .day-pill.selected { background: var(--color-action); color: white; border-color: var(--color-accent); }

    .group-schedule-card { background: rgba(245, 158, 11, 0.08); border: 1px solid #fcd34d; padding: 0.85rem 1rem; border-radius: 10px; margin-bottom: 1rem; h4 { margin: 0 0 0.25rem 0; font-size: 0.95rem; color: var(--color-warning); } p { margin: 0; font-size: 0.82rem; color: #78350f; } }

    .password-input-wrapper { position: relative; display: flex; align-items: center; width: 100%; box-sizing: border-box; }
    .password-input-wrapper input { padding-right: 4.5rem; }
    .btn-toggle-password { position: absolute; right: 8px; background: none; border: none; color: var(--color-accent); font-size: 0.8rem; font-weight: 600; cursor: pointer; }

    .btn-submit { width: 100%; padding: 0.85rem; background: var(--color-action); color: white; border: none; border-radius: 10px; font-weight: 700; font-size: 0.95rem; cursor: pointer; margin-top: 0.5rem; }
    .btn-submit:hover { background: linear-gradient(135deg, var(--color-primary-light), var(--color-accent)); }

    .public-registration-box { width: 100%; box-sizing: border-box; }
    .public-registration-box h3 { margin: 0 0 1rem 0; font-size: 1.1rem; color: var(--color-primary); }
    .bank-accounts { background: var(--color-surface-low); padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem; font-size: 0.82rem; color: #334155; }
    .bank-accounts p { margin: 0.2rem 0; }
    .success-alert { text-align: center; padding: 1.5rem; color: #065f46; }

    @media (max-width: 768px) {
      .login-fullscreen { padding: 0.75rem; }
      .glass-card { padding: 1.5rem 1.25rem; border-radius: var(--radius-lg); max-width: 100%; }
      .form-row { grid-template-columns: 1fr; gap: 0.5rem; }
      .login-tabs { flex-direction: column; gap: 0.25rem; }
    }

    @media (max-width: 480px) {
      .phone-input-container {
        flex-wrap: wrap;
        .country-code-select {
          flex: 1;
          width: auto;
        }
        input {
          width: 100%;
          flex: 1 1 100%;
        }
      }
    }
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

  availableDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  selectedDays: string[] = ['Mon', 'Wed', 'Fri'];
  wantedTimeFrom: string = '10:00';
  wantedTimeTo: string = '12:00';

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

  toggleDay(day: string): void {
    const idx = this.selectedDays.indexOf(day);
    if (idx > -1) {
      this.selectedDays.splice(idx, 1);
    } else {
      this.selectedDays.push(day);
    }
  }

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

  getSelectedCountryFlagUrl(dialCode: string): string {
    const item = this.countryList.find(c => c.dialCode === dialCode);
    return item ? item.flagUrl : 'https://flagcdn.com/w40/et.png';
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
    if (!this.studentForm.firstName || !this.studentForm.email || (!this.selectedStudentCourseOption && !this.customStudentCourseInput) || !this.studentPhoneInput || !this.studentForm.gradeLevel) {
      this.toastService.showError('Please fill in all required fields including grade level, phone number, and selected/custom course.');
      return;
    }

    if (this.studentForm.desiredServiceType === 1 || this.studentForm.desiredServiceType === 3) {
      if (this.selectedDays.length === 0 || !this.wantedTimeFrom || !this.wantedTimeTo) {
        this.toastService.showError('Please select wanted learning days and wanted time window (From - To hr).');
        return;
      }
    }

    let gradeDetails = this.studentForm.gradeLevel.trim();

    if (this.customStudentCourseInput && this.customStudentCourseInput.trim().length > 0) {
      const customCourse = this.courses().find(c => c.name.toLowerCase().includes('custom') || c.name.toLowerCase().includes('requested')) || this.courses()[0];
      this.studentForm.courseId = customCourse.id;
      gradeDetails += ` (Requested Custom Subject: ${this.customStudentCourseInput.trim()})`;
    } else {
      this.studentForm.courseId = this.selectedStudentCourseOption;
    }

    if (this.studentForm.desiredServiceType === 1 || this.studentForm.desiredServiceType === 3) {
      gradeDetails += ` | Wanted Days: ${this.selectedDays.join(', ')} | Wanted Hours: ${this.wantedTimeFrom} to ${this.wantedTimeTo}`;
    } else {
      gradeDetails += ` | Group Class Schedule: Mon, Wed, Fri (10:00 AM - 12:00 PM)`;
    }

    this.studentForm.gradeLevel = gradeDetails;
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
