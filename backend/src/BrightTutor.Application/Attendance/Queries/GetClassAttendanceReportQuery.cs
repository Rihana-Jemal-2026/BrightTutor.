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
    public Guid? TeacherId { get; set; }
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
        var query = _context.Attendances
            .Include(a => a.Student).ThenInclude(st => st.User)
            .Include(a => a.Teacher).ThenInclude(t => t.User)
            .Include(a => a.ClassGroup)
            .Where(a => a.AttendanceDate >= request.StartDate && a.AttendanceDate <= request.EndDate);

        if (request.TeacherId.HasValue && request.TeacherId.Value != Guid.Empty)
        {
            query = query.Where(a => a.TeacherId == request.TeacherId.Value || (a.Teacher != null && a.Teacher.UserId == request.TeacherId.Value));
        }

        if (request.ClassGroupId != Guid.Empty)
        {
            query = query.Where(a => a.ClassGroupId == request.ClassGroupId);
        }

        var records = await query.ToListAsync(cancellationToken);

        string classGroupName = "All Academy Classes & Modes";
        if (request.ClassGroupId != Guid.Empty)
        {
            var classGroup = await _context.ClassGroups.FirstOrDefaultAsync(g => g.Id == request.ClassGroupId, cancellationToken);
            classGroupName = classGroup?.Name ?? "Class Group";
        }

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
                var firstRecord = g.First();
                var sName = firstRecord.Student?.User != null 
                    ? $"{firstRecord.Student.User.FirstName} {firstRecord.Student.User.LastName}" 
                    : "Student";

                return new StudentReportItemDto
                {
                    StudentId = g.Key,
                    StudentName = sName,
                    PresentCount = sPresent,
                    AbsentCount = g.Count(r => r.Status == AttendanceStatus.Absent),
                    LateCount = g.Count(r => r.Status == AttendanceStatus.Late),
                    ExcusedCount = g.Count(r => r.Status == AttendanceStatus.Excused),
                    AttendancePercentage = sTotal == 0 ? 0 : Math.Round((double)sPresent / sTotal * 100, 1)
                };
            }).ToList();

        return new GetClassAttendanceReportResponse
        {
            ClassGroupId = request.ClassGroupId,
            ClassGroupName = classGroupName,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            TotalSessions = totalSessions,
            TotalRecords = totalStudentRecords,
            PresentCount = present,
            AbsentCount = absent,
            LateCount = late,
            ExcusedCount = excused,
            OverallAttendancePercentage = overallPercentage,
            StudentBreakdown = studentBreakdown
        };
    }
}
