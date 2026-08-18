using BrightTutor.Application.Abstractions.Persistence;
using BrightTutor.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Application.Attendance.Commands.UpdateAttendance;

public class UpdateAttendanceCommand : IRequest<bool>
{
    public Guid AttendanceId { get; set; }
    public AttendanceStatus NewStatus { get; set; }
    public string? Notes { get; set; }
}

public class UpdateAttendanceHandler : IRequestHandler<UpdateAttendanceCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public UpdateAttendanceHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(UpdateAttendanceCommand request, CancellationToken cancellationToken)
    {
        var attendance = await _context.Attendances
            .FirstOrDefaultAsync(a => a.Id == request.AttendanceId, cancellationToken);

        if (attendance is null)
            return false;

        attendance.Status = request.NewStatus;

        if (request.Notes is not null)
            attendance.Notes = request.Notes;

        attendance.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
