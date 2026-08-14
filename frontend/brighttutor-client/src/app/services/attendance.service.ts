import {
  MarkTeacherAttendanceRequest,
  MarkOnlineAttendanceRequest,
  CheckInHomeAttendanceRequest,
  CheckOutHomeAttendanceRequest,
} from "../models/attendance.model";

import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import {
  MarkGroupAttendanceRequest,
  MarkGroupAttendanceResponse,
  GroupAttendanceRecord,
  ClassAttendanceReport,
  StudentAttendanceSummary,
} from "../models/attendance.model";

@Injectable({ providedIn: "root" })
export class AttendanceService {
  private http = inject(HttpClient);

  // IMPORTANT: match this to whatever port your BrightTutor.Api prints when you run `dotnet run`.
  private baseUrl = "http://localhost:5198/api/attendance";

  markGroupAttendance(request: MarkGroupAttendanceRequest) {
    return this.http.post<MarkGroupAttendanceResponse>(`${this.baseUrl}/group`, request);
  }
markTeacherAttendance(request: MarkTeacherAttendanceRequest) {
  return this.http.post<string>(`${this.baseUrl}/teacher`, request);
}

markOnlineAttendance(request: MarkOnlineAttendanceRequest) {
  return this.http.post<string>(`${this.baseUrl}/online`, request);
}

checkInHomeAttendance(request: CheckInHomeAttendanceRequest) {
  return this.http.post<string>(`${this.baseUrl}/home/checkin`, request);
}

checkOutHomeAttendance(request: CheckOutHomeAttendanceRequest) {
  return this.http.post<{ message: string }>(`${this.baseUrl}/home/checkout`, request);
}

  getGroupAttendance(classGroupId: string, attendanceDate: string) {
    return this.http.get<GroupAttendanceRecord[]>(`${this.baseUrl}/group`, {
      params: { classGroupId, attendanceDate },
    });
  }

  getClassReport(classGroupId: string, startDate: string, endDate: string) {
    return this.http.get<ClassAttendanceReport>(`${this.baseUrl}/class-report`, {
      params: { classGroupId, startDate, endDate },
    });
  }

  getStudentSummary(studentId: string, startDate: string, endDate: string) {
    return this.http.get<StudentAttendanceSummary>(`${this.baseUrl}/student-summary`, {
      params: { studentId, startDate, endDate },
    });
  }
}