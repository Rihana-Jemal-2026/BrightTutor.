using MediatR;

namespace BrightTutor.Application.Attendance.Queries.GetHomeAttendance;

public class GetHomeAttendanceQuery : IRequest<List<GetHomeAttendanceResponse>>
{
    public Guid StudentId { get; set; }
    public DateOnly AttendanceDate { get; set; }
}