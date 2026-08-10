using MediatR;

namespace BrightTutor.Application.Attendance.Queries.GetTeacherAttendanceReport;

public class GetTeacherAttendanceReportQuery : IRequest<GetTeacherAttendanceReportResponse>
{
    public Guid TeacherId { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
}