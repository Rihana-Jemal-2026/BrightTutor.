import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DashboardService, DashboardSummaryDto } from '../../services/dashboard.service';
import { AttendanceService } from '../../services/attendance.service';
import { AnnouncementService } from '../../services/announcement.service';
import { AuthService } from '../../services/auth.service';
import { CourseService, CourseDto } from '../../services/course.service';
import { StudentRegistrationService, RegistrationTrackDto } from '../../services/student-registration.service';
import { ToastService } from '../../services/toast.service';
import { StudentAttendanceSummary } from '../../models/attendance.model';
import { AnnouncementDto } from '../../models/announcement.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="dashboard-page">
      <!-- Admin Dashboard View -->
      @if (authService.isAdmin()) {
        <div class="page-header">
          <h1>Executive Admin Dashboard</h1>
          <p>Real-time system metrics, course activity, and attendance monitoring.</p>
        </div>

        @if (loading()) {
          <div class="loading-spinner">Loading dashboard analytics...</div>
        } @else {
          <div class="metrics-grid">
            <div class="metric-card primary">
              <div class="metric-icon"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/><circle cx="9" cy="7" r="4"/></svg></div>
              <div class="metric-info">
                <span class="value">{{ summary()?.totalUsers ?? 0 }}</span>
                <span class="label">Total System Users</span>
              </div>
            </div>

            <div class="metric-card success">
              <div class="metric-icon"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m2 9 10-5 10 5-10 5L2 9Zm4 2v6c4 3 8 3 12 0v-6m4-2v8"/></svg></div>
              <div class="metric-info">
                <span class="value">{{ summary()?.totalStudents ?? 0 }}</span>
                <span class="label">Active Students</span>
              </div>
            </div>

            <div class="metric-card info">
              <div class="metric-icon"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/><circle cx="9" cy="7" r="4"/></svg></div>
              <div class="metric-info">
                <span class="value">{{ summary()?.totalTeachers ?? 0 }}</span>
                <span class="label">Registered Teachers</span>
              </div>
            </div>

            <div class="metric-card warning">
              <div class="metric-icon"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 7v14m0-14C8 4 4 4 2 5v15c3-1 7-1 10 1 3-2 7-2 10-1V5c-2-1-6-1-10 2Z"/></svg></div>
              <div class="metric-info">
                <span class="value">{{ summary()?.totalActiveCourses ?? 0 }}</span>
                <span class="label">Active Courses</span>
              </div>
            </div>
          </div>

          <div class="section-title"> Academic Certificate Management</div>
          <div class="quick-actions-grid">
            <a routerLink="/certificates" class="action-card cert-action">
              <div class="action-icon"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="5"/><path d="m8 12-2 9 6-3 6 3-2-9"/></svg></div>
              <div class="action-details">
                <h3>Certificate Generator & Serial Verification</h3>
                <p>Evaluate 3-month attendance thresholds (&lt;20% absences) and issue official diplomas.</p>
              </div>
            </a>
          </div>
        }
      }

      <!-- Teacher Portal Dashboard View -->
      @if (authService.isTeacher()) {
        <div class="page-header">
          <h1>Teacher Portal Dashboard</h1>
          <p>Welcome back, <strong>{{ authService.currentUser()?.firstName }} {{ authService.currentUser()?.lastName }}</strong>! Personal activity & service credentials.</p>
        </div>

        @if (loading()) {
          <div class="loading-spinner">Loading personal activity stats...</div>
        } @else if (teacherStats()) {
          <div class="metrics-grid">
            <div class="metric-card success">
              <div class="metric-icon"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3v18h18M7 14l4-4 4 2 6-7"/></svg></div>
              <div class="metric-info">
                <span class="value">{{ teacherStats()?.attendancePercentage ?? 0 }}%</span>
                <span class="label">Teaching Attendance Rate</span>
              </div>
            </div>
            <div class="metric-card primary">
              <div class="metric-icon"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></svg></div>
              <div class="metric-info">
                <span class="value">{{ teacherStats()?.presentCount ?? 0 }}</span>
                <span class="label">Sessions Conducted</span>
              </div>
            </div>
            <div class="metric-card info">
              <div class="metric-icon"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="5"/><path d="m8 12-2 9 6-3 6 3-2-9"/></svg></div>
              <div class="metric-info">
                <span class="value">Active Educator</span>
                <span class="label">1-Year Service Eligible</span>
              </div>
            </div>
          </div>
        }

        <div class="section-title"> My Service Excellence Certificates</div>
        <div class="cert-section-box">
          <div class="cert-banner">
            <div class="cert-icon"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="5"/><path d="m8 12-2 9 6-3 6 3-2-9"/></svg></div>
            <div>
              <h3>Teacher Service Excellence Certificate (1-Year Service)</h3>
              <p>Recognizing your instructional service and mentorship at Bright Tutorial Center.</p>
            </div>
            <a routerLink="/certificates" class="btn-cert-action"> View & Print My Certificate</a>
          </div>
        </div>

        <div class="section-title"> Quick Actions & Tools</div>
        <div class="quick-actions-grid">
          <a routerLink="/schedules" class="action-card">
            <div class="action-icon"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18m-13 4h2m4 0h2m-8 3h2"/></svg></div>
            <div class="action-details">
              <h3>Timetables & Schedules</h3>
              <p>View upcoming class timetables, online meeting rooms, and home sessions.</p>
            </div>
          </a>

          <a routerLink="/mark-group-attendance" class="action-card">
            <div class="action-icon"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/><circle cx="9" cy="7" r="4"/></svg></div>
            <div class="action-details">
              <h3>Mark Group Attendance</h3>
              <p>Record daily roster attendance for assigned class groups.</p>
            </div>
          </a>

          <a routerLink="/mark-online-attendance" class="action-card">
            <div class="action-icon"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8m-4-4v4"/></svg></div>
            <div class="action-details">
              <h3>Mark Online Session</h3>
              <p>Record 1-on-1 or group online video tutoring attendance.</p>
            </div>
          </a>

          <a routerLink="/home-attendance" class="action-card">
            <div class="action-icon"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 10 9-7 9 7v11h-7v-7h-4v7H3V10Z"/></svg></div>
            <div class="action-details">
              <h3>Home Visit Check-In</h3>
              <p>Perform GPS-verified check-in/out for student home visits.</p>
            </div>
          </a>
        </div>
      }

      <!-- Student & Parent Portal Dashboard View -->
      @if (authService.isStudent() || authService.isParent()) {
        <div class="page-header">
          <h1>Student Learning Portal Dashboard</h1>
          <p>Welcome back, <strong>{{ authService.currentUser()?.firstName }} {{ authService.currentUser()?.lastName }}</strong>!</p>
        </div>

        @if (loading()) {
          <div class="loading-spinner">Loading your student account records...</div>
        } @else {
          <!-- STATE 1: PENDING ADMIN REVIEW (3-5 HR SLA) -->
          @if (studentRegTrack() && (studentRegTrack()?.statusCode === 1 || studentRegTrack()?.status === 'PendingTeacherCheck')) {
            <div class="student-status-board pending-board">
              <div class="board-header">
                <div class="board-icon"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></div>
                <div>
                  <h2>Registration Status: Pending Admin Review</h2>
                  <div class="badge-pending">SLA: 3 to 5 Working Hours</div>
                </div>
              </div>

              <div class="board-content">
                <p class="greeting-text">Thank you for registering with BrightTutor Academy!</p>
                <p>Your application is currently in <strong>Pending Review</strong> status. Our academic administration team is checking teacher availability for your requested course (<strong>{{ studentRegTrack()?.courseName }}</strong>) and schedule window.</p>
                
                <div class="guarantee-box">
                   <strong>No payment is required today.</strong> Payment instructions & receipt upload will be unlocked right here on your dashboard <strong>as soon as admin approves teacher availability</strong> within 3-5 working hours.
                </div>
              </div>
            </div>
          }

          <!-- STATE 2: APPROVED BY ADMIN — UNLOCK PAYMENT DASHBOARD -->
          @else if (studentRegTrack() && (studentRegTrack()?.statusCode === 2 || studentRegTrack()?.status === 'ApprovedPendingPayment')) {
            <div class="student-status-board approved-board">
              <div class="board-header">
                <div class="board-icon"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="5"/><path d="m8 12-2 9 6-3 6 3-2-9"/></svg></div>
                <div>
                  <h2>Registration Approved! Tutor Assigned</h2>
                  <div class="badge-approved">Status: Ready for Payment & Activation</div>
                </div>
              </div>

              <div class="assigned-tutor-highlight">
                 <strong>Assigned Certified Tutor:</strong> <span class="tutor-name">{{ studentRegTrack()?.assignedTeacherName ?? 'Certified Educator' }}</span>
              </div>

              <div class="payment-dashboard-box">
                <h3>Payment Dashboard & Receipt Slip Upload</h3>
                <p>Your tutor is matched! Please transfer your tuition fee + 500 ETB one-time registration fee to one of our official accounts below:</p>

                <div class="bank-accounts-grid">
                  <div class="bank-card">
                    <div class="bank-name"> Commercial Bank of Ethiopia (CBE)</div>
                    <div class="account-no">Account: <code>1000123456789</code></div>
                    <div class="account-title">BrightTutor Academy PLC</div>
                  </div>

                  <div class="bank-card">
                    <div class="bank-name"> Telebirr Mobile Transfer</div>
                    <div class="account-no">Mobile / Till: <code>0911000000</code> / Merchant 889900</div>
                    <div class="account-title">BrightTutor Academy</div>
                  </div>
                </div>

                <form (ngSubmit)="onSubmitDashboardReceipt(studentRegTrack()!.registrationId)" class="dashboard-receipt-form">
                  <h4>Upload Receipt Screenshot for Account Verification</h4>
                  
                  <div class="form-row">
                    <div class="form-group">
                      <label>Payment Channel *</label>
                      <select [(ngModel)]="receiptForm.paymentChannel" name="dpChannel" required>
                        <option value="CBE Birr">CBE Birr / CBE Bank Transfer</option>
                        <option value="Telebirr">Telebirr Mobile Transfer</option>
                      </select>
                    </div>

                    <div class="form-group">
                      <label>Transaction Reference ID *</label>
                      <input type="text" [(ngModel)]="receiptForm.transactionId" name="dpTxn" placeholder="e.g. FT26082699X" required />
                    </div>

                    <div class="form-group">
                      <label>Amount Paid (ETB) *</label>
                      <input type="number" [(ngModel)]="receiptForm.amountPaid" name="dpAmount" placeholder="3500" required />
                    </div>
                  </div>

                  <div class="form-group">
                    <label>Upload Receipt Screenshot *</label>
                    <input type="file" (change)="onDashboardFileSelected($event)" accept="image/*" required />
                    @if (receiptForm.receiptImageBase64) {
                      <div class="screenshot-preview">
                        <p> Screenshot attached cleanly.</p>
                        <img [src]="receiptForm.receiptImageBase64" alt="Receipt Screenshot Preview" />
                      </div>
                    }
                  </div>

                  <button type="submit" class="btn-submit-receipt" [disabled]="submittingReceipt()">
                    @if (submittingReceipt()) { Submitting Receipt... } @else { Submit Payment Receipt & Unlock Learning Dashboard }
                  </button>
                </form>
              </div>
            </div>
          }

          <!-- STATE 3: PAYMENT SUBMITTED — PENDING ADMIN VERIFICATION -->
          @else if (studentRegTrack() && (studentRegTrack()?.statusCode === 3 || studentRegTrack()?.status === 'PaymentSubmitted')) {
            <div class="student-status-board submitted-board">
              <div class="board-header">
                <div class="board-icon"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></div>
                <div>
                  <h2>Payment Receipt Submitted & Under Review</h2>
                  <div class="badge-submitted">Verification SLA: 1 to 3 Business Hours</div>
                </div>
              </div>

              <div class="submitted-details-box">
                <p>Your payment screenshot and transaction reference ID (<code>{{ studentRegTrack()?.transactionId }}</code>) have been received.</p>
                <div class="details-pill-row">
                  <span><strong>Channel:</strong> {{ studentRegTrack()?.paymentChannel }}</span>
                  <span><strong>Amount:</strong> ETB {{ studentRegTrack()?.amountPaid }}</span>
                  <span><strong>Assigned Tutor:</strong> {{ studentRegTrack()?.assignedTeacherName }}</span>
                </div>
                <p class="review-note"> Our finance administration is cross-checking your transaction ID. Once verified, your full learning dashboard & yearly lesson plan will unlock right here.</p>
              </div>
            </div>
          }

          <!-- STATE 4: FULL ACTIVE LEARNING DASHBOARD (VERIFIED & ENROLLED) -->
          @else {
            @if (studentStats()) {
              <div class="metrics-grid">
                <div class="metric-card success">
                  <div class="metric-icon"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="5"/><path d="m8 12-2 9 6-3 6 3-2-9"/></svg></div>
                  <div class="metric-info">
                    <span class="value">{{ studentStats()?.attendancePercentage ?? 0 }}%</span>
                    <span class="label">My Attendance Rate</span>
                  </div>
                </div>
                <div class="metric-card primary">
                  <div class="metric-icon"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></svg></div>
                  <div class="metric-info">
                    <span class="value">{{ studentStats()?.presentCount ?? 0 }}</span>
                    <span class="label">Sessions Present</span>
                  </div>
                </div>
                <div class="metric-card warning">
                  <div class="metric-icon"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></div>
                  <div class="metric-info">
                    <span class="value">{{ studentStats()?.lateCount ?? 0 }}</span>
                    <span class="label">Sessions Late</span>
                  </div>
                </div>
              </div>
            }

            <!-- ASSIGNED TUTOR & ACADEMIC DETAILS -->
            <div class="assigned-teacher-card-full">
              <div class="teacher-avatar-icon"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/><circle cx="9" cy="7" r="4"/></svg></div>
              <div class="teacher-info-block">
                <div class="badge-active-tutor">Active Assigned Educator</div>
                <h2>Assigned Tutor: {{ studentRegTrack()?.assignedTeacherName || 'Certified Tutor' }}</h2>
                <p>Course: <strong>{{ studentRegTrack()?.courseName || 'Active Enrolled Course' }}</strong> | Student Code: <code>{{ studentRegTrack()?.issuedStudentCode || 'STU-ACTIVE' }}</code></p>
              </div>
            </div>

            <!-- TIME SCHEDULE & CLASS TIMETABLE -->
            <div class="section-title"> My Time Schedule & Class Timetables</div>
            <div class="schedule-summary-card">
              <div class="schedule-icon-box"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></div>
              <div class="schedule-info">
                <h3>Weekly Timetable Hours</h3>
                <p>Regular Sessions: <strong>Mon, Wed, Fri (10:00 AM – 12:00 PM)</strong></p>
                <p>Location / Platform: <strong>BrightTutor Center / Online Video Room</strong></p>
              </div>
              <a routerLink="/schedules" class="btn-view-schedule">View Full Timetable →</a>
            </div>

            <!-- YEARLY CURRICULUM & LESSON PLAN -->
            <div class="section-title"> Yearly Lesson Plan & Academic Curriculum</div>
            <div class="yearly-plan-grid">
              <div class="plan-card term-1">
                <div class="term-header">Term 1 (Months 1–3)</div>
                <h4>Foundation & Core Concepts</h4>
                <ul>
                  <li>Fundamental subject theory & key diagnostic assessment</li>
                  <li>Weekly problem-solving exercises & homework review</li>
                  <li>Monthly milestone test & progress review</li>
                </ul>
              </div>

              <div class="plan-card term-2">
                <div class="term-header">Term 2 (Months 4–6)</div>
                <h4>Intermediate Applications</h4>
                <ul>
                  <li>Advanced analytical techniques & practical exercises</li>
                  <li>Mid-year examination preparation & mock tests</li>
                  <li>1-on-1 personalized tutor Q&A mentorship</li>
                </ul>
              </div>

              <div class="plan-card term-3">
                <div class="term-header">Term 3 (Months 7–9)</div>
                <h4>National Exam & Mastery Review</h4>
                <ul>
                  <li>Past national exam question bank solving</li>
                  <li>Time-bound mock exams & error analysis</li>
                  <li>Comprehensive subject review sessions</li>
                </ul>
              </div>

              <div class="plan-card term-4">
                <div class="term-header">Term 4 (Months 10–12)</div>
                <h4>Final Mastery & Diploma Certification</h4>
                <ul>
                  <li>Final curriculum evaluation & diploma clearance</li>
                  <li>3-Month Course Completion Certificate eligibility check</li>
                  <li>Academic board honors & graduation recommendation</li>
                </ul>
              </div>
            </div>

            <div class="section-title"> My 3-Month Course Completion Certificates</div>
            <div class="cert-section-box">
              <div class="cert-banner student-banner">
                <div class="cert-icon"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m2 9 10-5 10 5-10 5L2 9Zm4 2v6c4 3 8 3 12 0v-6m4-2v8"/></svg></div>
                <div>
                  <h3>3-Month Academic Completion Certificate</h3>
                  <p>Rule: Absence rate must be &lt;20.0% (&ge;80% attendance rate over 12-week curriculum).</p>
                </div>
                <a routerLink="/certificates" class="btn-cert-action"> Check Eligibility & Download Certificate</a>
              </div>
            </div>

            <div class="section-title"> Quick Actions & Portals</div>
            <div class="quick-actions-grid">
              <button type="button" class="action-card add-course-card" (click)="openAddCourseModal()">
                <div class="action-icon"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></div>
                <div class="action-details">
                  <h3>Add New Course / Subject</h3>
                  <p>Enroll in an additional subject, 1-on-1 tutoring, or new group class.</p>
                </div>
              </button>

              <a routerLink="/schedules" class="action-card">
                <div class="action-icon"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18m-13 4h2m4 0h2m-8 3h2"/></svg></div>
                <div class="action-details">
                  <h3>My Class Timetable</h3>
                  <p>Check scheduled class hours, room numbers, and online video links.</p>
                </div>
              </a>

              <a routerLink="/student-calendar" class="action-card">
                <div class="action-icon"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18m-13 4h2m4 0h2m-8 3h2"/></svg></div>
                <div class="action-details">
                  <h3>My Attendance Calendar</h3>
                  <p>View monthly color-coded attendance days and timestamps.</p>
                </div>
              </a>

              <a routerLink="/student-summary" class="action-card">
                <div class="action-icon"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m2 9 10-5 10 5-10 5L2 9Zm4 2v6c4 3 8 3 12 0v-6m4-2v8"/></svg></div>
                <div class="action-details">
                  <h3>My Attendance Summary</h3>
                  <p>View aggregate attendance rate percentages and status breakdown.</p>
                </div>
              </a>
            </div>
          }
        }
      }

      <!-- Add New Course Modal for Enrolled Students -->
      @if (isAddCourseModalOpen()) {
        <div class="cert-modal-overlay" (click)="closeAddCourseModal()">
          <div class="modal-card-box" (click)="$event.stopPropagation()">
            <div class="modal-header-row">
              <h3>Enroll in Additional Course / Subject</h3>
              <button type="button" class="close-btn" (click)="closeAddCourseModal()">&times;</button>
            </div>
            <p class="modal-sub">Submit a request to add a new course to your active student profile. Our academic team will match a tutor within 3-5 working hours.</p>

            <form (ngSubmit)="onSubmitAddCourse()">
              <div class="form-group">
                <label>Select Course *</label>
                <select [(ngModel)]="addCourseForm.courseId" name="cId" (change)="onAddCourseSelectChange()" required>
                  <option value="">-- Choose From Catalog --</option>
                  @for (c of availableCourses(); track c.id) {
                    <option [value]="c.id">{{ c.name }} ({{ getServiceName(c.serviceType) }})</option>
                  }
                  <option value="OTHER"> Other / Request Custom Subject</option>
                </select>
              </div>

              @if (addCourseForm.courseId === 'OTHER') {
                <div class="form-group">
                  <label>Custom Course / Subject Name *</label>
                  <input type="text" [(ngModel)]="addCourseForm.customSubject" name="customSub" placeholder="e.g. Python Programming, SAT Math, Amharic" required />
                </div>
              }

              <div class="form-group">
                <label>Delivery Method *</label>
                <select [(ngModel)]="addCourseForm.serviceType" name="sType" required>
                  <option [ngValue]="1"> Online 1-on-1 Tutoring</option>
                  <option [ngValue]="2"> In-Person Group Class</option>
                  <option [ngValue]="3"> Home-to-Home Visit</option>
                </select>
              </div>

              <div class="form-group">
                <label>Preferred Days & Time Window</label>
                <input type="text" [(ngModel)]="addCourseForm.scheduleNotes" name="sNotes" placeholder="e.g. Mon, Wed, Fri from 02:00 PM to 04:00 PM" required />
              </div>

              <div class="modal-actions-row">
                <button type="button" class="btn-cancel" (click)="closeAddCourseModal()">Cancel</button>
                <button type="submit" class="btn-save" [disabled]="submittingAddCourse()">
                  @if (submittingAddCourse()) { Submitting Request... } @else { Submit Course Addition Request }
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Certificate Display Modal -->
      @if (viewingCert()) {
        <div class="cert-modal-overlay" (click)="viewingCert.set(false)">
          <div class="cert-frame" (click)="$event.stopPropagation()">
            <button type="button" class="close-cert-btn" (click)="viewingCert.set(false)">&times;</button>
            <div class="cert-inner-border">
              <div class="cert-seal"></div>
              <div class="cert-header">BRIGHT TUTORIAL CENTER</div>
              <div class="cert-sub">OFFICIAL DIPLOMA OF SERVICE EXCELLENCE</div>
              <div class="cert-body">
                <p>This official certificate is proudly awarded to</p>
                <h1 class="recipient-name">{{ authService.currentUser()?.firstName }} {{ authService.currentUser()?.lastName }}</h1>
                <p class="cert-desc">Presented in recognition of outstanding instructional service, pedagogical dedication, and 1 full year of active service as a Certified Tutor at Bright Tutorial Center.</p>
              </div>
              <div class="cert-footer">
                <div class="sig-block"><div class="sig-line">Munir Nesru (Academic Board Director)</div></div>
                <div class="cert-serial">Serial: <code>CERT-TCH-2026-ACTIVE</code></div>
                <div class="sig-block"><div class="sig-line">Rihana Jemal (Director of Education)</div></div>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Campus Announcements Feed Widget (Visible across all roles) -->
      <div class="section-header-row">
        <div class="section-title" style="margin: 0;"> Campus Announcements Bulletin</div>
        <a routerLink="/announcements" class="view-all-link">View All Notices →</a>
      </div>

      <div class="announcements-preview-grid">
        @for (item of announcements(); track item.id) {
          <div class="announcement-preview-card">
            <div class="announcement-meta">
              <span class="badge-role">{{ getTargetRoleLabel(item.targetRole) }}</span>
              <span class="badge-date">{{ item.createdAt | date:'mediumDate' }}</span>
            </div>
            <h4 class="preview-title">{{ item.title }}</h4>
            <p class="preview-content">{{ item.content }}</p>
          </div>
        } @empty {
          <div class="empty-notices">
            <span></span> No announcements currently published.
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .dashboard-page { padding: 1.5rem; }
    .page-header h1 { font-size: 1.75rem; margin-bottom: 0.25rem; color: var(--color-primary); }
    .page-header p { color: var(--color-muted); margin-bottom: 1.5rem; }
    .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem; margin-bottom: 1.5rem; }
    .metric-card { background: var(--color-surface); border-radius: var(--radius-lg); padding: 1.25rem; display: flex; align-items: center; gap: 1rem; box-shadow: var(--shadow-card); border: 1px solid var(--color-border); border-left: 4px solid var(--color-accent); }
    .metric-card.primary { border-left-color: var(--color-primary); }
    .metric-card.success { border-left-color: var(--color-accent-bright); }
    .metric-card.info { border-left-color: #0284c7; }
    .metric-card.warning { border-left-color: #d97706; }
    .metric-icon { font-size: 2rem; }
    .metric-info .value { display: block; font-size: 1.75rem; font-weight: 700; color: var(--color-text); }
    .metric-info .label { font-size: 0.85rem; color: var(--color-muted); }
    .section-title { font-size: 1.2rem; font-weight: 700; color: var(--color-primary); margin: 1.5rem 0 0.75rem 0; }
    .section-header-row { display: flex; justify-content: space-between; align-items: center; margin-top: 2rem; margin-bottom: 1rem; }
    .view-all-link { color: var(--color-accent-bright); text-decoration: none; font-weight: 600; font-size: 0.88rem; }
    .view-all-link:hover { text-decoration: underline; }

    /* Student Status Board Styles */
    .student-status-board { background: var(--color-surface); border-radius: var(--radius-lg); padding: 1.75rem; border: 2px solid var(--color-border); box-shadow: var(--shadow-card); margin-bottom: 1.5rem; }
    .student-status-board.pending-board { border-color: #f59e0b; background: linear-gradient(135deg, rgba(245, 158, 11, 0.05), rgba(217, 119, 6, 0.02)); }
    .student-status-board.approved-board { border-color: var(--color-accent); background: linear-gradient(135deg, rgba(var(--color-accent-rgb), 0.06), rgba(var(--color-accent-rgb), 0.02)); }
    .student-status-board.submitted-board { border-color: #3b82f6; background: linear-gradient(135deg, rgba(59, 130, 246, 0.06), rgba(37, 99, 235, 0.02)); }

    .board-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; }
    .board-icon { font-size: 2.75rem; }
    .board-header h2 { margin: 0 0 0.25rem 0; font-size: 1.35rem; color: var(--color-text); font-weight: 800; }
    
    .badge-pending { display: inline-block; background: #f59e0b; color: white; padding: 0.25rem 0.75rem; border-radius: 15px; font-weight: 700; font-size: 0.8rem; }
    .badge-approved { display: inline-block; background: var(--color-action); color: white; padding: 0.25rem 0.75rem; border-radius: 15px; font-weight: 700; font-size: 0.8rem; }
    .badge-submitted { display: inline-block; background: #3b82f6; color: white; padding: 0.25rem 0.75rem; border-radius: 15px; font-weight: 700; font-size: 0.8rem; }

    .greeting-text { font-size: 1.1rem; font-weight: 700; color: var(--color-primary); margin: 0 0 0.5rem 0; }
    .guarantee-box { background: rgba(var(--color-accent-rgb), 0.1); border: 1px solid var(--color-accent); padding: 0.85rem 1rem; border-radius: 10px; margin-top: 1rem; font-size: 0.9rem; color: #047857; line-height: 1.5; }

    .assigned-tutor-highlight { background: rgba(var(--color-accent-rgb), 0.12); border: 1.5px solid var(--color-accent); padding: 0.85rem 1.25rem; border-radius: 10px; font-size: 1rem; color: #047857; margin-bottom: 1.25rem; }
    .tutor-name { font-weight: 800; font-size: 1.1rem; color: #065f46; }

    .payment-dashboard-box { background: var(--color-bg); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 1.25rem; margin-top: 1rem; }
    .bank-accounts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: 1rem 0; }
    .bank-card { background: var(--color-surface); padding: 1rem; border-radius: 8px; border: 1px solid var(--color-border); }
    .bank-name { font-weight: 700; font-size: 0.9rem; color: var(--color-primary); margin-bottom: 0.35rem; }
    .account-no code { background: rgba(59, 130, 246, 0.15); color: var(--color-info); padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: 800; font-size: 0.95rem; }
    .account-title { font-size: 0.8rem; color: var(--color-muted); margin-top: 0.25rem; }

    .dashboard-receipt-form { margin-top: 1.25rem; border-top: 1px solid var(--color-border); padding-top: 1rem; }
    .btn-submit-receipt { background: var(--color-action); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 700; font-size: 0.95rem; cursor: pointer; width: 100%; margin-top: 1rem; }

    .submitted-details-box { background: var(--color-bg); border: 1px solid var(--color-border); border-radius: 10px; padding: 1rem; }
    .details-pill-row { display: flex; gap: 1rem; flex-wrap: wrap; margin: 0.75rem 0; font-size: 0.9rem; }
    .review-note { color: var(--color-accent); font-weight: 600; margin: 0; }

    .screenshot-preview { margin-top: 0.5rem; img { max-width: 240px; border-radius: 8px; border: 1px solid var(--color-border); margin-top: 0.35rem; } }

    /* Active Learning Page Styles */
    .assigned-teacher-card-full { display: flex; align-items: center; gap: 1.25rem; background: linear-gradient(135deg, rgba(var(--color-accent-rgb), 0.08), rgba(var(--color-accent-rgb), 0.04)); border: 1.5px solid var(--color-accent); border-radius: var(--radius-lg); padding: 1.25rem 1.5rem; margin-bottom: 1.5rem; }
    .teacher-avatar-icon { font-size: 3rem; }
    .badge-active-tutor { font-size: 0.75rem; font-weight: 700; background: var(--color-action); color: white; padding: 0.15rem 0.6rem; border-radius: var(--radius-lg); display: inline-block; margin-bottom: 0.35rem; }
    .teacher-info-block h2 { margin: 0 0 0.25rem 0; font-size: 1.3rem; color: var(--color-text); }
    .teacher-info-block p { margin: 0; font-size: 0.9rem; color: var(--color-muted); }

    .schedule-summary-card { display: flex; align-items: center; gap: 1.25rem; background: var(--color-surface); border: 1px solid var(--color-border); padding: 1.25rem; border-radius: var(--radius-lg); margin-bottom: 1.5rem; }
    .schedule-icon-box { font-size: 2.5rem; }
    .schedule-info { flex: 1; h3 { margin: 0 0 0.25rem 0; font-size: 1.1rem; color: var(--color-primary); } p { margin: 0 0 0.2rem 0; font-size: 0.88rem; color: var(--color-muted); } }
    .btn-view-schedule { background: var(--color-action); color: white; padding: 0.6rem 1.1rem; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 0.88rem; white-space: nowrap; }

    .yearly-plan-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
    .plan-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 1rem; position: relative; }
    .term-header { font-size: 0.75rem; font-weight: 800; color: var(--color-accent); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.35rem; }
    .plan-card h4 { margin: 0 0 0.5rem 0; font-size: 0.98rem; color: var(--color-text); }
    .plan-card ul { margin: 0; padding-left: 1.1rem; font-size: 0.82rem; color: var(--color-muted); line-height: 1.45; }
    .plan-card li { margin-bottom: 0.3rem; }

    .quick-actions-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.25rem; }
    .action-card { background: var(--color-surface); border-radius: var(--radius-lg); padding: 1.25rem; display: flex; align-items: flex-start; gap: 1rem; text-decoration: none; color: inherit; box-shadow: var(--shadow-card); border: 1px solid var(--color-border); transition: transform 0.2s, box-shadow 0.2s; }
    .action-card:hover { transform: none; box-shadow: var(--shadow-card-hover); }
    .action-card.cert-action { border-color: #8b5cf6; background: rgba(139, 92, 246, 0.05); }
    .action-card.add-course-card { border-color: var(--color-accent); background: rgba(var(--color-accent-rgb), 0.08); cursor: pointer; text-align: left; }
    .action-icon { font-size: 2.25rem; }
    .action-details h3 { margin: 0 0 0.35rem 0; font-size: 1.1rem; color: var(--color-primary); }
    .action-details p { margin: 0; font-size: 0.85rem; color: var(--color-muted); }

    .cert-section-box { background: var(--color-surface); border: 1px solid var(--color-border); padding: 1.25rem; border-radius: var(--radius-lg); margin-bottom: 1rem; }
    .cert-banner { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
    .cert-icon { font-size: 2.5rem; }
    .cert-banner h3 { margin: 0 0 0.25rem 0; color: var(--color-text); font-size: 1.1rem; }
    .cert-banner p { margin: 0; font-size: 0.85rem; color: var(--color-muted); }
    .btn-cert-action { background: #8b5cf6; color: #fff; border: none; padding: 0.65rem 1.25rem; border-radius: 8px; font-weight: 600; text-decoration: none; cursor: pointer; white-space: nowrap; }

    .announcements-preview-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.25rem; }
    .announcement-preview-card { background: var(--color-surface); border-radius: var(--radius-lg); padding: 1.25rem; box-shadow: var(--shadow-card); border-left: 4px solid #7c3aed; border: 1px solid var(--color-border); }
    .announcement-meta { display: flex; justify-content: space-between; margin-bottom: 0.5rem; }
    .badge-role { font-size: 0.75rem; font-weight: 600; background: #f3e8ff; color: #7e22ce; padding: 0.15rem 0.5rem; border-radius: 10px; }
    .badge-date { font-size: 0.75rem; color: var(--color-muted); }
    .preview-title { font-size: 1rem; font-weight: 700; color: var(--color-text); margin: 0 0 0.4rem 0; }
    .preview-content { font-size: 0.85rem; color: var(--color-muted); line-height: 1.5; margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .empty-notices { background: var(--color-surface); border-radius: var(--radius-lg); padding: 1.5rem; text-align: center; color: var(--color-muted); font-size: 0.9rem; grid-column: 1 / -1; border: 1px solid var(--color-border); }

    /* Digital Certificate Frame */
    .cert-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
    .cert-frame { background: #fff8eb; color: var(--color-text); width: 100%; max-width: 750px; padding: 2rem; border-radius: 16px; border: 8px double #d97706; position: relative; }
    .close-cert-btn { position: absolute; top: 1rem; right: 1rem; background: none; border: none; font-size: 1.75rem; cursor: pointer; color: #78350f; }
    .cert-inner-border { border: 2px solid var(--color-warning); padding: 1.5rem; text-align: center; border-radius: 8px; }
    .cert-seal { font-size: 2.5rem; }
    .cert-header { font-size: 1.4rem; font-weight: 900; letter-spacing: 2px; color: #78350f; }
    .cert-sub { font-size: 0.8rem; font-weight: 700; color: var(--color-warning); margin-bottom: 1rem; }
    .recipient-name { font-size: 2rem; font-family: serif; color: #92400e; margin: 0.5rem 0; text-decoration: underline; }
    .cert-desc { font-size: 0.9rem; color: #451a03; max-width: 550px; margin: 0 auto 1rem auto; }
    .cert-footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 1.5rem; }
    .sig-block { width: 160px; text-align: center; }
    .sig-line { border-top: 1px solid #78350f; padding-top: 0.3rem; font-size: 0.75rem; font-weight: 700; color: #78350f; }
    .cert-serial { font-size: 0.75rem; color: #78350f; }
    .cert-serial code { font-weight: 800; background: #fde68a; padding: 0.1rem 0.4rem; border-radius: 4px; }
    .loading-spinner { padding: 2rem; text-align: center; color: var(--color-muted); }

    /* Modal Form Styles */
    .modal-card-box { background: var(--color-surface); color: var(--color-text); border: 1px solid var(--color-border); border-radius: var(--radius-lg); width: 100%; max-width: 520px; padding: 1.75rem; box-shadow: var(--shadow-card-hover); }
    .modal-header-row { display: flex; justify-content: space-between; align-items: center; }
    .modal-header-row h3 { margin: 0; font-size: 1.2rem; color: var(--color-text); }
    .close-btn { background: none; border: none; font-size: 1.5rem; color: var(--color-muted); cursor: pointer; }
    .modal-sub { font-size: 0.85rem; color: var(--color-muted); margin: 0.35rem 0 1.25rem 0; line-height: 1.4; }
    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; font-size: 0.85rem; font-weight: 600; color: var(--color-text); margin-bottom: 0.35rem; }
    .form-group input, .form-group select { width: 100%; padding: 0.65rem 0.85rem; border-radius: 8px; border: 1px solid var(--color-border); background: var(--color-bg); color: var(--color-text); font-size: 0.9rem; box-sizing: border-box; }
    .modal-actions-row { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; }
    .btn-cancel { background: var(--color-bg); color: var(--color-muted); border: 1px solid var(--color-border); padding: 0.6rem 1rem; border-radius: 6px; font-weight: 600; cursor: pointer; }
    .btn-save { background: var(--color-action); color: white; border: none; padding: 0.65rem 1.35rem; border-radius: 6px; font-weight: 600; cursor: pointer; }

    @media (max-width: 768px) {
      .bank-accounts-grid, .yearly-plan-grid { grid-template-columns: 1fr; }
      .assigned-teacher-card-full, .schedule-summary-card { flex-direction: column; text-align: center; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  authService = inject(AuthService);
  private dashboardService = inject(DashboardService);
  private attendanceService = inject(AttendanceService);
  private announcementService = inject(AnnouncementService);
  private courseService = inject(CourseService);
  private registrationService = inject(StudentRegistrationService);
  private toast = inject(ToastService);

  summary = signal<DashboardSummaryDto | null>(null);
  studentStats = signal<StudentAttendanceSummary | null>(null);
  teacherStats = signal<any | null>(null);
  announcements = signal<AnnouncementDto[]>([]);
  studentRegTrack = signal<RegistrationTrackDto | null>(null);
  loading = signal<boolean>(true);
  viewingCert = signal<boolean>(false);

  isAddCourseModalOpen = signal<boolean>(false);
  submittingAddCourse = signal<boolean>(false);
  availableCourses = signal<CourseDto[]>([]);

  addCourseForm = {
    courseId: '',
    customSubject: '',
    serviceType: 1,
    scheduleNotes: ''
  };

  receiptForm = {
    paymentChannel: 'CBE Birr',
    transactionId: '',
    amountPaid: 3500,
    receiptImageBase64: ''
  };
  submittingReceipt = signal<boolean>(false);

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (!user) {
      this.loading.set(false);
      return;
    }

    this.loadAnnouncements();

    if (this.authService.isAdmin()) {
      this.dashboardService.getSummary().subscribe({
        next: (res) => {
          this.summary.set(res);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
    } else if (this.authService.isStudent() || this.authService.isParent()) {
      this.registrationService.trackRegistration(user.email).subscribe({
        next: (track) => {
          this.studentRegTrack.set(track);
          if (track.statusCode === 4 || track.status === 'VerifiedAndEnrolled') {
            this.loadStudentSummaryData(user.userId);
          } else {
            this.loading.set(false);
          }
        },
        error: () => {
          this.loadStudentSummaryData(user.userId);
        }
      });
    } else if (this.authService.isTeacher()) {
      const startDate = '2026-08-01';
      const endDate = new Date().toISOString().substring(0, 10);
      this.attendanceService.getTeacherReport(user.userId, startDate, endDate).subscribe({
        next: (res) => {
          this.teacherStats.set(res);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
    } else {
      this.loading.set(false);
    }
  }

  loadStudentSummaryData(userId: string): void {
    const startDate = '2026-08-01';
    const endDate = new Date().toISOString().substring(0, 10);
    this.attendanceService.getStudentSummary(userId, startDate, endDate).subscribe({
      next: (res) => {
        this.studentStats.set(res);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onDashboardFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = () => {
        this.receiptForm.receiptImageBase64 = reader.result as string;
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  onSubmitDashboardReceipt(regId: string): void {
    if (!this.receiptForm.transactionId || !this.receiptForm.amountPaid || !this.receiptForm.receiptImageBase64) {
      this.toast.show('Please enter Transaction ID, Amount Paid, and attach Receipt Screenshot.', 'error');
      return;
    }

    this.submittingReceipt.set(true);
    this.registrationService.uploadReceipt({
      registrationId: regId,
      paymentChannel: this.receiptForm.paymentChannel,
      transactionId: this.receiptForm.transactionId,
      amountPaid: this.receiptForm.amountPaid,
      receiptImageBase64: this.receiptForm.receiptImageBase64
    }).subscribe({
      next: (res) => {
        this.submittingReceipt.set(false);
        this.toast.show(res.message, 'success');
        const user = this.authService.currentUser();
        if (user) {
          this.registrationService.trackRegistration(user.email).subscribe(t => this.studentRegTrack.set(t));
        }
      },
      error: (err) => {
        this.submittingReceipt.set(false);
        this.toast.show(err.error?.message || 'Failed to submit receipt.', 'error');
      }
    });
  }

  openCertificatesModal(): void {
    this.viewingCert.set(true);
  }

  openAddCourseModal(): void {
    this.courseService.getCourses().subscribe({
      next: (list) => {
        this.availableCourses.set(list);
        this.addCourseForm = {
          courseId: list.length > 0 ? list[0].id : '',
          customSubject: '',
          serviceType: 1,
          scheduleNotes: ''
        };
        this.isAddCourseModalOpen.set(true);
      }
    });
  }

  closeAddCourseModal(): void {
    this.isAddCourseModalOpen.set(false);
  }

  onAddCourseSelectChange(): void {
    if (this.addCourseForm.courseId && this.addCourseForm.courseId !== 'OTHER') {
      const selected = this.availableCourses().find(c => c.id === this.addCourseForm.courseId);
      if (selected) {
        this.addCourseForm.serviceType = selected.serviceType || 1;
      }
    }
  }

  onSubmitAddCourse(): void {
    const user = this.authService.currentUser();
    if (!user) return;

    if (!this.addCourseForm.courseId || (this.addCourseForm.courseId === 'OTHER' && !this.addCourseForm.customSubject.trim())) {
      this.toast.show('Please select a course or enter custom subject name.', 'error');
      return;
    }

    let courseIdToSend = this.addCourseForm.courseId;
    let gradeLevelNotes = `Existing Student Additional Course Request: Grade 10`;

    if (this.addCourseForm.courseId === 'OTHER') {
      const customCourse = this.availableCourses().find(c => c.name.toLowerCase().includes('custom') || c.name.toLowerCase().includes('requested')) || this.availableCourses()[0];
      courseIdToSend = customCourse ? customCourse.id : '';
      gradeLevelNotes += ` (Custom Requested Subject: ${this.addCourseForm.customSubject.trim()})`;
    }

    if (this.addCourseForm.scheduleNotes.trim()) {
      gradeLevelNotes += ` | Preferred Schedule: ${this.addCourseForm.scheduleNotes.trim()}`;
    }

    const payload = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: (user as any).phoneNumber || '0911000000',
      gradeLevel: gradeLevelNotes,
      address: 'Student Dashboard Addition',
      desiredServiceType: this.addCourseForm.serviceType,
      courseId: courseIdToSend
    };

    this.submittingAddCourse.set(true);
    this.registrationService.submitRegistration(payload).subscribe({
      next: () => {
        this.submittingAddCourse.set(false);
        this.closeAddCourseModal();
        this.toast.show(' Your additional course request has been submitted! Admin will check teacher availability within 3-5 working hours.', 'success');
      },
      error: (err) => {
        this.submittingAddCourse.set(false);
        this.toast.show(err.error?.message || 'Failed to submit course request.', 'error');
      }
    });
  }

  getServiceName(type?: number): string {
    if (type === 2) return 'Group Class';
    if (type === 3) return 'Home Visit';
    return 'Online 1-on-1';
  }

  loadAnnouncements(): void {
    const user = this.authService.currentUser();
    const role = user ? (user.role === 'Admin' || user.role === 1 ? 1 : user.role === 'Teacher' || user.role === 2 ? 2 : user.role === 'Student' || user.role === 3 ? 3 : 4) : undefined;

    this.announcementService.getAnnouncements(role).subscribe({
      next: (list) => {
        this.announcements.set(list.slice(0, 3));
      },
      error: () => {}
    });
  }

  getTargetRoleLabel(role?: any): string {
    if (role === 1 || role === '1' || role === 'Admin') return 'Admins';
    if (role === 2 || role === '2' || role === 'Teacher') return 'Teachers';
    if (role === 3 || role === '3' || role === 'Student') return 'Students';
    if (role === 4 || role === '4' || role === 'Parent') return 'Parents';
    return 'Campus';
  }
}
