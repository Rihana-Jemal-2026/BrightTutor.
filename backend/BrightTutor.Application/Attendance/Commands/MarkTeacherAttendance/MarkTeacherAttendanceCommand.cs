using BrightTutor.Application.Abstractions.Persistence;
using BrightTutor.Domain.Enums;
using MediatR;

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
        var record = new Domain.Entities.TeacherAttendance
        {
            TeacherId = request.TeacherId,
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
