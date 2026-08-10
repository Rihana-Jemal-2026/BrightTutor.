using BrightTutor.Application.Abstractions.Persistence;
using BrightTutor.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Application.Attendance.Queries.GetDailyAttendanceOverview;

public class GetDailyAttendanceOverviewHandler
    : IRequestHandler<GetDailyAttendanceOverviewQuery, GetDailyAttendanceOverviewResponse>
{
    private readonly IApplicationDbContext _context;

    public GetDailyAttendanceOverviewHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<GetDailyAttendanceOverviewResponse> Handle(
        GetDailyAttendanceOverviewQuery request, CancellationToken cancellationToken)
    {
        var studentRecords = await _context.Attendances
            .Where(a => a.AttendanceDate == request.Date)
            .ToListAsync(cancellationToken);

        var teacherRecords = await _context.TeacherAttendances
            .Where(t => t.AttendanceDate == request.Date)
            .ToListAsync(cancellationToken);

        return new GetDailyAttendanceOverviewResponse
        {
            Date = request.Date,

            TotalStudentRecords = studentRecords.Count,
            PresentCount = studentRecords.Count(r => r.Status == AttendanceStatus.Present),
            AbsentCount = studentRecords.Count(r => r.Status == AttendanceStatus.Absent),
            LateCount = studentRecords.Count(r => r.Status == AttendanceStatus.Late),
            ExcusedCount = studentRecords.Count(r => r.Status == AttendanceStatus.Excused),

            GroupCount = studentRecords.Count(r => r.AttendanceType == AttendanceType.Group),
            OnlineCount = studentRecords.Count(r => r.AttendanceType == AttendanceType.Online),
            HomeCount = studentRecords.Count(r => r.AttendanceType == AttendanceType.Home),

            TeacherRecordsCount = teacherRecords.Count,
            TeacherPresentCount = teacherRecords.Count(r => r.Status == AttendanceStatus.Present),
            TeacherAbsentCount = teacherRecords.Count(r => r.Status == AttendanceStatus.Absent)
        };
    }
}