using BrightTutor.Application.Abstractions.Persistence;
using BrightTutor.Application.Attendance.Dtos;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Application.Attendance.Queries;

public class GetStudentAttendanceCalendarQuery : IRequest<List<CalendarDayDto>>
{
    public Guid StudentId { get; set; }
    public int Year { get; set; }
    public int Month { get; set; }
}

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
        var studentEntity = await _context.Students
            .FirstOrDefaultAsync(st => st.Id == request.StudentId || st.UserId == request.StudentId, cancellationToken);
        var actualStudentId = studentEntity?.Id ?? request.StudentId;

        var startOfMonth = new DateOnly(request.Year, request.Month, 1);
        var endOfMonth = startOfMonth.AddMonths(1).AddDays(-1);

        var records = await _context.Attendances
            .Where(a => a.StudentId == actualStudentId
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
