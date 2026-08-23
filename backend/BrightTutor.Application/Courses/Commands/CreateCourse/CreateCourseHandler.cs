using BrightTutor.Application.Abstractions.Persistence;
using BrightTutor.Domain.Entities;
using MediatR;

namespace BrightTutor.Application.Courses.Commands.CreateCourse;

public class CreateCourseHandler : IRequestHandler<CreateCourseCommand, CreateCourseResponse>
{
    private readonly IApplicationDbContext _context;

    public CreateCourseHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<CreateCourseResponse> Handle(CreateCourseCommand request, CancellationToken cancellationToken)
    {
        var course = new Course
        {
            Name = request.Name,
            Description = request.Description,
            ServiceType = request.ServiceType,
            IsActive = true
        };

        _context.Courses.Add(course);
        await _context.SaveChangesAsync(cancellationToken);

        return new CreateCourseResponse
        {
            Id = course.Id,
            Name = course.Name,
            ServiceType = course.ServiceType,
            IsActive = course.IsActive
        };
    }
}
