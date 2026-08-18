using BrightTutor.Application.Abstractions.Persistence;
using BrightTutor.Application.Attendance.Dtos;
using BrightTutor.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Application.Attendance.Queries;

public class GetClassAttendanceReportQuery : IRequest<GetClassAttendanceReportResponse>
{
    public Guid ClassGroupId { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
}

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

        var totalSessions = records.Select(a => a.AttendanceDate).Distinct().Count();
        var totalStudentRecords = records.Count;
        var present = records.Count(r => r.Status == AttendanceStatus.Present);
        var absent = records.Count(r => r.Status == AttendanceStatus.Absent);
        var late = records.Count(r => r.Status == AttendanceStatus.Late);
        var excused = records.Count(r => r.Status == AttendanceStatus.Excused);

        var overallPercentage = totalStudentRecords == 0
            ? 0
            : Math.Round((double)present / totalStudentRecords * 100, 1);

        var studentBreakdown = records
            .GroupBy(a => a.StudentId)
            .Select(g =>
            {
                var sTotal = g.Count();
                var sPresent = g.Count(r => r.Status == AttendanceStatus.Present);
                return new StudentReportItemDto
                {
                    StudentId = g.Key,
                    Present = sPresent,
                    Absent = g.Count(r => r.Status == AttendanceStatus.Absent),
                    Late = g.Count(r => r.Status == AttendanceStatus.Late),
                    Excused = g.Count(r => r.Status == AttendanceStatus.Excused),
                    Percentage = sTotal == 0 ? 0 : Math.Round((double)sPresent / sTotal * 100, 1)
                };
            }).ToList();

        return new GetClassAttendanceReportResponse
        {
            ClassGroupId = request.ClassGroupId,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            TotalSessions = totalSessions,
            TotalStudentRecords = totalStudentRecords,
            PresentCount = present,
            AbsentCount = absent,
            LateCount = late,
            ExcusedCount = excused,
            OverallAttendancePercentage = overallPercentage,
            StudentBreakdown = studentBreakdown
        };
    }
}
