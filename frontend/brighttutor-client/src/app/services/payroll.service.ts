import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TeacherSessionBreakdownDto {
  attendanceId: string;
  courseName: string;
  serviceTypeName: string;
  attendanceDate: string;
  durationHours: number;
  ratePerHourOrVisit: number;
  travelFee: number;
  totalPay: number;
}

export interface TeacherPayrollDto {
  teacherId: string;
  teacherName: string;
  specialization: string;
  totalEarnings: number;
  totalHours: number;
  totalSessions: number;
  onlineEarnings: number;
  groupEarnings: number;
  homeVisitEarnings: number;
  travelAllowance: number;
  sessions: TeacherSessionBreakdownDto[];
}

export interface StudentSessionLineItemDto {
  attendanceId: string;
  courseName: string;
  serviceTypeName: string;
  sessionDate: string;
  durationHours: number;
  rate: number;
  amount: number;
}

export interface StudentInvoiceDto {
  studentId: string;
  studentName: string;
  studentCode: string;
  gradeLevel: string;
  totalAmountDue: number;
  totalSessionsAttended: number;
  onlineTotal: number;
  groupTotal: number;
  homeVisitTotal: number;
  invoiceDate: string;
  lineItems: StudentSessionLineItemDto[];
}

@Injectable({
  providedIn: 'root'
})
export class PayrollService {
  private apiUrl = 'http://localhost:5198/api/payroll';

  constructor(private http: HttpClient) {}

  getTeacherPayouts(startDate?: string, endDate?: string, teacherId?: string): Observable<TeacherPayrollDto[]> {
    let url = `${this.apiUrl}/teacher-payouts`;
    const params: string[] = [];
    if (startDate) params.push(`startDate=${startDate}`);
    if (endDate) params.push(`endDate=${endDate}`);
    if (teacherId) params.push(`teacherId=${teacherId}`);
    if (params.length > 0) url += `?${params.join('&')}`;

    return this.http.get<TeacherPayrollDto[]>(url);
  }

  getStudentInvoices(startDate?: string, endDate?: string, studentId?: string): Observable<StudentInvoiceDto[]> {
    let url = `${this.apiUrl}/student-invoices`;
    const params: string[] = [];
    if (startDate) params.push(`startDate=${startDate}`);
    if (endDate) params.push(`endDate=${endDate}`);
    if (studentId) params.push(`studentId=${studentId}`);
    if (params.length > 0) url += `?${params.join('&')}`;

    return this.http.get<StudentInvoiceDto[]>(url);
  }
}
