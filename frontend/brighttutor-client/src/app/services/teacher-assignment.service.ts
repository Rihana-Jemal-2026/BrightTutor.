import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TeacherAssignmentDto {
  id: string;
  teacherId: string;
  teacherName: string;
  courseId: string;
  courseName: string;
  classGroupId?: string;
  classGroupName?: string;
  startDate: string;
}

export interface AssignTeacherRequest {
  teacherId: string;
  courseId: string;
  classGroupId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TeacherAssignmentService {
  private apiUrl = 'http://localhost:5198/api/teacherassignments';

  constructor(private http: HttpClient) {}

  getTeacherAssignments(teacherId?: string): Observable<TeacherAssignmentDto[]> {
    let url = this.apiUrl;
    if (teacherId) url += `?teacherId=${teacherId}`;
    return this.http.get<TeacherAssignmentDto[]>(url);
  }

  assignTeacher(request: AssignTeacherRequest): Observable<any> {
    return this.http.post(this.apiUrl, request);
  }

  removeTeacherAssignment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
