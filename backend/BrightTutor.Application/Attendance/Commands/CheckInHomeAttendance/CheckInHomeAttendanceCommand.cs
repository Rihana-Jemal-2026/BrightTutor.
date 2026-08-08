using MediatR;

namespace BrightTutor.Application.Attendance.Commands.CheckInHomeAttendance;

public class CheckInHomeAttendanceCommand : IRequest<Guid>
{
    public Guid StudentId { get; set; }
    public Guid TeacherId { get; set; }
    public Guid ClassGroupId { get; set; }
    public DateOnly AttendanceDate { get; set; }
    public decimal CheckInLatitude { get; set; }
    public decimal CheckInLongitude { get; set; }
    public string? Address { get; set; }
    public string? LessonCovered { get; set; }
}