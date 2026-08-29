import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TeacherAssignmentDto, AssignTeacherRequest } from '../models/teacher-assignment.model';

@Injectable({
  providedIn: 'root'
})
export class TeacherAssignmentService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5198/api/teacherassignments';

  getTeacherAssignments(teacherId?: string, courseId?: string, classGroupId?: string): Observable<TeacherAssignmentDto[]> {
    let params = new HttpParams();
    if (teacherId) params = params.set('teacherId', teacherId);
    if (courseId) params = params.set('courseId', courseId);
    if (classGroupId) params = params.set('classGroupId', classGroupId);
    return this.http.get<TeacherAssignmentDto[]>(this.apiUrl, { params });
  }

  assignTeacher(request: AssignTeacherRequest): Observable<TeacherAssignmentDto> {
    return this.http.post<TeacherAssignmentDto>(this.apiUrl, request);
  }

  updateTeacherAssignment(id: string, request: { courseId: string; classGroupId?: string; teacherId?: string }): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, request);
  }

  removeTeacherAssignment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
