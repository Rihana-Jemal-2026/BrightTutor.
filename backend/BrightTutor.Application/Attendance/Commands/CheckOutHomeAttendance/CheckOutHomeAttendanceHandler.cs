using BrightTutor.Application.Abstractions.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Application.Attendance.Commands.CheckOutHomeAttendance;

public class CheckOutHomeAttendanceHandler : IRequestHandler<CheckOutHomeAttendanceCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public CheckOutHomeAttendanceHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(CheckOutHomeAttendanceCommand request, CancellationToken cancellationToken)
    {
        var attendance = await _context.Attendances
            .FirstOrDefaultAsync(a => a.Id == request.AttendanceId, cancellationToken);

        if (attendance is null)
            return false;

        attendance.CheckOutTime = DateTime.UtcNow;

        var homeDetail = await _context.HomeAttendances
            .FirstOrDefaultAsync(h => h.AttendanceId == request.AttendanceId, cancellationToken);

        if (homeDetail is null)
            return false;

        homeDetail.CheckOutLatitude = request.CheckOutLatitude;
        homeDetail.CheckOutLongitude = request.CheckOutLongitude;

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}