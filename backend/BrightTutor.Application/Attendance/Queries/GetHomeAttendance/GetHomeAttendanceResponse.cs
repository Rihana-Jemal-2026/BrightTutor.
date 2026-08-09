namespace BrightTutor.Application.Attendance.Queries.GetHomeAttendance;

public class GetHomeAttendanceResponse
{
    public Guid AttendanceId { get; set; }
    public DateTime? CheckInTime { get; set; }
    public DateTime? CheckOutTime { get; set; }
    public string? LessonCovered { get; set; }
    public decimal CheckInLatitude { get; set; }
    public decimal CheckInLongitude { get; set; }
    public string? Address { get; set; }
    public bool IsLocationVerified { get; set; }
}