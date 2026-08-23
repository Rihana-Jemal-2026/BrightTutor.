using BrightTutor.Application.Abstractions.Persistence;
using BrightTutor.Application.Attendance.Dtos;
using BrightTutor.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Application.Attendance.Queries;

public class GetTeacherAttendanceReportQuery : IRequest<GetTeacherAttendanceReportResponse>
{
    public Guid TeacherId { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
}

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
        // Resolve TeacherId (support either Teacher.Id or User.Id)
        var teacherEntity = await _context.Teachers
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.Id == request.TeacherId || t.UserId == request.TeacherId, cancellationToken);

        var actualTeacherId = teacherEntity?.Id ?? request.TeacherId;
        var teacherName = teacherEntity?.User != null 
            ? $"{teacherEntity.User.FirstName} {teacherEntity.User.LastName}" 
            : "Teacher";

        var records = await _context.TeacherAttendances
            .Where(t => t.TeacherId == actualTeacherId
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
            TeacherId = actualTeacherId,
            TeacherName = teacherName,
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
