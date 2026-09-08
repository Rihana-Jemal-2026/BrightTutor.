using BrightTutor.Application.Abstractions.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Application.Courses.Commands.ToggleCourseStatus;

public class ToggleCourseStatusHandler : IRequestHandler<ToggleCourseStatusCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public ToggleCourseStatusHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(ToggleCourseStatusCommand request, CancellationToken cancellationToken)
    {
        var course = await _context.Courses
            .FirstOrDefaultAsync(c => c.Id == request.CourseId, cancellationToken);

        if (course == null) return false;

        course.IsActive = request.IsActive;
        course.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
