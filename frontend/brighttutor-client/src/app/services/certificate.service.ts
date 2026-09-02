import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CertificateDto {
  id: string;
  serialNumber: string;
  type: number; // 1=StudentCourseCompletion, 2=TeacherServiceExcellence
  recipientName: string;
  title: string;
  description: string;
  skillsLearned: string;
  timelineDuration: string;
  studentId?: string;
  teacherId?: string;
  courseId?: string;
  issueDate: string;
  attendancePercentage: number;
}

export interface EligibilityResultDto {
  studentName: string;
  courseName: string;
  totalSessions: number;
  presentCount: number;
  daysEnrolled?: number;
  attendancePercentage: number;
  absencePercentage: number;
  maxAllowedAbsenceRule: string;
  isEligible: boolean;
  statusMessage: string;
}

export interface TeacherEligibilityResultDto {
  teacherName: string;
  specialization: string;
  daysInService: number;
  isEligible: boolean;
  statusMessage: string;
}

@Injectable({
  providedIn: 'root'
})
export class CertificateService {
  private apiUrl = 'http://localhost:5198/api/certificates';

  constructor(private http: HttpClient) {}

  checkStudentEligibility(studentId: string, courseId: string): Observable<EligibilityResultDto> {
    return this.http.get<EligibilityResultDto>(`${this.apiUrl}/student-eligibility?studentId=${studentId}&courseId=${courseId}`);
  }

  checkTeacherEligibility(teacherId: string): Observable<TeacherEligibilityResultDto> {
    return this.http.get<TeacherEligibilityResultDto>(`${this.apiUrl}/teacher-eligibility?teacherId=${teacherId}`);
  }

  issueStudentCertificate(studentId: string, courseId: string): Observable<CertificateDto> {
    return this.http.post<CertificateDto>(`${this.apiUrl}/issue-student-certificate`, { studentId, courseId });
  }

  issueTeacherCertificate(teacherId: string): Observable<CertificateDto> {
    return this.http.post<CertificateDto>(`${this.apiUrl}/issue-teacher-certificate`, { teacherId });
  }

  verifyCertificate(serialNumber: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/verify/${serialNumber}`);
  }

  getMyCertificates(userId: string): Observable<CertificateDto[]> {
    return this.http.get<CertificateDto[]>(`${this.apiUrl}/my-certificates?userId=${userId}`);
  }

  getCertificateById(id: string): Observable<CertificateDto> {
    return this.http.get<CertificateDto>(`${this.apiUrl}/${id}`);
  }
}
