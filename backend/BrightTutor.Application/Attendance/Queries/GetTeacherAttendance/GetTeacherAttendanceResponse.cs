using BrightTutor.Domain.Enums;

namespace BrightTutor.Application.Attendance.Queries.GetTeacherAttendance;

public class GetTeacherAttendanceResponse
{
    public Guid Id { get; set; }
    public AttendanceStatus Status { get; set; }
    public DateTime? CheckInTime { get; set; }
    public DateTime? CheckOutTime { get; set; }
    public bool IsVerified { get; set; }
    public string? Notes { get; set; }
}