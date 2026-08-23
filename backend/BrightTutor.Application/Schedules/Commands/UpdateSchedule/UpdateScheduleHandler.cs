using BrightTutor.Application.Abstractions.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Application.Schedules.Commands.UpdateSchedule;

public class UpdateScheduleHandler : IRequestHandler<UpdateScheduleCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public UpdateScheduleHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(UpdateScheduleCommand request, CancellationToken cancellationToken)
    {
        var schedule = await _context.Schedules
            .FirstOrDefaultAsync(s => s.Id == request.ScheduleId, cancellationToken);

        if (schedule == null) return false;

        if (request.EndTime <= request.StartTime)
        {
            throw new InvalidOperationException("EndTime must be later than StartTime.");
        }

        schedule.StartTime = request.StartTime;
        schedule.EndTime = request.EndTime;
        schedule.MeetingLink = request.MeetingLink;
        schedule.LocationAddress = request.LocationAddress;
        schedule.Status = request.Status;
        schedule.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
