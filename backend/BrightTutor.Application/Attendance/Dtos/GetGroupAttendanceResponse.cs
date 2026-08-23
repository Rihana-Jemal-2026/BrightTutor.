using BrightTutor.Domain.Enums;

namespace BrightTutor.Application.Attendance.Dtos;

public class GetGroupAttendanceResponse
{
    public Guid Id { get; set; }
    public Guid StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string TeacherName { get; set; } = string.Empty;
    public string ClassGroupName { get; set; } = string.Empty;
    public AttendanceStatus Status { get; set; }
    public DateOnly AttendanceDate { get; set; }
    public string? Notes { get; set; }
}
