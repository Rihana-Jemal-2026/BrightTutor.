import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService, DashboardSummaryDto } from '../../services/dashboard.service';
import { AttendanceService } from '../../services/attendance.service';
import { AuthService } from '../../services/auth.service';
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

          <div class="section-title">🌅 Today's Attendance Real-Time Summary</div>
          <div class="attendance-summary-cards">
            <div class="stat-box scheduled">
              <span class="number">{{ summary()?.todayScheduledSessions ?? 0 }}</span>
              <span class="text">Scheduled Sessions</span>
            </div>
            <div class="stat-box present">
              <span class="number">{{ summary()?.todayPresentCount ?? 0 }}</span>
              <span class="text">Students Present</span>
            </div>
            <div class="stat-box absent">
              <span class="number">{{ summary()?.todayAbsentCount ?? 0 }}</span>
              <span class="text">Students Absent</span>
            </div>
            <div class="stat-box late">
              <span class="number">{{ summary()?.todayLateCount ?? 0 }}</span>
              <span class="text">Students Late</span>
            </div>
            <div class="stat-box verified">
              <span class="number">{{ summary()?.todayTeacherCheckedInCount ?? 0 }}</span>
              <span class="text">Teachers Checked-In</span>
            </div>
          </div>
        }
      }

      <!-- Teacher Portal Dashboard View -->
      @if (authService.isTeacher()) {
        <div class="page-header">
          <h1>👨‍🏫 Teacher Portal Dashboard</h1>
          <p>Welcome back, <strong>{{ authService.currentUser()?.firstName }} {{ authService.currentUser()?.lastName }}</strong>! Here is your personal teaching activity overview.</p>
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
            <div class="metric-card warning">
              <div class="metric-icon">⏰</div>
              <div class="metric-info">
                <span class="value">{{ teacherStats()?.lateCount ?? 0 }}</span>
                <span class="label">Sessions Late</span>
              </div>
            </div>
            <div class="metric-card info">
              <div class="metric-icon">📊</div>
              <div class="metric-info">
                <span class="value">{{ teacherStats()?.totalRecords ?? 0 }}</span>
                <span class="label">Total Recorded Sessions</span>
              </div>
            </div>
          </div>
        }

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

          <a routerLink="/teacher-report" class="action-card">
            <div class="action-icon">📝</div>
            <div class="action-details">
              <h3>My Teaching Reports</h3>
              <p>View total sessions conducted and detailed performance logs.</p>
            </div>
          </a>
        </div>
      }

      <!-- Student & Parent Portal Dashboard View -->
      @if (authService.isStudent() || authService.isParent()) {
        <div class="page-header">
          <h1>🎓 Student Portal Dashboard</h1>
          <p>Welcome, <strong>{{ authService.currentUser()?.firstName }} {{ authService.currentUser()?.lastName }}</strong>! Here is your personal attendance summary.</p>
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
            <div class="metric-card info">
              <div class="metric-icon">📊</div>
              <div class="metric-info">
                <span class="value">{{ studentStats()?.totalRecords ?? 0 }}</span>
                <span class="label">Total Sessions</span>
              </div>
            </div>
          </div>
        }

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

          <a routerLink="/view-group-attendance" class="action-card">
            <div class="action-icon">📋</div>
            <div class="action-details">
              <h3>View My Class Attendance</h3>
              <p>Filter your attendance records by class group and session date.</p>
            </div>
          </a>
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard-page { padding: 1.5rem; }
    .page-header h1 { font-size: 1.75rem; margin-bottom: 0.25rem; color: var(--color-primary); font-family: var(--font-display); }
    .page-header p { color: var(--color-muted); margin-bottom: 1.5rem; }
    .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem; margin-bottom: 2rem; }
    .metric-card { background: var(--color-surface); border-radius: var(--radius-lg); padding: 1.25rem; display: flex; align-items: center; gap: 1rem; box-shadow: var(--shadow-card); border-left: 4px solid var(--color-accent); border: 1px solid var(--color-border); border-left-width: 4px; transition: all 0.2s ease-in-out; }
    .metric-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-card-hover); }
    .metric-card.primary { border-left-color: var(--color-primary); }
    .metric-card.success { border-left-color: var(--color-accent-bright); }
    .metric-card.info { border-left-color: #0284c7; }
    .metric-card.warning { border-left-color: #d97706; }
    .metric-icon { font-size: 2rem; }
    .metric-info .value { display: block; font-size: 1.75rem; font-weight: 700; color: var(--color-text); font-family: var(--font-display); }
    .metric-info .label { font-size: 0.875rem; color: var(--color-muted); font-weight: 500; }
    .section-title { font-size: 1.25rem; font-weight: 700; color: var(--color-primary); margin-bottom: 1rem; margin-top: 1rem; font-family: var(--font-display); }
    .attendance-summary-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1rem; }
    .stat-box { background: var(--color-surface); padding: 1.25rem; border-radius: var(--radius-md); text-align: center; box-shadow: var(--shadow-card); border: 1px solid var(--color-border); }
    .stat-box .number { display: block; font-size: 1.5rem; font-weight: 700; min-height: 2rem; font-family: var(--font-display); }
    .stat-box .text { font-size: 0.8rem; color: var(--color-muted); font-weight: 600; }
    .scheduled .number { color: #0284c7; }
    .present .number { color: var(--color-accent-bright); }
    .absent .number { color: var(--color-error); }
    .late .number { color: #d97706; }
    .verified .number { color: var(--color-primary); }

    .quick-actions-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.25rem; margin-top: 0.5rem; }
    .action-card { background: var(--color-surface); border-radius: var(--radius-lg); padding: 1.5rem; display: flex; align-items: flex-start; gap: 1rem; text-decoration: none; color: inherit; box-shadow: var(--shadow-card); border: 1px solid var(--color-border); transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s; }
    .action-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-card-hover); border-color: var(--color-accent-bright); }
    .action-icon { font-size: 2.25rem; }
    .action-details h3 { margin: 0 0 0.35rem 0; font-size: 1.1rem; color: var(--color-primary); }
    .action-details p { margin: 0; font-size: 0.85rem; color: var(--color-muted); line-height: 1.4; }
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
}
