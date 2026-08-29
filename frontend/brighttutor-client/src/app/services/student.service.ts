import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface StudentDto {
  id: string;
  studentId?: string;
  userId?: string;
  studentCode: string;
  gradeLevel?: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
}

@Injectable({
  providedIn: 'root'
})
export class StudentService {
  private apiUrl = 'http://localhost:5198/api/students';

  constructor(private http: HttpClient) {}

  getStudents(gradeLevel?: string): Observable<StudentDto[]> {
    let url = this.apiUrl;
    if (gradeLevel) url += `?gradeLevel=${encodeURIComponent(gradeLevel)}`;
    return this.http.get<StudentDto[]>(url);
  }
}
