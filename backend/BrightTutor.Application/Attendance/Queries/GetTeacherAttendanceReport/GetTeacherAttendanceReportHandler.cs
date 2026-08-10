using BrightTutor.Application.Abstractions.Persistence;
using BrightTutor.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Application.Attendance.Queries.GetTeacherAttendanceReport;

public class GetTeacherAttendanceReportHandler
    : IRequestHandler<GetTeacherAttendanceReportQuery, GetTeacherAttendanceReportResponse>
{
    private readonly IApplicationDbContext _context;

    public GetTeacherAttendanceReportHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<GetTeacherAttendanceReportResponse> Handle(
        GetTeacherAttendanceReportQuery request, CancellationToken cancellationToken)
    {
        var records = await _context.TeacherAttendances
            .Where(t => t.TeacherId == request.TeacherId
                     && t.AttendanceDate >= request.StartDate
                     && t.AttendanceDate <= request.EndDate)
            .ToListAsync(cancellationToken);

        var total = records.Count;
        var present = records.Count(r => r.Status == AttendanceStatus.Present);
        var absent = records.Count(r => r.Status == AttendanceStatus.Absent);
        var late = records.Count(r => r.Status == AttendanceStatus.Late);
        var excused = records.Count(r => r.Status == AttendanceStatus.Excused);

        var percentage = total == 0 ? 0 : Math.Round((double)present / total * 100, 1);

        return new GetTeacherAttendanceReportResponse
        {
            TeacherId = request.TeacherId,
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