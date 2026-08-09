using MediatR;

namespace BrightTutor.Application.Attendance.Queries.GetOnlineAttendance;

public class GetOnlineAttendanceQuery : IRequest<List<GetOnlineAttendanceResponse>>
{
    public Guid ClassGroupId { get; set; }
    public DateOnly AttendanceDate { get; set; }
}