using MediatR;

namespace BrightTutor.Application.Attendance.Queries.GetGroupAttendance;

public class GetGroupAttendanceQuery : IRequest<List<GetGroupAttendanceResponse>>
{
    public Guid ClassGroupId { get; set; }
    public DateOnly AttendanceDate { get; set; }
}