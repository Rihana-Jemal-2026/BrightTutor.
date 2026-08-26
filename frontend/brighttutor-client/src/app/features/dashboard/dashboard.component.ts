import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService, DashboardSummaryDto } from '../../services/dashboard.service';
import { AttendanceService } from '../../services/attendance.service';
import { AnnouncementService } from '../../services/announcement.service';
import { AuthService } from '../../services/auth.service';
import { StudentAttendanceSummary } from '../../models/attendance.model';
import { AnnouncementDto } from '../../models/announcement.model';

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
          <a routerLink="/schedules" class="action-card">
            <div class="action-icon">📅</div>
            <div class="action-details">
              <h3>Timetables & Schedules</h3>
              <p>View upcoming class timetables, online meeting rooms, and home sessions.</p>
            </div>
          </a>

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
          <a routerLink="/schedules" class="action-card">
            <div class="action-icon">📅</div>
            <div class="action-details">
              <h3>My Class Timetable</h3>
              <p>Check scheduled class hours, room numbers, and online video links.</p>
            </div>
          </a>

          <a routerLink="/student-calendar" class="action-card">
            <div class="action-icon">📆</div>
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

      <!-- Campus Announcements Feed Widget (Visible across all roles) -->
      <div class="section-header-row">
        <div class="section-title" style="margin: 0;">📢 Campus Announcements Bulletin</div>
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
            <span>📢</span> No announcements currently published.
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .dashboard-page { padding: 1.5rem; }
    .page-header h1 { font-size: 1.75rem; margin-bottom: 0.25rem; color: #1e293b; }
    .page-header p { color: #64748b; margin-bottom: 1.5rem; }
    .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem; margin-bottom: 2rem; }
    .metric-card { background: white; border-radius: 12px; padding: 1.25rem; display: flex; align-items: center; gap: 1rem; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border-left: 4px solid #3b82f6; }
    .metric-card.success { border-left-color: #10b981; }
    .metric-card.info { border-left-color: #06b6d4; }
    .metric-card.warning { border-left-color: #f59e0b; }
    .metric-icon { font-size: 2rem; }
    .metric-info .value { display: block; font-size: 1.75rem; font-weight: 700; color: #0f172a; }
    .metric-info .label { font-size: 0.875rem; color: #64748b; }
    .section-title { font-size: 1.25rem; font-weight: 600; color: #1e293b; margin-bottom: 1rem; margin-top: 1.5rem; }
    .section-header-row { display: flex; justify-content: space-between; align-items: center; margin-top: 2rem; margin-bottom: 1rem; }
    .view-all-link { color: #2563eb; text-decoration: none; font-weight: 600; font-size: 0.88rem; }
    .view-all-link:hover { text-decoration: underline; }

    .attendance-summary-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1rem; }
    .stat-box { background: white; padding: 1.25rem; border-radius: 10px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
    .stat-box .number { display: block; font-size: 1.5rem; font-weight: 700; min-height: 2rem; }
    .stat-box .text { font-size: 0.8rem; color: #64748b; }
    .scheduled .number { color: #3b82f6; }
    .present .number { color: #10b981; }
    .absent .number { color: #ef4444; }
    .late .number { color: #f59e0b; }
    .verified .number { color: #8b5cf6; }

    .quick-actions-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.25rem; margin-top: 0.5rem; }
    .action-card { background: white; border-radius: 12px; padding: 1.5rem; display: flex; align-items: flex-start; gap: 1rem; text-decoration: none; color: inherit; box-shadow: 0 4px 12px rgba(0,0,0,0.05); transition: transform 0.2s, box-shadow 0.2s; }
    .action-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
    .action-icon { font-size: 2.25rem; }
    .action-details h3 { margin: 0 0 0.35rem 0; font-size: 1.1rem; color: #0f172a; }
    .action-details p { margin: 0; font-size: 0.85rem; color: #64748b; line-height: 1.4; }

    .announcements-preview-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.25rem; }
    .announcement-preview-card { background: white; border-radius: 12px; padding: 1.25rem; box-shadow: 0 2px 8px rgba(0,0,0,0.04); border-left: 4px solid #7c3aed; }
    .announcement-meta { display: flex; justify-content: space-between; margin-bottom: 0.5rem; }
    .badge-role { font-size: 0.75rem; font-weight: 600; background: #f3e8ff; color: #7e22ce; padding: 0.15rem 0.5rem; border-radius: 10px; }
    .badge-date { font-size: 0.75rem; color: #94a3b8; }
    .preview-title { font-size: 1rem; font-weight: 700; color: #0f172a; margin: 0 0 0.4rem 0; }
    .preview-content { font-size: 0.85rem; color: #475569; line-height: 1.5; margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .empty-notices { background: white; border-radius: 12px; padding: 1.5rem; text-align: center; color: #94a3b8; font-size: 0.9rem; grid-column: 1 / -1; }

    .loading-spinner { padding: 2rem; text-align: center; color: #64748b; }
  `]
})
export class DashboardComponent implements OnInit {
  authService = inject(AuthService);
  private dashboardService = inject(DashboardService);
  private attendanceService = inject(AttendanceService);
  private announcementService = inject(AnnouncementService);

  summary = signal<DashboardSummaryDto | null>(null);
  studentStats = signal<StudentAttendanceSummary | null>(null);
  teacherStats = signal<any | null>(null);
  announcements = signal<AnnouncementDto[]>([]);
  loading = signal<boolean>(true);

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

  loadAnnouncements(): void {
    const user = this.authService.currentUser();
    const role = user ? (user.role === 'Admin' || user.role === 1 ? 1 : user.role === 'Teacher' || user.role === 2 ? 2 : user.role === 'Student' || user.role === 3 ? 3 : 4) : undefined;

    this.announcementService.getAnnouncements(role).subscribe({
      next: (list) => {
        this.announcements.set(list.slice(0, 3)); // show top 3 on dashboard
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
