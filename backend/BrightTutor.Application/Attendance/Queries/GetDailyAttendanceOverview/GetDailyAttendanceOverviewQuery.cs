using MediatR;

namespace BrightTutor.Application.Attendance.Queries.GetDailyAttendanceOverview;

public class GetDailyAttendanceOverviewQuery : IRequest<GetDailyAttendanceOverviewResponse>
{
    public DateOnly Date { get; set; }
}