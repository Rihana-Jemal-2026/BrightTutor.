using BrightTutor.Application.Abstractions.Persistence;
using BrightTutor.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Application.Attendance.Queries.GetClassAttendanceReport;

public class GetClassAttendanceReportHandler
    : IRequestHandler<GetClassAttendanceReportQuery, GetClassAttendanceReportResponse>
{
    private readonly IApplicationDbContext _context;

    public GetClassAttendanceReportHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<GetClassAttendanceReportResponse> Handle(
        GetClassAttendanceReportQuery request, CancellationToken cancellationToken)
    {
        var records = await _context.Attendances
            .Where(a => a.ClassGroupId == request.ClassGroupId
                     && a.AttendanceDate >= request.StartDate
                     && a.AttendanceDate <= request.EndDate)
            .ToListAsync(cancellationToken);

        var total = records.Count;
        var present = records.Count(r => r.Status == AttendanceStatus.Present);
        var absent = records.Count(r => r.Status == AttendanceStatus.Absent);
        var late = records.Count(r => r.Status == AttendanceStatus.Late);
        var excused = records.Count(r => r.Status == AttendanceStatus.Excused);

        var overallPercentage = total == 0 ? 0 : Math.Round((double)present / total * 100, 1);

        var studentBreakdown = records
            .GroupBy(r => r.StudentId)
            .Select(group =>
            {
                var groupTotal = group.Count();
                var groupPresent = group.Count(r => r.Status == AttendanceStatus.Present);

                return new StudentBreakdownDto
                {
                    StudentId = group.Key,
                    PresentCount = groupPresent,
                    AbsentCount = group.Count(r => r.Status == AttendanceStatus.Absent),
                    LateCount = group.Count(r => r.Status == AttendanceStatus.Late),
                    ExcusedCount = group.Count(r => r.Status == AttendanceStatus.Excused),
                    AttendancePercentage = groupTotal == 0
                        ? 0
                        : Math.Round((double)groupPresent / groupTotal * 100, 1)
                };
            })
            .ToList();

        return new GetClassAttendanceReportResponse
        {
            ClassGroupId = request.ClassGroupId,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            TotalRecords = total,
            PresentCount = present,
            AbsentCount = absent,
            LateCount = late,
            ExcusedCount = excused,
            OverallAttendancePercentage = overallPercentage,
            StudentBreakdown = studentBreakdown
        };
    }
}