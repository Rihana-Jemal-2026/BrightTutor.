import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ScheduleDto, CreateScheduleRequest, UpdateScheduleRequest, ScheduleStatus } from '../models/schedule.model';

@Injectable({
  providedIn: 'root'
})
export class ScheduleService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5198/api/schedules';

  getSchedules(filters?: {
    teacherId?: string;
    studentId?: string;
    courseId?: string;
    classGroupId?: string;
    serviceType?: number;
    status?: number;
    fromDate?: string;
    toDate?: string;
  }): Observable<ScheduleDto[]> {
    let params = new HttpParams();
    if (filters) {
      if (filters.teacherId) params = params.set('teacherId', filters.teacherId);
      if (filters.studentId) params = params.set('studentId', filters.studentId);
      if (filters.courseId) params = params.set('courseId', filters.courseId);
      if (filters.classGroupId) params = params.set('classGroupId', filters.classGroupId);
      if (filters.serviceType !== undefined && filters.serviceType !== null) params = params.set('serviceType', filters.serviceType.toString());
      if (filters.status !== undefined && filters.status !== null) params = params.set('status', filters.status.toString());
      if (filters.fromDate) params = params.set('fromDate', filters.fromDate);
      if (filters.toDate) params = params.set('toDate', filters.toDate);
    }

    return this.http.get<ScheduleDto[]>(this.apiUrl, { params });
  }

  getScheduleById(id: string): Observable<ScheduleDto> {
    return this.http.get<ScheduleDto>(`${this.apiUrl}/${id}`);
  }

  createSchedule(request: CreateScheduleRequest): Observable<any> {
    return this.http.post<any>(this.apiUrl, request);
  }

  updateSchedule(id: string, request: any): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, request);
  }

  updateScheduleStatus(id: string, status: ScheduleStatus): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/status`, status, {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
