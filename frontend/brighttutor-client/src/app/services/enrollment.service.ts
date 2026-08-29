import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EnrollmentDto, EnrollStudentRequest, EnrollStudentResponse } from '../models/enrollment.model';

export type { EnrollmentDto, EnrollStudentRequest, EnrollStudentResponse };

@Injectable({
  providedIn: 'root'
})
export class EnrollmentService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5198/api/enrollments';

  getEnrollments(courseId?: string, classGroupId?: string, studentId?: string): Observable<EnrollmentDto[]> {
    let params = new HttpParams();
    if (courseId) params = params.set('courseId', courseId);
    if (classGroupId) params = params.set('classGroupId', classGroupId);
    if (studentId) params = params.set('studentId', studentId);

    return this.http.get<EnrollmentDto[]>(this.apiUrl, { params });
  }

  getAllEnrollments(courseId?: string, classGroupId?: string): Observable<EnrollmentDto[]> {
    return this.getEnrollments(courseId, classGroupId);
  }

  getStudentEnrollments(studentId: string): Observable<EnrollmentDto[]> {
    return this.http.get<EnrollmentDto[]>(`${this.apiUrl}/student/${studentId}`);
  }

  getCourseEnrollments(courseId: string, classGroupId?: string): Observable<EnrollmentDto[]> {
    let params = new HttpParams();
    if (classGroupId) params = params.set('classGroupId', classGroupId);
    return this.http.get<EnrollmentDto[]>(`${this.apiUrl}/course/${courseId}`, { params });
  }

  enrollStudent(request: EnrollStudentRequest): Observable<EnrollStudentResponse> {
    return this.http.post<EnrollStudentResponse>(this.apiUrl, request);
  }

  updateEnrollment(id: string, request: { courseId?: string; classGroupId?: string; isActive: boolean }): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, request);
  }

  unenrollStudent(enrollmentId: string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${enrollmentId}/unenroll`, {});
  }
}
