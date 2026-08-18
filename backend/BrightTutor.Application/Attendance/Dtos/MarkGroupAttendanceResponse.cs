namespace BrightTutor.Application.Attendance.Dtos;

public class MarkGroupAttendanceResponse
{
    public int RecordsCreated { get; set; }
    public Guid ClassGroupId { get; set; }
    public DateOnly AttendanceDate { get; set; }
}
