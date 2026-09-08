using BrightTutor.Application.Abstractions.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Application.TeacherAssignments.Commands.RemoveTeacherAssignment;

public class RemoveTeacherAssignmentHandler : IRequestHandler<RemoveTeacherAssignmentCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public RemoveTeacherAssignmentHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(RemoveTeacherAssignmentCommand request, CancellationToken cancellationToken)
    {
        var assignment = await _context.TeacherAssignments
            .FirstOrDefaultAsync(a => a.Id == request.AssignmentId, cancellationToken);

        if (assignment == null) return false;

        _context.TeacherAssignments.Remove(assignment);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
