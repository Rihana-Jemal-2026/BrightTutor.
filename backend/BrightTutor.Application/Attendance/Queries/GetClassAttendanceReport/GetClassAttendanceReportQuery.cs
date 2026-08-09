using MediatR;

namespace BrightTutor.Application.Attendance.Queries.GetClassAttendanceReport;

public class GetClassAttendanceReportQuery : IRequest<GetClassAttendanceReportResponse>
{
    public Guid ClassGroupId { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
}