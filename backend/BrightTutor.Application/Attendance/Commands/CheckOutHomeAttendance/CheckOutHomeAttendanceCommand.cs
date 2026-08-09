using MediatR;

namespace BrightTutor.Application.Attendance.Commands.CheckOutHomeAttendance;

public class CheckOutHomeAttendanceCommand : IRequest<bool>
{
    public Guid AttendanceId { get; set; }
    public decimal CheckOutLatitude { get; set; }
    public decimal CheckOutLongitude { get; set; }
}