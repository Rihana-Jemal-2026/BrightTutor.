using BrightTutor.Application.Abstractions.Persistence;
using BrightTutor.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Application.Attendance.Queries.GetStudentAttendanceSummary;

public class GetStudentAttendanceSummaryHandler
    : IRequestHandler<GetStudentAttendanceSummaryQuery, GetStudentAttendanceSummaryResponse>
{
    private readonly IApplicationDbContext _context;

    public GetStudentAttendanceSummaryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<GetStudentAttendanceSummaryResponse> Handle(
        GetStudentAttendanceSummaryQuery request, CancellationToken cancellationToken)
    {
        var records = await _context.Attendances
            .Where(a => a.StudentId == request.StudentId
                     && a.AttendanceDate >= request.StartDate
                     && a.AttendanceDate <= request.EndDate)
            .ToListAsync(cancellationToken);

        var total = records.Count;
        var present = records.Count(r => r.Status == AttendanceStatus.Present);
        var absent = records.Count(r => r.Status == AttendanceStatus.Absent);
        var late = records.Count(r => r.Status == AttendanceStatus.Late);
        var excused = records.Count(r => r.Status == AttendanceStatus.Excused);

        var percentage = total == 0
            ? 0
            : Math.Round((double)present / total * 100, 1);

        return new GetStudentAttendanceSummaryResponse
        {
            StudentId = request.StudentId,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            TotalRecords = total,
            PresentCount = present,
            AbsentCount = absent,
            LateCount = late,
            ExcusedCount = excused,
            AttendancePercentage = percentage
        };
    }
}