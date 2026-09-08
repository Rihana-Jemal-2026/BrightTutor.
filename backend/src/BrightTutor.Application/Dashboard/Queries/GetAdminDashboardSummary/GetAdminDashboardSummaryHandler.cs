using BrightTutor.Application.Abstractions.Persistence;
using BrightTutor.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Application.Dashboard.Queries.GetAdminDashboardSummary;

public class GetAdminDashboardSummaryHandler : IRequestHandler<GetAdminDashboardSummaryQuery, AdminDashboardSummaryDto>
{
    private readonly IApplicationDbContext _context;

    public GetAdminDashboardSummaryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<AdminDashboardSummaryDto> Handle(GetAdminDashboardSummaryQuery request, CancellationToken cancellationToken)
    {
        var todayDate = DateOnly.FromDateTime(DateTime.UtcNow);
        var todayStart = DateTime.UtcNow.Date;
        var todayEnd = todayStart.AddDays(1).AddTicks(-1);

        var totalStudents = await _context.Students.CountAsync(cancellationToken);
        var totalTeachers = await _context.Teachers.CountAsync(cancellationToken);
        var activeCourses = await _context.Courses.CountAsync(c => c.IsActive, cancellationToken);

        var todayClassesCount = await _context.Schedules
            .CountAsync(s => s.StartTime >= todayStart && s.StartTime <= todayEnd, cancellationToken);

        var todayAttendances = await _context.Attendances
            .Where(a => a.AttendanceDate == todayDate)
            .ToListAsync(cancellationToken);

        var todayPresent = todayAttendances.Count(a => a.Status == AttendanceStatus.Present);
        var todayAbsent = todayAttendances.Count(a => a.Status == AttendanceStatus.Absent);
        var todayLate = todayAttendances.Count(a => a.Status == AttendanceStatus.Late);

        var todayTeacherAttendance = await _context.TeacherAttendances
            .CountAsync(ta => ta.AttendanceDate == todayDate, cancellationToken);

        return new AdminDashboardSummaryDto
        {
            TotalStudents = totalStudents,
            TotalTeachers = totalTeachers,
            ActiveCourses = activeCourses,
            TodayClassesCount = todayClassesCount,
            TodayPresentAttendance = todayPresent,
            TodayAbsentAttendance = todayAbsent,
            TodayLateAttendance = todayLate,
            TodayTeacherAttendanceCount = todayTeacherAttendance
        };
    }
}
