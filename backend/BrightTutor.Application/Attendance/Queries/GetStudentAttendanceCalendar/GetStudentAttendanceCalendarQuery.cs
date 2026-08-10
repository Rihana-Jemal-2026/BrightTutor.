using MediatR;

namespace BrightTutor.Application.Attendance.Queries.GetStudentAttendanceCalendar;

public class GetStudentAttendanceCalendarQuery : IRequest<List<CalendarDayDto>>
{
    public Guid StudentId { get; set; }
    public int Year { get; set; }
    public int Month { get; set; }
}