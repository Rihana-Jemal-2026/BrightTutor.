using BrightTutor.Domain.Enums;
using MediatR;

namespace BrightTutor.Application.Attendance.Commands.MarkTeacherAttendance;

public class MarkTeacherAttendanceCommand : IRequest<Guid>
{
    public Guid TeacherId { get; set; }
    public DateOnly AttendanceDate { get; set; }
    public AttendanceStatus Status { get; set; }
    public DateTime? CheckInTime { get; set; }
    public DateTime? CheckOutTime { get; set; }
    public string? Notes { get; set; }
}