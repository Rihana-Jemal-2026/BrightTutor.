/** Matches the AttendanceStatus enum in BrightTutor.Domain.Enums */
export enum AttendanceStatus {
  Present = 0,
  Absent = 1,
  Late = 2,
  Excused = 3,
}

/** Matches the AttendanceType enum in BrightTutor.Domain.Enums */
export enum AttendanceType {
  Online = 0,
  Group = 1,
  Home = 2,
}

/** One student's entry when marking group attendance — mirrors StudentAttendanceEntryDto */
export interface StudentAttendanceEntry {
  studentId: string;
  status: AttendanceStatus;
  notes?: string;
}

/** Request body for POST /api/attendance/group — mirrors MarkGroupAttendanceCommand */
export interface MarkGroupAttendanceRequest {
  classGroupId: string;
  teacherId: string;
  attendanceDate: string;
  students: StudentAttendanceEntry[];
}

/** Response from POST /api/attendance/group — mirrors MarkGroupAttendanceResponse */
export interface MarkGroupAttendanceResponse {
  recordsCreated: number;
  classGroupId: string;
  attendanceDate: string;
}

/** One row from GET /api/attendance/group — mirrors GetGroupAttendanceResponse */
export interface GroupAttendanceRecord {
  id: string;
  studentId: string;
  studentName?: string;
  teacherName?: string;
  classGroupName?: string;
  attendanceType?: number;
  attendanceDate?: string;
  status: AttendanceStatus;
  notes?: string;
}

/** Response from GET /api/attendance/class-report — mirrors GetClassAttendanceReportResponse */
export interface ClassAttendanceReport {
  classGroupId: string;
  startDate: string;
  endDate: string;
  totalRecords: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  overallAttendancePercentage: number;
  studentBreakdown: StudentBreakdown[];
}

export interface StudentBreakdown {
  studentId: string;
  studentName?: string;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  attendancePercentage: number;
}

/** Response from GET /api/attendance/student-summary — mirrors GetStudentAttendanceSummaryResponse */
export interface StudentAttendanceSummary {
  studentId: string;
  startDate: string;
  endDate: string;
  totalRecords: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  attendancePercentage: number;
}

/** Request body for POST /api/attendance/teacher */
export interface MarkTeacherAttendanceRequest {
  teacherId: string;
  attendanceDate: string;
  status: AttendanceStatus;
  checkInTime?: string;
  checkOutTime?: string;
  notes?: string;
}

/** Request body for POST /api/attendance/online */
export interface MarkOnlineAttendanceRequest {
  studentId: string;
  teacherId: string;
  classGroupId: string;
  attendanceDate: string;
  status: AttendanceStatus;
  notes?: string;
}

/** Request body for POST /api/attendance/home/checkin */
export interface CheckInHomeAttendanceRequest {
  studentId: string;
  teacherId: string;
  classGroupId: string;
  attendanceDate: string;
  checkInLatitude: number;
  checkInLongitude: number;
  targetLatitude?: number;
  targetLongitude?: number;
  address?: string;
  lessonCovered?: string;
}

/** Request body for POST /api/attendance/home/checkout */
export interface CheckOutHomeAttendanceRequest {
  attendanceId: string;
  checkOutLatitude: number;
  checkOutLongitude: number;
}