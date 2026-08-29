import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface EnrollmentDto {
  id: string;
  studentId: string;
  studentName: string;
  courseId: string;
  courseName: string;
  classGroupId?: string;
  classGroupName?: string;
  enrollmentDate: string;
  serviceType: number;
}

export interface EnrollStudentRequest {
  studentId: string;
  courseId: string;
  classGroupId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EnrollmentService {
  private apiUrl = 'http://localhost:5198/api/enrollments';

  constructor(private http: HttpClient) {}

  getAllEnrollments(courseId?: string, classGroupId?: string): Observable<EnrollmentDto[]> {
    let url = this.apiUrl;
    const params: string[] = [];
    if (courseId) params.push(`courseId=${courseId}`);
    if (classGroupId) params.push(`classGroupId=${classGroupId}`);
    if (params.length > 0) url += `?${params.join('&')}`;

    return this.http.get<EnrollmentDto[]>(url);
  }

  enrollStudent(request: EnrollStudentRequest): Observable<any> {
    return this.http.post(this.apiUrl, request);
  }

  unenrollStudent(enrollmentId: string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${enrollmentId}/unenroll`, {});
  }
}
