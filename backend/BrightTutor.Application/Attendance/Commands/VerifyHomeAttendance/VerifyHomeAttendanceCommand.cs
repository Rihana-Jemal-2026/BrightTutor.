using MediatR;

namespace BrightTutor.Application.Attendance.Commands.VerifyHomeAttendance;

public class VerifyHomeAttendanceCommand : IRequest<bool>
{
    public Guid AttendanceId { get; set; }
    public bool IsVerified { get; set; }
    public decimal? DistanceFromStudentHomeInMeters { get; set; }
}