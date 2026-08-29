export interface EnrollmentDto {
  id: string;
  studentId: string;
  studentCode: string;
  studentName: string;
  courseId: string;
  courseName: string;
  classGroupId?: string;
  classGroupName?: string;
  enrollmentDate: string;
  endDate?: string;
  isActive: boolean;
  serviceType?: number | string;
}

export interface EnrollStudentRequest {
  studentId: string;
  courseId: string;
  classGroupId?: string;
}

export interface EnrollStudentResponse {
  id: string;
  studentId: string;
  courseId: string;
  classGroupId?: string;
  enrollmentDate: string;
  isActive: boolean;
}
