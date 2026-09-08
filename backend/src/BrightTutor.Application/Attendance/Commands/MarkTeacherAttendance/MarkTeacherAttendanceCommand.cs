using BrightTutor.Application.Abstractions.Persistence;
using BrightTutor.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Application.Attendance.Commands.MarkTeacherAttendance;

public class MarkTeacherAttendanceCommand : IRequest<Guid>
{
    public Guid TeacherId { get; set; }
    public DateOnly AttendanceDate { get; set; }
    public AttendanceStatus Status { get; set; }
    public DateTime? CheckInTime { get; set; }
    public DateTime? CheckOutTime { get; set; }
    public string? Notes { get; set; }
}

public class MarkTeacherAttendanceHandler : IRequestHandler<MarkTeacherAttendanceCommand, Guid>
{
    private readonly IApplicationDbContext _context;

    public MarkTeacherAttendanceHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Guid> Handle(MarkTeacherAttendanceCommand request, CancellationToken cancellationToken)
    {
        // Resolve TeacherId (support either Teacher.Id or User.Id)
        var teacher = await _context.Teachers
            .FirstOrDefaultAsync(t => t.Id == request.TeacherId || t.UserId == request.TeacherId, cancellationToken);
        var actualTeacherId = teacher?.Id ?? request.TeacherId;

        var existing = await _context.TeacherAttendances
            .AnyAsync(t => t.TeacherId == actualTeacherId && t.AttendanceDate == request.AttendanceDate, cancellationToken);

        if (existing)
        {
            throw new InvalidOperationException($"Attendance for teacher on {request.AttendanceDate} has already been submitted today. Multiple submissions on the same date are not allowed.");
        }

        var record = new Domain.Entities.TeacherAttendance
        {
            TeacherId = actualTeacherId,
            AttendanceDate = request.AttendanceDate,
            Status = request.Status,
            CheckInTime = request.CheckInTime,
            CheckOutTime = request.CheckOutTime,
            Notes = request.Notes
        };

        _context.TeacherAttendances.Add(record);
        await _context.SaveChangesAsync(cancellationToken);

        return record.Id;
    }
}
