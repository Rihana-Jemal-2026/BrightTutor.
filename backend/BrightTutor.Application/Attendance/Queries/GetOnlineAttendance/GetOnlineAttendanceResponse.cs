using BrightTutor.Domain.Enums;

namespace BrightTutor.Application.Attendance.Queries.GetOnlineAttendance;

public class GetOnlineAttendanceResponse
{
    public Guid Id { get; set; }
    public Guid StudentId { get; set; }
    public AttendanceStatus Status { get; set; }
    public string? Notes { get; set; }
}