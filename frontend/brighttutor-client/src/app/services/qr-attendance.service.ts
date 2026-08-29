import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface QrSessionDto {
  classGroupId: string;
  courseName: string;
  groupName: string;
  timestamp: string;
  location: string;
  qrNonce: string;
}

export interface QrScanCheckInDto {
  studentId: string;
  classGroupId: string;
  qrNonce: string;
  faceVerified: boolean;
  faceSnapshotBase64?: string;
}

@Injectable({
  providedIn: 'root'
})
export class QrAttendanceService {
  private apiUrl = 'http://localhost:5198/api/qrattendance';

  constructor(private http: HttpClient) {}

  generateSessionQr(classGroupId: string): Observable<QrSessionDto> {
    return this.http.get<QrSessionDto>(`${this.apiUrl}/generate-session-qr?classGroupId=${classGroupId}`);
  }

  scanCheckIn(dto: QrScanCheckInDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/scan-check-in`, dto);
  }
}
