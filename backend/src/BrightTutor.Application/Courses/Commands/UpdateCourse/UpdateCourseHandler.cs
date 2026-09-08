using BrightTutor.Application.Abstractions.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Application.Courses.Commands.UpdateCourse;

public class UpdateCourseHandler : IRequestHandler<UpdateCourseCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public UpdateCourseHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(UpdateCourseCommand request, CancellationToken cancellationToken)
    {
        var course = await _context.Courses
            .FirstOrDefaultAsync(c => c.Id == request.CourseId, cancellationToken);

        if (course == null) return false;

        course.Name = request.Name;
        course.Description = request.Description;
        course.ServiceType = request.ServiceType;
        course.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
