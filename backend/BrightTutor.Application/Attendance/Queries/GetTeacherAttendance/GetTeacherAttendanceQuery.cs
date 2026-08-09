using MediatR;

namespace BrightTutor.Application.Attendance.Queries.GetTeacherAttendance;

public class GetTeacherAttendanceQuery : IRequest<List<GetTeacherAttendanceResponse>>
{
    public Guid TeacherId { get; set; }
    public DateOnly AttendanceDate { get; set; }
}