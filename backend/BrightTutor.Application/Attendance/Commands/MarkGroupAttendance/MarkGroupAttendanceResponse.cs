namespace BrightTutor.Application.Attendance.Commands.MarkGroupAttendance;

public class MarkGroupAttendanceResponse
{
    public int RecordsCreated { get; set; }
    public Guid ClassGroupId { get; set; }
    public DateOnly AttendanceDate { get; set; }
}