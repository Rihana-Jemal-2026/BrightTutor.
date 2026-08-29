import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ApplyTeacherDto {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  specialization: string;
  yearsOfExperience: number;
  cvDocumentUrl?: string;
  backgroundDocUrl?: string;
  bioSummary?: string;
}

export interface TeacherApplicationDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  specialization: string;
  yearsOfExperience: number;
  cvDocumentUrl?: string;
  backgroundDocUrl?: string;
  bioSummary?: string;
  status: number; // 1=PendingScreening, 2=ApprovedAvailable, 3=Rejected
  rejectionReason?: string;
  hasAcceptedContractSla: boolean;
  contractAcceptedAt?: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class TeacherApplicationService {
  private apiUrl = 'http://localhost:5198/api/teacherapplication';

  constructor(private http: HttpClient) {}

  applyTeacher(dto: ApplyTeacherDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/apply`, dto);
  }

  getApplications(): Observable<TeacherApplicationDto[]> {
    return this.http.get<TeacherApplicationDto[]>(`${this.apiUrl}/applications`);
  }

  approveTeacher(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/approve`, {});
  }

  rejectTeacher(id: string, reason: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/reject`, { reason });
  }

  acceptSla(applicationId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/accept-sla`, { applicationId });
  }

  respondToAssignment(assignmentId: string, accept: boolean, rejectionReason?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/assignment-action`, { assignmentId, accept, rejectionReason });
  }
}
