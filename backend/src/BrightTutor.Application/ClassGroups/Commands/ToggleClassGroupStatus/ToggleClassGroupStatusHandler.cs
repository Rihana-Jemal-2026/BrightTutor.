using BrightTutor.Application.Abstractions.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Application.ClassGroups.Commands.ToggleClassGroupStatus;

public class ToggleClassGroupStatusHandler : IRequestHandler<ToggleClassGroupStatusCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public ToggleClassGroupStatusHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(ToggleClassGroupStatusCommand request, CancellationToken cancellationToken)
    {
        var group = await _context.ClassGroups
            .FirstOrDefaultAsync(g => g.Id == request.ClassGroupId, cancellationToken);

        if (group == null) return false;

        group.IsActive = request.IsActive;
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
