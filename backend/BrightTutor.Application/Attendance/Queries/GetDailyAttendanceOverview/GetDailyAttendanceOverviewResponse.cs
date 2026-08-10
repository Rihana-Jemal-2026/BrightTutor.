namespace BrightTutor.Application.Attendance.Queries.GetDailyAttendanceOverview;

public class GetDailyAttendanceOverviewResponse
{
    public DateOnly Date { get; set; }

    public int TotalStudentRecords { get; set; }
    public int PresentCount { get; set; }
    public int AbsentCount { get; set; }
    public int LateCount { get; set; }
    public int ExcusedCount { get; set; }

    public int GroupCount { get; set; }
    public int OnlineCount { get; set; }
    public int HomeCount { get; set; }

    public int TeacherRecordsCount { get; set; }
    public int TeacherPresentCount { get; set; }
    public int TeacherAbsentCount { get; set; }
}