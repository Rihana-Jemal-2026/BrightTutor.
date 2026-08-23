namespace BrightTutor.Application.Dashboard.Queries.GetAdminDashboardSummary;

public class AdminDashboardSummaryDto
{
    public int TotalStudents { get; set; }
    public int TotalTeachers { get; set; }
    public int ActiveCourses { get; set; }

    public int TodayClassesCount { get; set; }
    public int TodayPresentAttendance { get; set; }
    public int TodayAbsentAttendance { get; set; }
    public int TodayLateAttendance { get; set; }
    public int TodayTeacherAttendanceCount { get; set; }
}
