import { Component, OnInit, signal, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { StudentRegistrationService, RegistrationTrackDto } from '../../services/student-registration.service';
import { CourseService, CourseDto } from '../../services/course.service';
import { FaceRecognitionService } from '../../services/face-recognition.service';
import { ToastService } from '../../services/toast.service';
import { COUNTRY_PHONE_LIST } from '../../models/country-phone.data';

@Component({
  selector: 'app-student-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="register-portal-page">
      <div class="header-nav-row">
        <a routerLink="/login" class="btn-back-login">← Back to Login Page</a>
      </div>

      <div class="portal-header">
        <h1>Student Admissions & Tutoring Portal</h1>
        <p>Register for 1-on-1 tutoring, check teacher availability (3-5 hr SLA), and manage payment slips.</p>
      </div>

      <div class="portal-tabs">
        <button type="button" class="tab-btn" [class.active]="activeTab() === 'apply'" (click)="activeTab.set('apply')">
           Submit New Admission Request
        </button>
        <button type="button" class="tab-btn" [class.active]="activeTab() === 'track'" (click)="activeTab.set('track')">
           Track Admission Status & Pay
        </button>
      </div>

      <!-- TAB 1: SUBMIT NEW ADMISSION REQUEST -->
      @if (activeTab() === 'apply') {
        <div class="portal-card">
          @if (currentStep() === 1) {
            <form (ngSubmit)="onSubmitRegistration()">
              <div class="fee-notice-banner">
                <div class="notice-icon"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="4" width="14" height="18" rx="2"/><rect x="9" y="2" width="6" height="4" rx="1"/><path d="m8 14 3 3 5-6"/></svg></div>
                <div class="notice-body">
                  <h4>Admission Notice & Transparency Policy</h4>
                  <ul>
                    <li><strong>500 ETB One-Time Registration Fee</strong> applies to all new student admissions across all learning modes.</li>
                    <li><strong>NO PAYMENT IS REQUIRED TODAY.</strong> Your application is placed under <strong>Pending Teacher Availability Check (3-5 working hours)</strong>.</li>
                    <li>Payment instructions and slip upload are unlocked on your dashboard <strong>only after our admin verifies that a teacher is available</strong> for your schedule.</li>
                  </ul>
                </div>
              </div>

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
                    <div class="flag-badge" title="Selected Country Flag">
                      <img [src]="getSelectedCountryFlagUrl(selectedCountryCode)" [alt]="selectedCountryCode" class="flag-img" />
                    </div>
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
                  <select [(ngModel)]="form.desiredServiceType" name="desiredServiceType" (change)="onServiceTypeChange()" required>
                    <option [ngValue]="1"> Online 1-on-1 Tutoring (Personal Tutor)</option>
                    <option [ngValue]="2"> In-Person Group Class (Academic Center)</option>
                    <option [ngValue]="3"> Home-to-Home Visit (Private Tutor at Home)</option>
                  </select>
                </div>

                <div class="form-group">
                  <label>Select Course Catalog *</label>
                  <select [(ngModel)]="selectedCourseOption" name="selectedCourseOption" (change)="onCourseSelectedChange()">
                    <option value="">-- Choose From Available Course Catalog --</option>
                    @for (course of courses(); track course.id) {
                      <option [value]="course.id">{{ course.name }}</option>
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
                  [(ngModel)]="customCourseInput"
                  name="customCourseInput"
                  placeholder="Insert the custom course name or subject you want to learn (e.g. Python for Data Science, SAT Chemistry, Amharic Literature)"
                />
              </div>

              <!-- 1-ON-1 SCHEDULE SELECTION FOR ONLINE & HOME TUTORING -->
              @if (form.desiredServiceType === 1 || form.desiredServiceType === 3) {
                <div class="schedule-config-card">
                  <h4> 1-on-1 Personal Class Schedule Request</h4>
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
                      <input type="time" [(ngModel)]="wantedTimeFrom" name="wantedTimeFrom" class="form-control" required />
                    </div>
                    <div class="form-group">
                      <label>Wanted Learning Time (To) *</label>
                      <input type="time" [(ngModel)]="wantedTimeTo" name="wantedTimeTo" class="form-control" required />
                    </div>
                  </div>

                  <div class="rate-summary-box">
                    <div class="rate-item">
                      <span class="rate-label"> Hourly Tuition Rate:</span>
                      <span class="rate-val">{{ form.desiredServiceType === 3 ? '450 ETB / hour (Home Visit)' : '350 ETB / hour (Online 1-on-1)' }}</span>
                    </div>
                    <div class="rate-item">
                      <span class="rate-label"> One-Time Admission Fee:</span>
                      <span class="rate-val">500 ETB</span>
                    </div>
                    <div class="rate-item total">
                      <span class="rate-label"> Payment Policy:</span>
                      <span class="rate-val text-green">Pay ONLY after Admin approves teacher availability!</span>
                    </div>
                  </div>
                </div>
              }

              <!-- GROUP CLASS FIXED SCHEDULE & PRICING DISPLAY -->
              @if (form.desiredServiceType === 2) {
                <div class="group-schedule-card">
                  <h4> Group Class Schedule & Fixed Pricing</h4>
                  <div class="group-info-grid">
                    <div><strong> Class Days:</strong> Mon, Wed, Fri</div>
                    <div><strong> Class Hours:</strong> 10:00 AM – 12:00 PM (Center Session)</div>
                    <div><strong> Monthly Tuition:</strong> 2,500 ETB / Month</div>
                    <div><strong> Admission Fee:</strong> 500 ETB (One-Time)</div>
                  </div>
                  <p class="group-note"> Payment is made AFTER admin confirms group seat availability.</p>
                </div>
              }

              <!-- OFFICIAL BIOMETRIC FACE ID PROFILE ENROLLMENT (OPTIONAL / RECOMMENDED) -->
              <div class="face-enrollment-card">
                <h4> Official Student Face ID Biometric Profile (Optional)</h4>
                <p class="subtitle">Capture or upload your reference face photo now to enable instant 1-second biometric attendance check-in during classes.</p>

                <div class="face-capture-container">
                  @if (referenceFacePhoto()) {
                    <div class="enrolled-preview-box">
                      <img [src]="referenceFacePhoto()" alt="Enrolled Face ID" class="enrolled-photo-img" />
                      <div class="enrolled-badge">
                        <span class="badge-icon"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></svg></span>
                        <span>Biometric Profile Enrolled (128-D Vector Ready)</span>
                      </div>
                      <button type="button" class="btn-retake" (click)="retakeReferencePhoto()"> Retake / Change Photo</button>
                    </div>
                  } @else {
                    <div class="capture-actions-box">
                      <div class="capture-options-row">
                        <button type="button" class="btn-camera-snap" (click)="toggleEnrollCamera()">
                          {{ enrollCameraActive() ? ' Close Camera' : ' Open Live Camera to Snap Photo' }}
                        </button>
                        <label class="btn-file-upload">
                           Upload Reference Photo
                          <input type="file" accept="image/*" (change)="onUploadFacePhoto($event)" style="display: none;" />
                        </label>
                      </div>

                      @if (enrollCameraActive()) {
                        <div class="enroll-camera-viewport">
                          <video #enrollVideo autoplay playsinline muted class="enroll-video-feed"></video>
                          <button type="button" class="btn-snap-now" (click)="snapEnrollPhoto()"> Capture This Frame</button>
                        </div>
                      }
                    </div>
                  }
                </div>
              </div>

              <div class="form-actions">
                <button type="submit" class="btn-primary" [disabled]="submitting()">
                  @if (submitting()) { Submitting Application... } @else { Submit Application & Check Teacher Availability (3-5 hrs SLA) }
                </button>
              </div>
            </form>
          }

          @if (currentStep() === 2) {
            <div class="complete-step">
              <div class="success-header-card">
                <div class="success-icon"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="5"/><path d="m8 12-2 9 6-3 6 3-2-9"/></svg></div>
                <h2>Registration Submitted Successfully!</h2>
                <div class="pending-status-badge">Status:  Pending Admin & Teacher Availability Review</div>
                
                <div class="company-approval-box">
                  <p class="main-thank-you">Thank you for registering with BrightTutor Academy!</p>
                  <p class="approval-note">
                    Your application is currently in <strong>Pending Review</strong> status. Our academic administration team is checking teacher availability for your requested course and schedule window. 
                    <strong>The company will review and approve your application within 3 to 5 working hours.</strong>
                  </p>
                  <p class="no-payment-guarantee">
                     <strong>No payment is required today.</strong> Payment options & slip upload will be unlocked only after admin confirms teacher availability.
                  </p>
                </div>
              </div>

              <div class="tracking-summary-card">
                <h4> Your Portal Login & Registration Credentials</h4>
                <p><strong>Registered Email:</strong> {{ form.email }}</p>
                <p><strong>Default Initial Password:</strong> <code style="background: var(--color-action); color: #fff; padding: 2px 6px; border-radius: 4px; font-weight: bold;">StudentPass123!</code></p>
                <p><strong>Registration ID:</strong> <code>{{ createdRegistrationId() }}</code></p>
                <p>Use your email address and default password <code>StudentPass123!</code> to sign in to your Student Dashboard at any time. You can change your password anytime after logging in.</p>
              </div>

              <div class="action-buttons">
                <button type="button" class="btn-secondary" (click)="activeTab.set('track'); searchEmail = form.email; onSearchTrack()">
                   Track Application Status Now
                </button>
                <button type="button" class="btn-primary" (click)="resetForm()">Back to Admission Form</button>
              </div>
            </div>
          }
        </div>
      }

      <!-- TAB 2: TRACK APPLICATION & UPLOAD PAYMENT -->
      @if (activeTab() === 'track') {
        <div class="tracking-card">
          <h3>Look Up Registration & Payment Portal</h3>
          <p class="subtitle">Enter your Email Address or Registration Code to check tutor assignment and access payment options.</p>

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
                <div class="notice-title"> Application Notice:</div>
                <p>{{ trackedResult()!.notice }}</p>
              </div>

              @if (trackedResult()!.assignedTeacherName) {
                <div class="teacher-card">
                  <div class="teacher-icon"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/><circle cx="9" cy="7" r="4"/></svg></div>
                  <div>
                    <h4>Assigned Certified Educator</h4>
                    <p class="teacher-name">{{ trackedResult()!.assignedTeacherName }}</p>
                  </div>
                </div>
              }

              <!-- CASE 1: APPLICATION PENDING ADMIN REVIEW (NO PAYMENT ALLOWED YET!) -->
              @if (trackedResult()!.statusCode === 1 || trackedResult()!.status === 'PendingTeacherCheck') {
                <div class="pending-review-banner">
                  <div class="banner-icon"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></div>
                  <div class="banner-content">
                    <h4>Registration Pending Review — No Payment Needed Yet</h4>
                    <p>Our academic team is currently matching a certified teacher for your requested schedule and location.</p>
                    <p class="highlight-text"> Payment instructions & receipt upload will be unlocked right here on this page within <strong>3 to 5 working hours</strong> once admin approves teacher availability.</p>
                  </div>
                </div>
              }

              <!-- CASE 2: PAYMENT ALREADY SUBMITTED (UNDER ADMIN REVIEW) -->
              @if (trackedResult()!.statusCode === 3 || trackedResult()!.status === 'PaymentSubmitted') {
                <div class="payment-submitted-card">
                  <div class="submitted-header">
                    <div class="submitted-icon"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></div>
                    <div>
                      <h3>Payment Receipt Submitted & Under Admin Review</h3>
                      <p>Your payment screenshot and transaction ID (<code>{{ trackedResult()!.transactionId }}</code>) have been securely received.</p>
                      <div class="sla-timer-badge"> Verification SLA: 1 to 3 Working Hours</div>
                    </div>
                  </div>

                  <div class="submitted-summary-grid">
                    <div><strong>Channel:</strong> {{ trackedResult()!.paymentChannel }}</div>
                    <div><strong>Amount:</strong> ETB {{ trackedResult()!.amountPaid }}</div>
                    <div><strong>Txn Reference:</strong> <code>{{ trackedResult()!.transactionId }}</code></div>
                  </div>

                  <div class="under-review-notice">
                    <p> Our finance administration is cross-checking your receipt. Once verified, your Student Credentials will appear right here.</p>
                  </div>
                </div>
              }

              <!-- CASE 3: PAYMENT SLIP UPLOAD FORM (ONLY UNLOCKED WHEN ADMIN APPROVES TEACHER!) -->
              @if (trackedResult()!.statusCode === 2 || trackedResult()!.status === 'ApprovedPendingPayment') {
                <div class="payment-card">
                  <h3>Tuition & 500 ETB Admission Fee Payment Instructions</h3>
                  <p>Teacher matched! Please transfer tuition + 500 ETB registration fee to one of the official BrightTutor accounts below:</p>

                  <div class="bank-options">
                    <div class="bank-pill">
                      <strong> Commercial Bank of Ethiopia (CBE)</strong><br />
                      Account No: <code>1000123456789</code><br />
                      Account Name: BrightTutor Academy PLC
                    </div>
                    <div class="bank-pill">
                      <strong> Telebirr Mobile Transfer</strong><br />
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
                        <input type="number" [(ngModel)]="receiptForm.amountPaid" name="pAmount" placeholder="4000" required />
                      </div>
                    </div>

                    <div class="form-group">
                      <label>Upload Screenshot / Photo of Receipt Slip *</label>
                      <input type="file" (change)="onFileSelected($event)" accept="image/*" required />
                      @if (receiptForm.receiptImageBase64) {
                        <div class="preview-box">
                          <p> Screenshot attached cleanly.</p>
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
                <div class="credentials-issued-card">
                  <div class="issued-icon"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="5"/><path d="m8 12-2 9 6-3 6 3-2-9"/></svg></div>
                  <h3>ACCOUNT ACTIVATED & STUDENT ID ISSUED!</h3>
                  <div class="student-id-display">
                    Issued Student ID Code: <code>{{ trackedResult()!.issuedStudentCode }}</code>
                  </div>
                  
                  <div class="login-credentials-box">
                    <p><strong>Login Email / ID:</strong> <code>{{ trackedResult()!.issuedStudentCode }}</code> or <code>{{ trackedResult()!.email }}</code></p>
                    <p><strong>Default Password:</strong> <code>StudentPass123!</code></p>
                    <p><strong>Assigned Educator:</strong> {{ trackedResult()!.assignedTeacherName || 'Certified Tutor' }}</p>
                  </div>

                  <a routerLink="/login" [queryParams]="{email: trackedResult()!.issuedStudentCode}" class="btn-direct-login">
                     Click Here to Login to Your Student Dashboard →
                  </a>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .register-portal-page {
      padding: 1.5rem 1rem;
      max-width: 900px;
      margin: 0 auto;
      width: 100%;
      box-sizing: border-box;
    }

    .header-nav-row { margin-bottom: 1rem; }
    .btn-back-login { display: inline-flex; align-items: center; gap: 0.4rem; background: var(--color-surface); color: var(--color-primary); border: 1.5px solid var(--color-border); padding: 0.55rem 1.1rem; border-radius: 10px; font-weight: 700; font-size: 0.9rem; text-decoration: none; box-shadow: var(--shadow-card); transition: all 0.2s; }
    .btn-back-login:hover { background: var(--color-action); color: white; border-color: var(--color-primary); transform: translateX(-3px); }

    .portal-header h1 {
      color: var(--color-primary);
      margin-bottom: 0.25rem;
      font-size: 1.75rem;
      font-weight: 800;
    }

    .portal-header p {
      color: var(--color-muted);
      margin-bottom: 1.5rem;
    }

    .portal-tabs {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }

    .tab-btn {
      flex: 1;
      min-width: 200px;
      padding: 0.75rem 1rem;
      border: 1px solid var(--color-border);
      background: var(--color-surface);
      border-radius: 10px;
      font-weight: 700;
      cursor: pointer;
      color: var(--color-text);
      transition: all 0.2s;
    }

    .tab-btn.active {
      background: var(--color-action);
      color: #fff;
      border-color: var(--color-accent);
    }

    .portal-card, .tracking-card {
      background: var(--color-surface);
      border: 1.5px solid var(--color-border);
      padding: 1.75rem;
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-card);
      width: 100%;
      box-sizing: border-box;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.25rem;
      margin-bottom: 1rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      margin-bottom: 1rem;
      width: 100%;
      box-sizing: border-box;
    }

    .form-group label {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--color-text);
    }

    .form-group input, .form-group select {
      width: 100%;
      box-sizing: border-box;
      padding: 0.7rem 0.85rem;
      border-radius: 8px;
      border: 1.5px solid var(--color-border);
      background: var(--color-surface);
      color: var(--color-text);
      font-size: 0.95rem;
    }

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
        background: var(--color-bg);
        border: 1.5px solid var(--color-border);
        border-radius: 8px;
        padding: 0.35rem 0.5rem;
        height: 42px;
        box-sizing: border-box;
      }

      .flag-img {
        width: 24px;
        height: 16px;
        object-fit: cover;
        border-radius: 3px;
      }

      .country-code-select {
        width: 130px;
        flex-shrink: 0;
        font-weight: 600;
        cursor: pointer;
        height: 42px;
      }

      input {
        flex: 1;
        min-width: 0;
        width: 100%;
        height: 42px;
      }
    }

    .custom-course-box {
      background: rgba(var(--color-accent-rgb), 0.08);
      border: 1.5px dashed var(--color-accent);
      padding: 1rem;
      border-radius: 10px;
      margin-bottom: 1rem;
    }

    .custom-label {
      color: var(--color-accent) !important;
      font-weight: 700 !important;
      font-size: 0.9rem !important;
    }

    .form-actions {
      margin-top: 1.5rem;
      text-align: right;
    }

    .btn-primary {
      background: var(--color-action);
      color: #fff;
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-secondary {
      background: var(--color-surface);
      color: var(--color-text);
      padding: 0.75rem 1.5rem;
      border: 1.5px solid var(--color-border);
      border-radius: 8px;
      font-weight: 700;
      cursor: pointer;
    }

    .btn-success {
      background: var(--color-action);
      color: #fff;
      padding: 0.85rem 1.75rem;
      border: none;
      border-radius: 8px;
      font-weight: 700;
      cursor: pointer;
      width: 100%;
      margin-top: 1rem;
    }

    .success-header-card {
      background: linear-gradient(135deg, rgba(var(--color-accent-rgb), 0.1), rgba(6, 182, 212, 0.08));
      border: 2px solid var(--color-accent);
      padding: 1.75rem;
      border-radius: var(--radius-lg);
      text-align: center;
      margin-bottom: 1.5rem;

      .success-icon { font-size: 3rem; margin-bottom: 0.5rem; }
      h2 { color: #047857; margin: 0 0 0.5rem 0; font-size: 1.5rem; font-weight: 800; }

      .pending-status-badge {
        display: inline-block;
        background: #F59E0B;
        color: #fff;
        padding: 0.4rem 1rem;
        border-radius: 20px;
        font-weight: 700;
        font-size: 0.9rem;
        margin-bottom: 1.25rem;
      }

      .company-approval-box {
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: 10px;
        padding: 1.2rem;
        text-align: left;

        .main-thank-you {
          font-size: 1.1rem;
          font-weight: 800;
          color: var(--color-accent);
          margin: 0 0 0.5rem 0;
        }

        .approval-note {
          font-size: 0.95rem;
          color: var(--color-text);
          line-height: 1.6;
          margin: 0 0 0.75rem 0;
        }

        .no-payment-guarantee {
          font-size: 0.9rem;
          color: #047857;
          background: rgba(var(--color-accent-rgb), 0.1);
          padding: 0.65rem 0.85rem;
          border-radius: 6px;
          margin: 0;
        }
      }
    }

    .tracking-summary-card { background: var(--color-bg); padding: 1rem; border-radius: 10px; margin-bottom: 1.5rem; }
    .action-buttons { display: flex; gap: 1rem; justify-content: flex-end; flex-wrap: wrap; }

    .fee-notice-banner {
      display: flex;
      gap: 1rem;
      background: rgba(var(--color-accent-rgb), 0.08);
      border: 1.5px solid var(--color-accent);
      padding: 1.2rem;
      border-radius: var(--radius-lg);
      margin-bottom: 1.5rem;
      align-items: flex-start;

      .notice-icon { font-size: 2rem; flex-shrink: 0; }
      .notice-body h4 { margin: 0 0 0.5rem 0; color: #047857; font-size: 1.05rem; }
      .notice-body ul { margin: 0; padding-left: 1.25rem; font-size: 0.88rem; color: var(--color-text); line-height: 1.5; }
      .notice-body li { margin-bottom: 0.35rem; }
    }

    .schedule-config-card, .group-schedule-card {
      background: var(--color-bg);
      border: 1.5px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: 1.25rem;
      margin-bottom: 1.25rem;

      h4 { margin: 0 0 0.35rem 0; color: var(--color-text); font-size: 1.05rem; }
      .subtitle { margin: 0 0 1rem 0; font-size: 0.85rem; color: var(--color-muted); }
    }

    .days-pill-group {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-top: 0.4rem;
    }

    .day-pill {
      background: var(--color-surface);
      border: 1.5px solid var(--color-border);
      color: var(--color-text);
      padding: 0.45rem 0.85rem;
      border-radius: 20px;
      font-weight: 600;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s;

      &:hover { border-color: var(--color-accent); }
      &.selected {
        background: var(--color-action);
        color: #fff;
        border-color: var(--color-accent);
      }
    }

    .rate-summary-box {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 10px;
      padding: 0.85rem 1rem;
      margin-top: 1rem;

      .rate-item {
        display: flex;
        justify-content: space-between;
        font-size: 0.88rem;
        margin-bottom: 0.4rem;

        &.total {
          border-top: 1px dashed var(--color-border);
          padding-top: 0.5rem;
          margin-top: 0.5rem;
          font-weight: 700;
        }

        .rate-label { color: var(--color-muted); }
        .rate-val { font-weight: 600; color: var(--color-text); }
        .text-green { color: var(--color-accent); }
      }
    }

    .group-info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
      background: var(--color-surface);
      padding: 1rem;
      border-radius: 8px;
      border: 1px solid var(--color-border);
      font-size: 0.9rem;
      margin: 0.75rem 0;
    }

    .group-note { font-size: 0.85rem; color: var(--color-accent); margin: 0; font-weight: 600; }

    .pending-review-banner {
      display: flex;
      gap: 1rem;
      background: rgba(245, 158, 11, 0.1);
      border: 1.5px solid #F59E0B;
      padding: 1.25rem;
      border-radius: var(--radius-lg);
      margin-top: 1.25rem;
      align-items: flex-start;

      .banner-icon { font-size: 2.25rem; flex-shrink: 0; }
      .banner-content h4 { margin: 0 0 0.35rem 0; color: var(--color-warning); font-size: 1.1rem; }
      .banner-content p { margin: 0 0 0.5rem 0; font-size: 0.9rem; color: #78350F; }
      .highlight-text { font-weight: 600; color: #92400E !important; }
    }

    .search-bar { display: flex; gap: 0.75rem; margin-top: 1rem; margin-bottom: 1.5rem; }
    .search-bar input { flex: 1; padding: 0.75rem; border-radius: 8px; border: 1.5px solid var(--color-border); background: var(--color-surface); }

    .result-box { background: var(--color-bg); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 1.25rem; }
    .status-badge { display: inline-block; background: var(--color-action); color: white; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.8rem; font-weight: 700; margin-bottom: 0.5rem; }
    .notice-card { background: var(--color-surface); padding: 1rem; border-radius: 10px; border-left: 4px solid var(--color-accent); margin: 1rem 0; }
    .notice-title { font-weight: 700; margin-bottom: 0.25rem; color: var(--color-text); }
    .teacher-card { display: flex; gap: 0.75rem; background: rgba(var(--color-accent-rgb), 0.1); padding: 1rem; border-radius: 10px; margin-bottom: 1rem; align-items: center; }
    .teacher-icon { font-size: 2rem; }
    .teacher-name { font-size: 1.1rem; font-weight: 700; color: var(--color-accent); margin: 0; }

    .payment-submitted-card {
      background: var(--color-surface);
      border: 2px solid var(--color-accent);
      border-radius: var(--radius-lg);
      padding: 1.5rem;
      margin-top: 1.5rem;
      box-shadow: var(--shadow-card);

      .submitted-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1rem;
        padding-bottom: 0.75rem;
        border-bottom: 1px solid var(--color-border);

        .submitted-icon { font-size: 2.25rem; }
        h3 { margin: 0 0 0.25rem 0; color: var(--color-text); font-size: 1.2rem; }
        p { margin: 0 0 0.5rem 0; font-size: 0.9rem; color: var(--color-muted); }
      }

      .submitted-summary-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 0.75rem;
        background: var(--color-bg);
        padding: 0.85rem;
        border-radius: 8px;
        border: 1px solid var(--color-border);
        font-size: 0.9rem;
        color: var(--color-text);
        margin-bottom: 1rem;
      }

      .under-review-notice {
        background: rgba(var(--color-accent-rgb), 0.08);
        border: 1px solid var(--color-accent);
        padding: 0.85rem;
        border-radius: 8px;
        font-size: 0.88rem;
        color: var(--color-text);
        line-height: 1.5;
        p { margin: 0; }
      }
    }

    .face-enrollment-card {
      background: var(--color-bg);
      border: 1.5px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: 1.25rem;
      margin: 1.5rem 0;

      h4 { margin: 0 0 0.25rem 0; color: var(--color-text); font-size: 1rem; font-weight: 800; }
      .subtitle { margin: 0 0 1rem 0; color: var(--color-muted); font-size: 0.85rem; }

      .capture-options-row {
        display: flex;
        gap: 0.75rem;
        flex-wrap: wrap;

        button, label {
          padding: 0.65rem 1.15rem;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.88rem;
          cursor: pointer;
          border: 1px solid var(--color-border);
          background: var(--color-surface);
          color: var(--color-text);
          transition: all 0.2s;

          &:hover {
            border-color: var(--color-accent-bright);
            background: var(--color-success-bg);
          }
        }
      }

      .enroll-camera-viewport {
        margin-top: 1rem;
        position: relative;
        max-width: 320px;

        .enroll-video-feed {
          width: 100%;
          height: 240px;
          object-fit: cover;
          border-radius: var(--radius-lg);
          border: 2px solid var(--color-accent-bright);
        }

        .btn-snap-now {
          position: absolute;
          bottom: 12px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--color-action);
          color: #ffffff;
          border: none;
          padding: 0.55rem 1.1rem;
          border-radius: 20px;
          font-weight: 800;
          font-size: 0.85rem;
          cursor: pointer;
          box-shadow: var(--shadow-card);
        }
      }

      .enrolled-preview-box {
        display: flex;
        align-items: center;
        gap: 1rem;
        flex-wrap: wrap;

        .enrolled-photo-img {
          width: 80px;
          height: 80px;
          object-fit: cover;
          border-radius: 50%;
          border: 3px solid var(--color-accent-bright);
        }

        .enrolled-badge {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          background: var(--color-success-bg);
          color: var(--color-accent-bright);
          padding: 0.35rem 0.75rem;
          border-radius: 20px;
          font-size: 0.82rem;
          font-weight: 700;
          border: 1px solid var(--color-border);
        }

        .btn-retake {
          padding: 0.4rem 0.8rem;
          border-radius: 6px;
          border: 1px solid var(--color-border);
          background: var(--color-surface);
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
        }
      }
    }

    .payment-card { background: var(--color-surface); border: 1px solid var(--color-border); padding: 1.25rem; border-radius: var(--radius-lg); margin-top: 1.5rem; }
    .bank-options { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: 1rem 0; }
    .bank-pill { background: var(--color-bg); padding: 0.85rem; border-radius: 8px; border: 1px solid var(--color-border); font-size: 0.85rem; }
    .preview-box { margin-top: 0.5rem; }
    .preview-box img { max-width: 250px; border-radius: 8px; border: 1px solid var(--color-border); margin-top: 0.5rem; }
    .credentials-issued-card {
      background: linear-gradient(135deg, rgba(var(--color-accent-rgb), 0.12), rgba(var(--color-accent-rgb), 0.05));
      border: 2px solid var(--color-accent);
      padding: 1.5rem;
      border-radius: var(--radius-lg);
      text-align: center;
      margin-top: 1.5rem;
      box-shadow: var(--shadow-card);

      .issued-icon { font-size: 3rem; margin-bottom: 0.35rem; }
      h3 { color: #047857; font-size: 1.35rem; font-weight: 900; margin: 0 0 0.75rem 0; }
      .student-id-display { font-size: 1.1rem; font-weight: 700; margin-bottom: 1rem; color: var(--color-text); code { background: var(--color-action); color: white; padding: 0.3rem 0.8rem; border-radius: 6px; font-size: 1.2rem; font-weight: 800; } }
      .login-credentials-box { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 10px; padding: 1rem; text-align: left; margin-bottom: 1.25rem; p { margin: 0.35rem 0; font-size: 0.95rem; } code { background: rgba(59, 130, 246, 0.15); color: var(--color-info); padding: 0.15rem 0.4rem; border-radius: 4px; font-weight: 700; } }
      .btn-direct-login { display: inline-block; background: var(--color-action); color: white; padding: 0.85rem 1.75rem; border-radius: 10px; font-weight: 800; font-size: 1rem; text-decoration: none; box-shadow: var(--shadow-card); transition: transform 0.2s; }
      .btn-direct-login:hover { transform: none; }
    }

    @media (max-width: 768px) {
      .register-portal-page { padding: 1rem 0.5rem; }
      .portal-card, .tracking-card { padding: 1.25rem; }
      .form-row, .group-info-grid { grid-template-columns: 1fr; gap: 0.75rem; }
      .bank-options { grid-template-columns: 1fr; }
      .form-actions button, .btn-primary, .btn-secondary { width: 100%; }
      .search-bar { flex-direction: column; }
      .search-bar button { width: 100%; }
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
export class StudentRegisterComponent implements OnInit {
  countryList = COUNTRY_PHONE_LIST;
  selectedCountryCode = '+251';
  phoneNumberInput = '';

  availableDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  selectedDays: string[] = ['Mon', 'Wed', 'Fri'];
  wantedTimeFrom = '14:00';
  wantedTimeTo = '16:00';

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

  // Face ID Biometric Profile Enrollment
  @ViewChild('enrollVideo') enrollVideo?: ElementRef<HTMLVideoElement>;
  referenceFacePhoto = signal<string | null>(null);
  referenceFaceDescriptorJson = signal<string | null>(null);
  enrollCameraActive = signal<boolean>(false);
  private enrollMediaStream: MediaStream | null = null;

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
    amountPaid: 4000,
    receiptImageBase64: ''
  };

  private registrationService = inject(StudentRegistrationService);
  private courseService = inject(CourseService);
  private faceService = inject(FaceRecognitionService);
  private toastService = inject(ToastService);

  ngOnInit(): void {
    this.faceService.loadModels().catch(() => {});
    this.courseService.getCourses().subscribe(res => this.courses.set(res));
  }

  onServiceTypeChange(): void {
    if (this.form.desiredServiceType === 3) {
      this.receiptForm.amountPaid = 4500; // 4000 tuition + 500 admission fee
    } else if (this.form.desiredServiceType === 1) {
      this.receiptForm.amountPaid = 4000; // 3500 tuition + 500 admission fee
    } else {
      this.receiptForm.amountPaid = 3000; // 2500 group tuition + 500 admission fee
    }
  }

  onCourseSelectedChange(): void {
    if (this.selectedCourseOption && this.selectedCourseOption !== 'OTHER') {
      const selected = this.courses().find(c => c.id === this.selectedCourseOption);
      if (selected) {
        this.form.desiredServiceType = selected.serviceType || 1;
        this.onServiceTypeChange();
      }
    }
  }

  toggleDay(day: string): void {
    if (this.selectedDays.includes(day)) {
      if (this.selectedDays.length > 1) {
        this.selectedDays = this.selectedDays.filter(d => d !== day);
      } else {
        this.toastService.show('Please select at least 1 preferred learning day.', 'info');
      }
    } else {
      this.selectedDays.push(day);
    }
  }

  getSelectedCountryFlagUrl(dialCode: string): string {
    const item = this.countryList.find(c => c.dialCode === dialCode);
    return item ? item.flagUrl : 'https://flagcdn.com/w40/et.png';
  }

  async toggleEnrollCamera(): Promise<void> {
    if (this.enrollCameraActive()) {
      this.closeEnrollCamera();
    } else {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
          });
          this.enrollMediaStream = stream;
          this.enrollCameraActive.set(true);

          setTimeout(() => {
            if (this.enrollVideo && this.enrollVideo.nativeElement) {
              this.enrollVideo.nativeElement.srcObject = stream;
            }
          }, 100);
        }
      } catch (err) {
        this.toastService.show('Camera access not permitted. You can upload a photo instead.', 'info');
      }
    }
  }

  closeEnrollCamera(): void {
    if (this.enrollMediaStream) {
      this.enrollMediaStream.getTracks().forEach(t => t.stop());
      this.enrollMediaStream = null;
    }
    this.enrollCameraActive.set(false);
  }

  async snapEnrollPhoto(): Promise<void> {
    if (!this.enrollVideo?.nativeElement) return;
    const video = this.enrollVideo.nativeElement;
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, 320, 320);
    const photoBase64 = canvas.toDataURL('image/jpeg', 0.88);
    this.referenceFacePhoto.set(photoBase64);
    this.closeEnrollCamera();

    // Extract 128-d descriptor from canvas
    try {
      const detection = await this.faceService.extractFaceDescriptor(canvas);
      if (detection) {
        this.referenceFaceDescriptorJson.set(JSON.stringify(detection.descriptorArray));
        this.toastService.show(' Face Biometric Profile Enrolled (100% Quality)!', 'success');
      } else {
        this.toastService.show('Photo captured! Please ensure face is centered.', 'info');
      }
    } catch {
      // Fallback
    }
  }

  async onUploadFacePhoto(event: any): Promise<void> {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e: any) => {
        const photoBase64 = e.target.result;
        this.referenceFacePhoto.set(photoBase64);

        const img = new Image();
        img.src = photoBase64;
        img.onload = async () => {
          try {
            const detection = await this.faceService.extractFaceDescriptor(img);
            if (detection) {
              this.referenceFaceDescriptorJson.set(JSON.stringify(detection.descriptorArray));
              this.toastService.show(' Reference Face Biometric Descriptor Extracted Successfully!', 'success');
            } else {
              this.toastService.show('Photo loaded! Face recognition will auto-enroll on first attendance check-in.', 'info');
            }
          } catch {
            // Fallback
          }
        };
      };
      reader.readAsDataURL(file);
    }
  }

  retakeReferencePhoto(): void {
    this.referenceFacePhoto.set(null);
    this.referenceFaceDescriptorJson.set(null);
    this.toggleEnrollCamera();
  }

  onSubmitRegistration(): void {
    if (!this.form.firstName || !this.form.email || (!this.selectedCourseOption && !this.customCourseInput) || !this.phoneNumberInput || !this.form.gradeLevel) {
      this.toastService.show('Please fill in all required fields including grade level, phone number, and selected/custom course.', 'error');
      return;
    }

    let finalGradeLevel = this.form.gradeLevel.trim();

    if (this.form.desiredServiceType === 1 || this.form.desiredServiceType === 3) {
      if (this.selectedDays.length === 0 || !this.wantedTimeFrom || !this.wantedTimeTo) {
        this.toastService.show('Please select your preferred learning days and time window (From - To).', 'error');
        return;
      }
      finalGradeLevel += ` | Preferred Schedule: ${this.selectedDays.join(', ')} (${this.wantedTimeFrom} to ${this.wantedTimeTo})`;
    } else {
      finalGradeLevel += ` | Group Class Schedule: Mon, Wed, Fri (10:00 AM - 12:00 PM)`;
    }

    if (this.customCourseInput && this.customCourseInput.trim().length > 0) {
      const customCourse = this.courses().find(c => c.name.toLowerCase().includes('custom') || c.name.toLowerCase().includes('requested')) || this.courses()[0];
      this.form.courseId = customCourse.id;
      finalGradeLevel += ` (Custom Requested Subject: ${this.customCourseInput.trim()})`;
    } else {
      this.form.courseId = this.selectedCourseOption;
    }

    const payload = {
      ...this.form,
      gradeLevel: finalGradeLevel,
      phoneNumber: `${this.selectedCountryCode} ${this.phoneNumberInput.trim()}`,
      referenceFacePhotoBase64: this.referenceFacePhoto() || undefined,
      referenceFaceDescriptorJson: this.referenceFaceDescriptorJson() || undefined
    };

    this.submitting.set(true);
    this.registrationService.submitRegistration(payload).subscribe({
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
