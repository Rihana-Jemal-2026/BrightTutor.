using BrightTutor.Domain.Enums;
using MediatR;

namespace BrightTutor.Application.Attendance.Commands.UpdateAttendance;

public class UpdateAttendanceCommand : IRequest<bool>
{
    public Guid AttendanceId { get; set; }
    public AttendanceStatus NewStatus { get; set; }
    public string? Notes { get; set; }
}