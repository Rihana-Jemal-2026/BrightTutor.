import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService, DashboardSummaryDto } from '../../services/dashboard.service';
import { AttendanceService } from '../../services/attendance.service';
import { AuthService } from '../../services/auth.service';
import { CertificateService, CertificateDto } from '../../services/certificate.service';
import { StudentAttendanceSummary } from '../../models/attendance.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard-page">
      <!-- Admin Dashboard View -->
      @if (authService.isAdmin()) {
        <div class="page-header">
          <h1>📊 Executive Admin Dashboard</h1>
          <p>Real-time system metrics, course activity, and attendance monitoring.</p>
        </div>

        @if (loading()) {
          <div class="loading-spinner">Loading dashboard analytics...</div>
        } @else {
          <div class="metrics-grid">
            <div class="metric-card primary">
              <div class="metric-icon">👥</div>
              <div class="metric-info">
                <span class="value">{{ summary()?.totalUsers ?? 0 }}</span>
                <span class="label">Total System Users</span>
              </div>
            </div>

            <div class="metric-card success">
              <div class="metric-icon">🎓</div>
              <div class="metric-info">
                <span class="value">{{ summary()?.totalStudents ?? 0 }}</span>
                <span class="label">Active Students</span>
              </div>
            </div>

            <div class="metric-card info">
              <div class="metric-icon">👨‍🏫</div>
              <div class="metric-info">
                <span class="value">{{ summary()?.totalTeachers ?? 0 }}</span>
                <span class="label">Registered Teachers</span>
              </div>
            </div>

            <div class="metric-card warning">
              <div class="metric-icon">📚</div>
              <div class="metric-info">
                <span class="value">{{ summary()?.totalActiveCourses ?? 0 }}</span>
                <span class="label">Active Courses</span>
              </div>
            </div>
          </div>

          <div class="section-title">📜 Academic Certificate Management</div>
          <div class="quick-actions-grid">
            <a routerLink="/certificates" class="action-card cert-action">
              <div class="action-icon">📜</div>
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
          <h1>👨‍🏫 Teacher Portal Dashboard</h1>
          <p>Welcome back, <strong>{{ authService.currentUser()?.firstName }} {{ authService.currentUser()?.lastName }}</strong>! Personal activity & service credentials.</p>
        </div>

        @if (loading()) {
          <div class="loading-spinner">Loading personal activity stats...</div>
        } @else if (teacherStats()) {
          <div class="metrics-grid">
            <div class="metric-card success">
              <div class="metric-icon">📈</div>
              <div class="metric-info">
                <span class="value">{{ teacherStats()?.attendancePercentage ?? 0 }}%</span>
                <span class="label">Teaching Attendance Rate</span>
              </div>
            </div>
            <div class="metric-card primary">
              <div class="metric-icon">✅</div>
              <div class="metric-info">
                <span class="value">{{ teacherStats()?.presentCount ?? 0 }}</span>
                <span class="label">Sessions Conducted</span>
              </div>
            </div>
            <div class="metric-card info">
              <div class="metric-icon">🏆</div>
              <div class="metric-info">
                <span class="value">Active Educator</span>
                <span class="label">1-Year Service Eligible</span>
              </div>
            </div>
          </div>
        }

        <div class="section-title">🏆 My Service Excellence Certificates</div>
        <div class="cert-section-box">
          <div class="cert-banner">
            <div class="cert-icon">🏅</div>
            <div>
              <h3>Teacher Service Excellence Certificate (1+ Year Service)</h3>
              <p>Recognizing your instructional service and mentorship at BrightTutor Academy.</p>
            </div>
            <button type="button" class="btn-cert-action" (click)="openCertificatesModal()">📜 View & Print My Certificate</button>
          </div>
        </div>

        <div class="section-title">🚀 Quick Actions & Tools</div>
        <div class="quick-actions-grid">
          <a routerLink="/mark-group-attendance" class="action-card">
            <div class="action-icon">👨‍👩‍👧‍👦</div>
            <div class="action-details">
              <h3>Mark Group Attendance</h3>
              <p>Record daily roster attendance for assigned class groups.</p>
            </div>
          </a>

          <a routerLink="/mark-online-attendance" class="action-card">
            <div class="action-icon">💻</div>
            <div class="action-details">
              <h3>Mark Online Session</h3>
              <p>Record 1-on-1 or group online video tutoring attendance.</p>
            </div>
          </a>

          <a routerLink="/home-attendance" class="action-card">
            <div class="action-icon">🏠</div>
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
          <h1>🎓 Student Portal Dashboard</h1>
          <p>Welcome, <strong>{{ authService.currentUser()?.firstName }} {{ authService.currentUser()?.lastName }}</strong>! Your academic summary & completion credentials.</p>
        </div>

        @if (loading()) {
          <div class="loading-spinner">Loading your attendance records...</div>
        } @else if (studentStats()) {
          <div class="metrics-grid">
            <div class="metric-card success">
              <div class="metric-icon">🏆</div>
              <div class="metric-info">
                <span class="value">{{ studentStats()?.attendancePercentage ?? 0 }}%</span>
                <span class="label">My Attendance Rate</span>
              </div>
            </div>
            <div class="metric-card primary">
              <div class="metric-icon">✅</div>
              <div class="metric-info">
                <span class="value">{{ studentStats()?.presentCount ?? 0 }}</span>
                <span class="label">Sessions Present</span>
              </div>
            </div>
            <div class="metric-card warning">
              <div class="metric-icon">⏰</div>
              <div class="metric-info">
                <span class="value">{{ studentStats()?.lateCount ?? 0 }}</span>
                <span class="label">Sessions Late</span>
              </div>
            </div>
          </div>
        }

        <div class="section-title">📜 My 3-Month Course Completion Certificates</div>
        <div class="cert-section-box">
          <div class="cert-banner student-banner">
            <div class="cert-icon">🎓</div>
            <div>
              <h3>3-Month Academic Completion Certificate</h3>
              <p>Rule: Absence rate must be &lt;20.0% (&ge;80% attendance rate over 12-week curriculum).</p>
            </div>
            <a routerLink="/certificates" class="btn-cert-action">📜 Check Eligibility & Download Certificate</a>
          </div>
        </div>

        <div class="section-title">🚀 Quick Actions & Portals</div>
        <div class="quick-actions-grid">
          <a routerLink="/student-calendar" class="action-card">
            <div class="action-icon">📅</div>
            <div class="action-details">
              <h3>My Attendance Calendar</h3>
              <p>View monthly color-coded attendance days and timestamps.</p>
            </div>
          </a>

          <a routerLink="/student-summary" class="action-card">
            <div class="action-icon">🎓</div>
            <div class="action-details">
              <h3>My Attendance Summary</h3>
              <p>View aggregate attendance rate percentages and status breakdown.</p>
            </div>
          </a>
        </div>
      }

      <!-- Certificate Display Modal -->
      @if (viewingCert()) {
        <div class="cert-modal-overlay" (click)="viewingCert.set(false)">
          <div class="cert-frame" (click)="$event.stopPropagation()">
            <button type="button" class="close-cert-btn" (click)="viewingCert.set(false)">&times;</button>
            <div class="cert-inner-border">
              <div class="cert-seal">🏅</div>
              <div class="cert-header">BRIGHTTUTOR ACADEMIC ACADEMY</div>
              <div class="cert-sub">OFFICIAL DIPLOMA OF SERVICE EXCELLENCE</div>
              <div class="cert-body">
                <p>This official certificate is proudly awarded to</p>
                <h1 class="recipient-name">{{ authService.currentUser()?.firstName }} {{ authService.currentUser()?.lastName }}</h1>
                <p class="cert-desc">Presented in recognition of outstanding instructional service, pedagogical dedication, and 1+ year of active service as a Certified Tutor at BrightTutor Academy.</p>
              </div>
              <div class="cert-footer">
                <div class="sig-block"><div class="sig-line">Academic Director</div></div>
                <div class="cert-serial">Serial: <code>CERT-TCH-2026-ACTIVE</code></div>
                <div class="sig-block"><div class="sig-line">Director of Education</div></div>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard-page { padding: 1.5rem; }
    .page-header h1 { font-size: 1.75rem; margin-bottom: 0.25rem; color: var(--color-primary); }
    .page-header p { color: var(--color-muted); margin-bottom: 1.5rem; }
    .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem; margin-bottom: 1.5rem; }
    .metric-card { background: var(--color-surface); border-radius: 12px; padding: 1.25rem; display: flex; align-items: center; gap: 1rem; box-shadow: var(--shadow-card); border: 1px solid var(--color-border); border-left: 4px solid var(--color-accent); }
    .metric-card.primary { border-left-color: var(--color-primary); }
    .metric-card.success { border-left-color: var(--color-accent-bright); }
    .metric-card.info { border-left-color: #0284c7; }
    .metric-card.warning { border-left-color: #d97706; }
    .metric-icon { font-size: 2rem; }
    .metric-info .value { display: block; font-size: 1.75rem; font-weight: 700; color: var(--color-text); }
    .metric-info .label { font-size: 0.85rem; color: var(--color-muted); }
    .section-title { font-size: 1.2rem; font-weight: 700; color: var(--color-primary); margin: 1.5rem 0 0.75rem 0; }
    .quick-actions-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.25rem; }
    .action-card { background: var(--color-surface); border-radius: 12px; padding: 1.25rem; display: flex; align-items: flex-start; gap: 1rem; text-decoration: none; color: inherit; box-shadow: var(--shadow-card); border: 1px solid var(--color-border); }
    .action-card.cert-action { border-color: #8b5cf6; background: rgba(139, 92, 246, 0.05); }
    .action-icon { font-size: 2.25rem; }
    .action-details h3 { margin: 0 0 0.35rem 0; font-size: 1.1rem; color: var(--color-primary); }
    .action-details p { margin: 0; font-size: 0.85rem; color: var(--color-muted); }

    .cert-section-box { background: var(--color-surface); border: 1px solid var(--color-border); padding: 1.25rem; border-radius: 12px; margin-bottom: 1rem; }
    .cert-banner { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
    .cert-icon { font-size: 2.5rem; }
    .cert-banner h3 { margin: 0 0 0.25rem 0; color: var(--color-text); font-size: 1.1rem; }
    .cert-banner p { margin: 0; font-size: 0.85rem; color: var(--color-muted); }
    .btn-cert-action { background: #8b5cf6; color: #fff; border: none; padding: 0.65rem 1.25rem; border-radius: 8px; font-weight: 600; text-decoration: none; cursor: pointer; white-space: nowrap; }

    /* Digital Certificate Frame */
    .cert-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
    .cert-frame { background: #fff8eb; color: #1e293b; width: 100%; max-width: 750px; padding: 2rem; border-radius: 16px; border: 8px double #d97706; position: relative; }
    .close-cert-btn { position: absolute; top: 1rem; right: 1rem; background: none; border: none; font-size: 1.75rem; cursor: pointer; color: #78350f; }
    .cert-inner-border { border: 2px solid #b45309; padding: 1.5rem; text-align: center; border-radius: 8px; }
    .cert-seal { font-size: 2.5rem; }
    .cert-header { font-size: 1.4rem; font-weight: 900; letter-spacing: 2px; color: #78350f; }
    .cert-sub { font-size: 0.8rem; font-weight: 700; color: #b45309; margin-bottom: 1rem; }
    .recipient-name { font-size: 2rem; font-family: serif; color: #92400e; margin: 0.5rem 0; text-decoration: underline; }
    .cert-desc { font-size: 0.9rem; color: #451a03; max-width: 550px; margin: 0 auto 1rem auto; }
    .cert-footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 1.5rem; }
    .sig-block { width: 160px; text-align: center; }
    .sig-line { border-top: 1px solid #78350f; padding-top: 0.3rem; font-size: 0.75rem; font-weight: 700; color: #78350f; }
    .cert-serial { font-size: 0.75rem; color: #78350f; }
    .cert-serial code { font-weight: 800; background: #fde68a; padding: 0.1rem 0.4rem; border-radius: 4px; }
    .loading-spinner { padding: 2rem; text-align: center; color: var(--color-muted); }
  `]
})
export class DashboardComponent implements OnInit {
  authService = inject(AuthService);
  private dashboardService = inject(DashboardService);
  private attendanceService = inject(AttendanceService);

  summary = signal<DashboardSummaryDto | null>(null);
  studentStats = signal<StudentAttendanceSummary | null>(null);
  teacherStats = signal<any | null>(null);
  loading = signal<boolean>(true);
  viewingCert = signal<boolean>(false);

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (!user) {
      this.loading.set(false);
      return;
    }

    if (this.authService.isAdmin()) {
      this.dashboardService.getSummary().subscribe({
        next: (res) => {
          this.summary.set(res);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
    } else if (this.authService.isStudent() || this.authService.isParent()) {
      const startDate = '2026-08-01';
      const endDate = new Date().toISOString().substring(0, 10);
      this.attendanceService.getStudentSummary(user.userId, startDate, endDate).subscribe({
        next: (res) => {
          this.studentStats.set(res);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
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

  openCertificatesModal(): void {
    this.viewingCert.set(true);
  }
}
