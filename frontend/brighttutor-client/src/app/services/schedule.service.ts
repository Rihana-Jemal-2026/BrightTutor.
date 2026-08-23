import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ScheduleDto {
  id: string;
  courseId: string;
  courseName: string;
  teacherId: string;
  teacherName: string;
  classGroupId?: string;
  classGroupName?: string;
  studentId?: string;
  studentName?: string;
  serviceType: number;
  startTime: string;
  endTime: string;
  status: number;
  meetingUrl?: string;
  locationAddress?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ScheduleService {
  private apiUrl = 'http://localhost:5198/api/schedules';

  constructor(private http: HttpClient) {}

  getSchedules(teacherId?: string, studentId?: string, classGroupId?: string): Observable<ScheduleDto[]> {
    let url = this.apiUrl;
    const params: string[] = [];
    if (teacherId) params.push(`teacherId=${teacherId}`);
    if (studentId) params.push(`studentId=${studentId}`);
    if (classGroupId) params.push(`classGroupId=${classGroupId}`);
    if (params.length > 0) url += `?${params.join('&')}`;

    return this.http.get<ScheduleDto[]>(url);
  }

  createSchedule(schedule: any): Observable<any> {
    return this.http.post(this.apiUrl, schedule);
  }
}
