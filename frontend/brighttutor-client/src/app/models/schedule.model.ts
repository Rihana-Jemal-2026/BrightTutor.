export enum ServiceType {
  Online = 1,
  Group = 2,
  Home = 3
}

export enum ScheduleStatus {
  Scheduled = 1,
  Completed = 2,
  Cancelled = 3,
  Rescheduled = 4
}

export interface ScheduleDto {
  id: string;
  courseId: string;
  courseName: string;
  teacherId: string;
  teacherCode: string;
  teacherName: string;
  classGroupId?: string;
  classGroupName?: string;
  studentId?: string;
  studentCode?: string;
  studentName?: string;
  serviceType: ServiceType;
  startTime: string;
  endTime: string;
  meetingLink?: string;
  locationAddress?: string;
  status: ScheduleStatus;
  createdAt: string;
}

export interface CreateScheduleRequest {
  courseId: string;
  teacherId: string;
  classGroupId?: string;
  studentId?: string;
  serviceType: ServiceType;
  startTime: string;
  endTime: string;
  meetingLink?: string;
  locationAddress?: string;
}

export interface UpdateScheduleRequest {
  scheduleId?: string;
  courseId?: string;
  teacherId?: string;
  classGroupId?: string;
  studentId?: string;
  serviceType?: ServiceType;
  startTime: string;
  endTime: string;
  meetingLink?: string;
  locationAddress?: string;
}
