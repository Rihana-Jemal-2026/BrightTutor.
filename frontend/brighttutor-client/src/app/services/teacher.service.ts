import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TeacherDto {
  id: string;
  teacherId?: string;
  userId?: string;
  specialization?: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TeacherService {
  private apiUrl = 'http://localhost:5198/api/teachers';

  constructor(private http: HttpClient) {}

  getTeachers(specialization?: string): Observable<TeacherDto[]> {
    let url = this.apiUrl;
    if (specialization) url += `?specialization=${encodeURIComponent(specialization)}`;
    return this.http.get<TeacherDto[]>(url);
  }
}
