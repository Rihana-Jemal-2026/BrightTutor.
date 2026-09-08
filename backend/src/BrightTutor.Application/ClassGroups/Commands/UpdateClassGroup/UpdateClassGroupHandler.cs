using BrightTutor.Application.Abstractions.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Application.ClassGroups.Commands.UpdateClassGroup;

public class UpdateClassGroupHandler : IRequestHandler<UpdateClassGroupCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public UpdateClassGroupHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(UpdateClassGroupCommand request, CancellationToken cancellationToken)
    {
        var group = await _context.ClassGroups
            .FirstOrDefaultAsync(g => g.Id == request.ClassGroupId, cancellationToken);

        if (group == null) return false;

        group.Name = request.Name;
        group.MaximumStudents = request.MaximumStudents;
        group.IsActive = request.IsActive;
        group.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
