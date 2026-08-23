import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface DashboardSummaryDto {
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalActiveCourses: number;
  todayScheduledSessions: number;
  todayPresentCount: number;
  todayAbsentCount: number;
  todayLateCount: number;
  todayTeacherCheckedInCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = 'http://localhost:5198/api/dashboard';

  constructor(private http: HttpClient) {}

  getSummary(): Observable<DashboardSummaryDto> {
    return this.http.get<any>(`${this.apiUrl}/summary`).pipe(
      map(res => ({
        totalUsers: res.totalUsers ?? (res.totalStudents + res.totalTeachers + 1),
        totalStudents: res.totalStudents ?? 0,
        totalTeachers: res.totalTeachers ?? 0,
        totalActiveCourses: res.activeCourses ?? res.totalActiveCourses ?? 0,
        todayScheduledSessions: res.todayClassesCount ?? res.todayScheduledSessions ?? 0,
        todayPresentCount: res.todayPresentAttendance ?? res.todayPresentCount ?? 0,
        todayAbsentCount: res.todayAbsentAttendance ?? res.todayAbsentCount ?? 0,
        todayLateCount: res.todayLateAttendance ?? res.todayLateCount ?? 0,
        todayTeacherCheckedInCount: res.todayTeacherAttendanceCount ?? res.todayTeacherCheckedInCount ?? 0,
      }))
    );
  }
}
