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