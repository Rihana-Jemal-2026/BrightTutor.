using BrightTutor.Application.Abstractions.Persistence;
using BrightTutor.Application.Attendance.Dtos;
using BrightTutor.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Application.Attendance.Queries;

public class GetStudentAttendanceSummaryQuery : IRequest<GetStudentAttendanceSummaryResponse>
{
    public Guid StudentId { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
}

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
        var studentEntity = await _context.Students
            .Include(st => st.User)
            .FirstOrDefaultAsync(st => st.Id == request.StudentId || st.UserId == request.StudentId, cancellationToken);

        var actualStudentId = studentEntity?.Id ?? request.StudentId;
        var studentName = studentEntity?.User != null 
            ? $"{studentEntity.User.FirstName} {studentEntity.User.LastName}" 
            : "Student";

        var records = await _context.Attendances
            .Where(a => a.StudentId == actualStudentId
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
            StudentId = actualStudentId,
            StudentName = studentName,
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
