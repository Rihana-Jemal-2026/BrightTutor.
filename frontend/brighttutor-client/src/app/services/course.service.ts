import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CourseDto {
  id: string;
  name: string;
  description?: string;
  serviceType: number;
  isActive: boolean;
  classGroupCount: number;
  createdAt: string;
}

export interface ClassGroupDto {
  id: string;
  courseId: string;
  courseName: string;
  name: string;
  maximumStudents: number;
  enrolledStudentsCount: number;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private apiUrl = 'http://localhost:5198/api';

  constructor(private http: HttpClient) {}

  getCourses(serviceType?: number, isActive?: boolean): Observable<CourseDto[]> {
    let url = `${this.apiUrl}/courses`;
    const params: string[] = [];
    if (serviceType !== undefined && serviceType !== null) params.push(`serviceType=${serviceType}`);
    if (isActive !== undefined && isActive !== null) params.push(`isActive=${isActive}`);
    if (params.length > 0) url += `?${params.join('&')}`;

    return this.http.get<CourseDto[]>(url);
  }

  createCourse(course: { name: string; description?: string; serviceType: number }): Observable<any> {
    return this.http.post(`${this.apiUrl}/courses`, course);
  }

  updateCourse(id: string, course: { name: string; description?: string; serviceType: number }): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/courses/${id}`, course);
  }

  toggleCourseStatus(id: string, isActive: boolean): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/courses/${id}/status`, { isActive });
  }

  getClassGroups(courseId?: string): Observable<ClassGroupDto[]> {
    let url = `${this.apiUrl}/classgroups`;
    if (courseId) url += `?courseId=${courseId}`;
    return this.http.get<ClassGroupDto[]>(url);
  }

  createClassGroup(group: { courseId: string; name: string; maximumStudents: number }): Observable<any> {
    return this.http.post(`${this.apiUrl}/classgroups`, group);
  }

  updateClassGroup(id: string, group: { name: string; maximumStudents: number }): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/classgroups/${id}`, group);
  }

  toggleClassGroupStatus(id: string, isActive: boolean): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/classgroups/${id}/status`, { isActive });
  }
}
