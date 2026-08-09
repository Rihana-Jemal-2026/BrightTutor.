namespace BrightTutor.Application.Attendance.Queries.GetClassAttendanceReport;

public class GetClassAttendanceReportResponse
{
    public Guid ClassGroupId { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }

    public int TotalRecords { get; set; }
    public int PresentCount { get; set; }
    public int AbsentCount { get; set; }
    public int LateCount { get; set; }
    public int ExcusedCount { get; set; }
    public double OverallAttendancePercentage { get; set; }

    public List<StudentBreakdownDto> StudentBreakdown { get; set; } = [];
}

public class StudentBreakdownDto
{
    public Guid StudentId { get; set; }
    public int PresentCount { get; set; }
    public int AbsentCount { get; set; }
    public int LateCount { get; set; }
    public int ExcusedCount { get; set; }
    public double AttendancePercentage { get; set; }
}