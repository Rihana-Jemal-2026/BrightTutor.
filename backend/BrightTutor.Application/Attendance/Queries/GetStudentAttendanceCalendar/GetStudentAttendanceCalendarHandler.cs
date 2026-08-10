using BrightTutor.Application.Abstractions.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Application.Attendance.Queries.GetStudentAttendanceCalendar;

public class GetStudentAttendanceCalendarHandler
    : IRequestHandler<GetStudentAttendanceCalendarQuery, List<CalendarDayDto>>
{
    private readonly IApplicationDbContext _context;

    public GetStudentAttendanceCalendarHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<CalendarDayDto>> Handle(
        GetStudentAttendanceCalendarQuery request, CancellationToken cancellationToken)
    {
        var startOfMonth = new DateOnly(request.Year, request.Month, 1);
        var endOfMonth = startOfMonth.AddMonths(1).AddDays(-1);

        var records = await _context.Attendances
            .Where(a => a.StudentId == request.StudentId
                     && a.AttendanceDate >= startOfMonth
                     && a.AttendanceDate <= endOfMonth)
            .OrderBy(a => a.AttendanceDate)
            .Select(a => new CalendarDayDto
            {
                Date = a.AttendanceDate,
                Status = a.Status,
                AttendanceType = a.AttendanceType,
                CheckInTime = a.CheckInTime,
                CheckOutTime = a.CheckOutTime,
                TeacherId = a.TeacherId
            })
            .ToListAsync(cancellationToken);

        return records;
    }
}