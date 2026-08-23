namespace BrightTutor.Application.Attendance.Dtos;

public class GetTeacherAttendanceReportResponse
{
    public Guid TeacherId { get; set; }
    public string TeacherName { get; set; } = string.Empty;
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }

    public int TotalRecords { get; set; }
    public int PresentCount { get; set; }
    public int AbsentCount { get; set; }
    public int LateCount { get; set; }
    public int ExcusedCount { get; set; }

    public double AttendancePercentage { get; set; }
}
