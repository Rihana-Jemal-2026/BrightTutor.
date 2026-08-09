using BrightTutor.Domain.Enums;
using MediatR;

namespace BrightTutor.Application.Attendance.Commands.MarkOnlineAttendance;

public class MarkOnlineAttendanceCommand : IRequest<Guid>
{
    public Guid StudentId { get; set; }
    public Guid TeacherId { get; set; }
    public Guid ClassGroupId { get; set; }
    public DateOnly AttendanceDate { get; set; }
    public AttendanceStatus Status { get; set; }
    public string? Notes { get; set; }
}