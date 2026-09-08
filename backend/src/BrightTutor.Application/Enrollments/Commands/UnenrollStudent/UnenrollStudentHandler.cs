using BrightTutor.Application.Abstractions.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Application.Enrollments.Commands.UnenrollStudent;

public class UnenrollStudentHandler : IRequestHandler<UnenrollStudentCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public UnenrollStudentHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(UnenrollStudentCommand request, CancellationToken cancellationToken)
    {
        var enrollment = await _context.Enrollments
            .FirstOrDefaultAsync(e => e.Id == request.EnrollmentId, cancellationToken);

        if (enrollment == null) return false;

        enrollment.IsActive = false;
        enrollment.EndDate = DateTime.UtcNow;
        enrollment.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
