import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AssessmentDto, MasterGradebookResponse } from '../models/assessment.model';

@Injectable({
  providedIn: 'root'
})
export class AssessmentService {
  private apiUrl = 'http://localhost:5198/api/assessments';

  constructor(private http: HttpClient) {}

  getAssessments(courseId?: string, classGroupId?: string, type?: number, studentId?: string): Observable<AssessmentDto[]> {
    let params: string[] = [];
    if (courseId) params.push(`courseId=${courseId}`);
    if (classGroupId) params.push(`classGroupId=${classGroupId}`);
    if (type) params.push(`type=${type}`);
    if (studentId) params.push(`studentId=${studentId}`);

    const query = params.length > 0 ? `?${params.join('&')}` : '';
    return this.http.get<AssessmentDto[]>(`${this.apiUrl}${query}`);
  }

  getAssessmentDetails(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  createAssessment(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  updateAssessment(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data);
  }

  submitAssessment(id: string, data: { studentId: string; submissionText?: string; attachmentUrl?: string; answersJson?: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/submit`, data);
  }

  gradeSubmission(submissionId: string, data: { score: number; letterGrade?: string; feedback?: string; teacherId?: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/submissions/${submissionId}/grade`, data);
  }

  getMasterGradebook(courseId: string, classGroupId?: string): Observable<MasterGradebookResponse> {
    const query = classGroupId ? `?classGroupId=${classGroupId}` : '';
    return this.http.get<MasterGradebookResponse>(`${this.apiUrl}/course/${courseId}/master-gradebook${query}`);
  }

  finalizeCourseGrade(courseId: string, data: {
    studentId: string;
    classGroupId?: string;
    teacherId: string;
    finalScore: number;
    letterGrade: string;
    honorsDistinction: string;
    teacherRemarks?: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/course/${courseId}/finalize-grade`, data);
  }

  deleteAssessment(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  clearAllAssessments(): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/clear-all`);
  }
}
