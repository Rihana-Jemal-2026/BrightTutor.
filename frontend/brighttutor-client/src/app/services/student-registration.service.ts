import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SubmitRegistrationDto {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  gradeLevel: string;
  address: string;
  gpsLatitude?: number;
  gpsLongitude?: number;
  desiredServiceType: number; // 1=Online, 2=Group, 3=HomeToHome
  courseId: string;
}

export interface UploadReceiptDto {
  registrationId: string;
  paymentChannel: string;
  transactionId: string;
  amountPaid: number;
  receiptImageBase64: string;
}

export interface StudentRegistrationDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  gradeLevel: string;
  address: string;
  gpsLatitude?: number;
  gpsLongitude?: number;
  desiredServiceType: number;
  courseId: string;
  status: number; // 1=PendingApproval, 2=ApprovedPendingPayment, 3=PaymentSubmitted, 4=VerifiedAndEnrolled, 5=Rejected
  adminNotes?: string;
  paymentChannel?: string;
  transactionId?: string;
  amountPaid?: number;
  receiptImageBase64?: string;
  issuedStudentCode?: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class StudentRegistrationService {
  private apiUrl = 'http://localhost:5198/api/studentregistration';

  constructor(private http: HttpClient) {}

  submitRegistration(dto: SubmitRegistrationDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/submit`, dto);
  }

  uploadReceipt(dto: UploadReceiptDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/upload-receipt`, dto);
  }

  getPendingApprovals(): Observable<StudentRegistrationDto[]> {
    return this.http.get<StudentRegistrationDto[]>(`${this.apiUrl}/pending-approvals`);
  }

  approveRegistration(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/approve-registration`, {});
  }

  verifyPayment(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/verify-payment`, {});
  }

  rejectRegistration(id: string, reason: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/reject`, JSON.stringify(reason), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
