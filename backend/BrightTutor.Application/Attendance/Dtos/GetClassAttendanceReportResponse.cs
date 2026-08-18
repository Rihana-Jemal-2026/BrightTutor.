using BrightTutor.Domain.Enums;

namespace BrightTutor.Application.Attendance.Dtos;

public class GetClassAttendanceReportResponse
{
    public Guid ClassGroupId { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public int TotalSessions { get; set; }
    public int TotalStudentRecords { get; set; }
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
    public int Present { get; set; }
    public int Absent { get; set; }
    public int Late { get; set; }
    public int Excused { get; set; }
    public double Percentage { get; set; }
}
