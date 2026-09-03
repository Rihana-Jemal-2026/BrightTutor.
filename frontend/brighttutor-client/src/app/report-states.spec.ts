import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AttendanceService } from './services/attendance.service';
import { AuthService } from './services/auth.service';
import { UserService } from './services/user.service';
import { CourseService } from './services/course.service';
import { TeacherAssignmentService } from './services/teacher-assignment.service';
import { ClassReportComponent } from './features/class-report/class-report.component';
import { StudentSummaryComponent } from './features/student-summary/student-summary.component';
import { TeacherReportComponent } from './features/teacher-report/teacher-report.component';
import { StudentCalendarComponent } from './features/student-calendar/student-calendar.component';
import { DailyOverviewComponent } from './features/daily-overview/daily-overview.component';
import { ViewGroupAttendanceComponent } from './features/view-group-attendance/view-group-attendance.component';

const cases = [
  [ClassReportComponent, 'getClassReport', null, { totalRecords: 0, studentBreakdown: [] }],
  [StudentSummaryComponent, 'getStudentSummary', 'onStudentSelected', { totalRecords: 0 }],
  [TeacherReportComponent, 'getTeacherReport', 'onTeacherSelected', { totalRecords: 0 }],
  [StudentCalendarComponent, 'getStudentCalendar', 'onStudentSelected', []],
  [DailyOverviewComponent, 'getDailyOverview', null, { totalStudentRecords: 0, teacherRecordsCount: 0 }],
  [ViewGroupAttendanceComponent, 'getGroupAttendance', null, []],
] as const;

for (const [component, method, select, empty] of cases) {
  describe(`${component.name} report states`, () => {
    let fixture: any;
    let api: ReturnType<typeof vi.fn>;
    beforeEach(async () => {
      api = vi.fn().mockReturnValue(of(empty));
      await TestBed.configureTestingModule({
        imports: [component],
        providers: [
          { provide: AttendanceService, useValue: { [method]: api } },
          { provide: AuthService, useValue: { currentUser: () => null, isTeacher: () => false, isStudent: () => false, isParent: () => false } },
          { provide: UserService, useValue: { getUsers: () => of([{ id: 'person', firstName: 'Test', lastName: 'Person' }]) } },
          { provide: CourseService, useValue: { getClassGroups: () => of([{ id: 'group', name: 'Test group' }]) } },
          { provide: TeacherAssignmentService, useValue: {} },
        ],
      }).compileComponents();
      fixture = TestBed.createComponent(component as any);
      await fixture.whenStable();
    });

    it(component === DailyOverviewComponent ? 'loads today immediately using the local date' : 'waits for interaction and loads automatically after a valid selection', async () => {
      if (component === DailyOverviewComponent) {
        const today = new Date();
        const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        expect(api).toHaveBeenCalledExactlyOnceWith(localDate);
        expect(fixture.nativeElement.textContent).not.toContain('Choose a date to view attendance');
        return;
      }
      expect(api).not.toHaveBeenCalled();
      expect(fixture.nativeElement.querySelector('.report-state')).toBeTruthy();
      if (select) fixture.componentInstance[select]('person');
      else if (fixture.componentInstance.onGroupSelected) fixture.componentInstance.onGroupSelected('group');
      else {
        const input = fixture.nativeElement.querySelector('input[type="date"]');
        input.value = '2026-09-02';
        input.dispatchEvent(new Event('input'));
      }
      await fixture.whenStable();
      expect(api).toHaveBeenCalledTimes(1);
      expect(fixture.nativeElement.textContent).toContain('No attendance records found');
    });

    it('shows a genuine failure only after submission and allows retry', async () => {
      api.mockClear();
      if (select) fixture.componentInstance[select]('person');
      api.mockReturnValueOnce(throwError(() => new Error('Unavailable')));
      fixture.componentInstance.search();
      await fixture.whenStable();
      expect(fixture.nativeElement.textContent).toContain('We couldn’t load this report');
      fixture.componentInstance.search();
      await fixture.whenStable();
      expect(api).toHaveBeenCalledTimes(2);
      expect(fixture.nativeElement.textContent).toContain('No attendance records found');
    });

    it('does not request a report with incomplete or invalid filters', async () => {
      api.mockClear();
      const c = fixture.componentInstance;
      if (c.startDate) { c.startDate.set('2026-09-10'); c.endDate.set('2026-09-01'); }
      else if (c.month) c.month.set(13);
      else if (c.date) c.date.set('');
      else c.attendanceDate.set('');
      c.search();
      await fixture.whenStable();
      expect(api).not.toHaveBeenCalled();
    });

    it('automatically updates results when a date filter changes', async () => {
      api.mockClear();
      if (select) fixture.componentInstance[select]('person');
      api.mockReturnValue(of(Array.isArray(empty)
        ? [{ id: 'record', studentId: 'person', studentName: 'Sample Student', date: '2026-09-03', status: 0 }]
        : { ...empty, totalRecords: 1, totalStudentRecords: 1, presentCount: 1, studentBreakdown: [] }));
      fixture.componentInstance.search();
      await fixture.whenStable();
      expect(fixture.nativeElement.querySelector('.report-state')).toBeNull();
      expect(fixture.nativeElement.querySelector('.summary-cards, .table-card, .day-list')).toBeTruthy();
      const input = fixture.nativeElement.querySelector('input[type="date"], input[type="number"]');
      input.value = input.type === 'date' ? '2026-09-02' : '2025';
      input.dispatchEvent(new Event('input'));
      await fixture.whenStable();
      expect(fixture.nativeElement.querySelector('.report-state')).toBeNull();
      expect(fixture.nativeElement.querySelector('.summary-cards, .table-card, .day-list')).toBeTruthy();
      expect(api).toHaveBeenCalledTimes(2);
    });
  });
}
