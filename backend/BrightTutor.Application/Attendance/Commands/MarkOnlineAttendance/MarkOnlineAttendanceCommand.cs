using BrightTutor.Application.Abstractions.Persistence;
using BrightTutor.Domain.Enums;
using MediatR;

namespace BrightTutor.Application.Attendance.Commands.MarkOnlineAttendance;

public class MarkOnlineAttendanceCommand : IRequest<Guid>
{
    public Guid StudentId { get; set; }
    public Guid TeacherId { get; set; }
    public Guid ClassGroupId { get; set; }
    public DateOnly AttendanceDate { get; set; }
    public AttendanceStatus Status { get; set; }
    public string? Notes { get; set; }
}

public class MarkOnlineAttendanceHandler : IRequestHandler<MarkOnlineAttendanceCommand, Guid>
{
    private readonly IApplicationDbContext _context;

    public MarkOnlineAttendanceHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Guid> Handle(MarkOnlineAttendanceCommand request, CancellationToken cancellationToken)
    {
        var attendance = new Domain.Entities.Attendance
        {
            StudentId = request.StudentId,
            TeacherId = request.TeacherId,
            ClassGroupId = request.ClassGroupId,
            AttendanceType = AttendanceType.Online,
            Status = request.Status,
            AttendanceDate = request.AttendanceDate,
            Notes = request.Notes
        };

        _context.Attendances.Add(attendance);
        await _context.SaveChangesAsync(cancellationToken);

        return attendance.Id;
    }
}
