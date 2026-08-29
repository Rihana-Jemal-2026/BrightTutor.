export interface TeacherAssignmentDto {
  id: string;
  teacherId: string;
  teacherCode: string;
  teacherName: string;
  courseId: string;
  courseName: string;
  classGroupId?: string;
  classGroupName?: string;
  startDate: string;
}

export interface AssignTeacherRequest {
  teacherId: string;
  courseId: string;
  classGroupId?: string;
}
