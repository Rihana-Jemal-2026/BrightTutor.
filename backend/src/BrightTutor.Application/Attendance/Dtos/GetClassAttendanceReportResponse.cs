namespace BrightTutor.Application.Attendance.Dtos;

public class GetClassAttendanceReportResponse
{
    public Guid ClassGroupId { get; set; }
    public string ClassGroupName { get; set; } = string.Empty;
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public int TotalSessions { get; set; }
    public int TotalRecords { get; set; }
    public int PresentCount { get; set; }
    public int AbsentCount { get; set; }
    public int LateCount { get; set; }
    public int ExcusedCount { get; set; }
    public double OverallAttendancePercentage { get; set; }
    public List<StudentReportItemDto> StudentBreakdown { get; set; } = [];
}

public class StudentReportItemDto
{
    public Guid StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public int PresentCount { get; set; }
    public int AbsentCount { get; set; }
    public int LateCount { get; set; }
    public int ExcusedCount { get; set; }
    public double AttendancePercentage { get; set; }
}
