using MediatR;

namespace BrightTutor.Application.Attendance.Queries.GetStudentAttendanceSummary;

public class GetStudentAttendanceSummaryQuery : IRequest<GetStudentAttendanceSummaryResponse>
{
    public Guid StudentId { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
}