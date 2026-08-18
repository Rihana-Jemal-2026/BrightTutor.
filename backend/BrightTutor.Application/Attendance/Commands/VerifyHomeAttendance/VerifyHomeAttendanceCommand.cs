using BrightTutor.Application.Abstractions.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Application.Attendance.Commands.VerifyHomeAttendance;

public class VerifyHomeAttendanceCommand : IRequest<bool>
{
    public Guid AttendanceId { get; set; }
    public bool IsVerified { get; set; }
    public decimal? DistanceFromStudentHomeInMeters { get; set; }
}

public class VerifyHomeAttendanceHandler : IRequestHandler<VerifyHomeAttendanceCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public VerifyHomeAttendanceHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(VerifyHomeAttendanceCommand request, CancellationToken cancellationToken)
    {
        var homeDetail = await _context.HomeAttendances
            .FirstOrDefaultAsync(h => h.AttendanceId == request.AttendanceId, cancellationToken);

        if (homeDetail is null)
            return false;

        homeDetail.IsLocationVerified = request.IsVerified;

        if (request.DistanceFromStudentHomeInMeters.HasValue)
            homeDetail.DistanceFromStudentHomeInMeters = request.DistanceFromStudentHomeInMeters;

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
