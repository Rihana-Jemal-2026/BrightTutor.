import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LivenessChallenge, LivenessSample } from './liveness-check';

export interface QrSessionDto {
  classGroupId: string;
  courseName: string;
  groupName: string;
  timestamp: string;
  location: string;
  qrNonce: string;
  expiresAt: string;
}

export interface LiveAttendeeDto {
  attendanceId: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  referencePhotoUrl?: string;
  liveSnapshotUrl?: string;
  matchConfidence: number | null;
  checkInTime: string;
  status: string;
}

export interface QrScanCheckInDto {
  challengeId: string;
  samples: LivenessSample[];
  studentId: string;
  classGroupId: string;
  qrNonce: string;
  faceVerified: boolean;
  faceSnapshotBase64?: string;
  faceMatchConfidence?: number;
  faceDescriptorJson?: string;
}

@Injectable({
  providedIn: 'root'
})
export class QrAttendanceService {
  private apiUrl = 'http://localhost:5198/api/qrattendance';

  constructor(private http: HttpClient) {}

  startChallenge(studentId: string, classGroupId: string, qrNonce: string): Observable<LivenessChallenge> {
    return this.http.post<LivenessChallenge>(`${this.apiUrl}/liveness-challenge`, { studentId, classGroupId, qrNonce });
  }

  generateSessionQr(classGroupId: string, refresh = false): Observable<QrSessionDto> {
    return this.http.get<QrSessionDto>(`${this.apiUrl}/generate-session-qr?classGroupId=${classGroupId}&refresh=${refresh}`);
  }

  scanCheckIn(dto: QrScanCheckInDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/scan-check-in`, dto);
  }

  getLiveAttendees(classGroupId: string): Observable<LiveAttendeeDto[]> {
    return this.http.get<LiveAttendeeDto[]>(`${this.apiUrl}/live-attendees?classGroupId=${classGroupId}`);
  }
}
