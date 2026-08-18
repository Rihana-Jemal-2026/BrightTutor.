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

import { map } from "rxjs";

export function normalizeId(id: string | null | undefined): string {
  if (!id) return id ?? "";
  const trimmed = id.trim().toLowerCase();
  
  const mapping: Record<string, string> = {
    // Standard Student Formats (Emails, Usernames, IDs)
    "student1@brighttutor.com": "33333333-3333-3333-3333-333333333333",
    "student001": "33333333-3333-3333-3333-333333333333",
    "usr-std-001": "33333333-3333-3333-3333-333333333333",
    "std-001": "33333333-3333-3333-3333-333333333333",
    "std-1001": "33333333-3333-3333-3333-333333333333",
    "std1": "33333333-3333-3333-3333-333333333333",

    "student2@brighttutor.com": "33333333-3333-3333-3333-333333333334",
    "student002": "33333333-3333-3333-3333-333333333334",
    "usr-std-002": "33333333-3333-3333-3333-333333333334",
    "std-002": "33333333-3333-3333-3333-333333333334",
    "std-1002": "33333333-3333-3333-3333-333333333334",
    "std2": "33333333-3333-3333-3333-333333333334",

    "online.student@brighttutor.com": "44444444-4444-4444-4444-444444444444",
    "usr-std-online": "44444444-4444-4444-4444-444444444444",
    "std-online": "44444444-4444-4444-4444-444444444444",
    "student_online": "44444444-4444-4444-4444-444444444444",
    "stdo1": "44444444-4444-4444-4444-444444444444",

    "home.student@brighttutor.com": "55555555-5555-5555-5555-555555555555",
    "usr-std-home": "55555555-5555-5555-5555-555555555555",
    "std-home": "55555555-5555-5555-5555-555555555555",
    "student_home": "55555555-5555-5555-5555-555555555555",
    "stdh1": "55555555-5555-5555-5555-555555555555",

    // Standard Teacher Formats
    "teacher1@brighttutor.com": "22222222-2222-2222-2222-222222222222",
    "teacher001": "22222222-2222-2222-2222-222222222222",
    "usr-tch-001": "22222222-2222-2222-2222-222222222222",
    "tch-001": "22222222-2222-2222-2222-222222222222",
    "tch-2001": "22222222-2222-2222-2222-222222222222",
    "th1": "22222222-2222-2222-2222-222222222222",

    "teacher2@brighttutor.com": "22222222-2222-2222-2222-222222222223",
    "teacher002": "22222222-2222-2222-2222-222222222223",
    "usr-tch-002": "22222222-2222-2222-2222-222222222223",
    "tch-002": "22222222-2222-2222-2222-222222222223",
    "th2": "22222222-2222-2222-2222-222222222223",

    // Standard Class Group Formats
    "class.group1@brighttutor.com": "11111111-1111-1111-1111-111111111111",
    "group001": "11111111-1111-1111-1111-111111111111",
    "grp-001": "11111111-1111-1111-1111-111111111111",
    "grp-3001": "11111111-1111-1111-1111-111111111111",
    "grp1": "11111111-1111-1111-1111-111111111111",

    "grp-002": "11111111-1111-1111-1111-111111111112",
    "grp2": "11111111-1111-1111-1111-111111111112",
  };

  if (mapping[trimmed]) {
    return mapping[trimmed];
  }

  const guidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  if (guidRegex.test(trimmed)) {
    return trimmed;
  }

  // Convert custom short text into a valid GUID format automatically
  let hex = "";
  for (let i = 0; i < trimmed.length; i++) {
    hex += trimmed.charCodeAt(i).toString(16);
  }
  hex = hex.padEnd(32, "0").slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

export function formatDisplayId(id: string | null | undefined): string {
  if (!id) return "";
  const lower = id.toLowerCase().trim();

  const reverseMap: Record<string, string> = {
    "33333333-3333-3333-3333-333333333333": "STD-001",
    "33333333-3333-3333-3333-333333333334": "STD-002",
    "44444444-4444-4444-4444-444444444444": "STD-ONLINE",
    "55555555-5555-5555-5555-555555555555": "STD-HOME",
    "22222222-2222-2222-2222-222222222222": "TCH-001",
    "22222222-2222-2222-2222-222222222223": "TCH-002",
    "11111111-1111-1111-1111-111111111111": "GRP-001",
    "11111111-1111-1111-1111-111111111112": "GRP-002",
  };

  if (reverseMap[lower]) {
    return reverseMap[lower];
  }

  // Decode hex-encoded string IDs back into clean text (e.g., 7374642d303033 -> STD-003)
  try {
    const cleanHex = lower.replace(/-/g, "").replace(/0+$/, "");
    if (cleanHex.length % 2 === 0 && cleanHex.length > 0) {
      let str = "";
      for (let i = 0; i < cleanHex.length; i += 2) {
        const code = parseInt(cleanHex.substring(i, i + 2), 16);
        if (code >= 32 && code <= 126) {
          str += String.fromCharCode(code);
        } else {
          str = "";
          break;
        }
      }
      if (str.length > 0) {
        return str.toUpperCase();
      }
    }
  } catch {}

  return id;
}

@Injectable({ providedIn: "root" })
export class AttendanceService {
  private http = inject(HttpClient);

  private baseUrl = "http://localhost:5198/api/attendance";

  markGroupAttendance(request: MarkGroupAttendanceRequest) {
    const payload = {
      ...request,
      classGroupId: normalizeId(request.classGroupId),
      teacherId: request.teacherId ? normalizeId(request.teacherId) : undefined,
      students: request.students.map((s) => ({
        ...s,
        studentId: normalizeId(s.studentId),
      })),
    };
    return this.http.post<MarkGroupAttendanceResponse>(`${this.baseUrl}/group`, payload);
  }

  markTeacherAttendance(request: MarkTeacherAttendanceRequest) {
    const payload = {
      ...request,
      teacherId: normalizeId(request.teacherId),
    };
    return this.http.post<string>(`${this.baseUrl}/teacher`, payload);
  }

  markOnlineAttendance(request: MarkOnlineAttendanceRequest) {
    const payload = {
      ...request,
      studentId: normalizeId(request.studentId),
      teacherId: normalizeId(request.teacherId),
      classGroupId: normalizeId(request.classGroupId),
    };
    return this.http.post<string>(`${this.baseUrl}/online`, payload);
  }

  checkInHomeAttendance(request: CheckInHomeAttendanceRequest) {
    const payload = {
      ...request,
      studentId: normalizeId(request.studentId),
      teacherId: normalizeId(request.teacherId),
      classGroupId: normalizeId(request.classGroupId),
    };
    return this.http.post<string>(`${this.baseUrl}/home/checkin`, payload);
  }

  checkOutHomeAttendance(request: CheckOutHomeAttendanceRequest) {
    const payload = {
      ...request,
      attendanceId: normalizeId(request.attendanceId),
    };
    return this.http.post<{ message: string }>(`${this.baseUrl}/home/checkout`, payload);
  }

  getTeacherReport(teacherId: string, startDate: string, endDate: string) {
    return this.http.get<any>(`${this.baseUrl}/teacher-report`, {
      params: { teacherId: normalizeId(teacherId), startDate, endDate },
    }).pipe(
      map((res) => ({
        ...res,
        teacherId: formatDisplayId(res.teacherId),
      }))
    );
  }

  getGroupAttendance(classGroupId: string, attendanceDate: string) {
    return this.http.get<GroupAttendanceRecord[]>(`${this.baseUrl}/group`, {
      params: { classGroupId: normalizeId(classGroupId), attendanceDate },
    }).pipe(
      map((records) =>
        records.map((r) => ({
          ...r,
          studentId: formatDisplayId(r.studentId),
        }))
      )
    );
  }

  getClassReport(classGroupId: string, startDate: string, endDate: string) {
    return this.http.get<ClassAttendanceReport>(`${this.baseUrl}/class-report`, {
      params: { classGroupId: normalizeId(classGroupId), startDate, endDate },
    }).pipe(
      map((report) => ({
        ...report,
        classGroupId: formatDisplayId(report.classGroupId),
        studentBreakdown: (report.studentBreakdown || []).map((s) => ({
          ...s,
          studentId: formatDisplayId(s.studentId),
        })),
      }))
    );
  }

  getDailyOverview(date: string) {
    return this.http.get<any>(`${this.baseUrl}/daily-overview`, { params: { date } });
  }

  getStudentCalendar(studentId: string, year: number, month: number) {
    return this.http.get<any[]>(`${this.baseUrl}/student-calendar`, {
      params: { studentId: normalizeId(studentId), year: year.toString(), month: month.toString() },
    });
  }

  getStudentSummary(studentId: string, startDate: string, endDate: string) {
    return this.http.get<StudentAttendanceSummary>(`${this.baseUrl}/student-summary`, {
      params: { studentId: normalizeId(studentId), startDate, endDate },
    }).pipe(
      map((res) => ({
        ...res,
        studentId: formatDisplayId(res.studentId),
      }))
    );
  }

  updateAttendance(attendanceId: string, newStatus: number, notes?: string) {
    return this.http.put<{ message: string }>(`${this.baseUrl}/${attendanceId}`, {
      attendanceId: normalizeId(attendanceId),
      newStatus,
      notes,
    });
  }

  verifyHomeAttendance(attendanceId: string, isVerified: boolean, distanceFromStudentHomeInMeters?: number) {
    return this.http.post<{ message: string }>(`${this.baseUrl}/home/verify`, {
      attendanceId: normalizeId(attendanceId),
      isVerified,
      distanceFromStudentHomeInMeters,
    });
  }
}