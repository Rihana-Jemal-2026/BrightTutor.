using BrightTutor.Application.Abstractions.Persistence;
using BrightTutor.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Application.ClassGroups.Commands.CreateClassGroup;

public class CreateClassGroupHandler : IRequestHandler<CreateClassGroupCommand, CreateClassGroupResponse>
{
    private readonly IApplicationDbContext _context;

    public CreateClassGroupHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<CreateClassGroupResponse> Handle(CreateClassGroupCommand request, CancellationToken cancellationToken)
    {
        var courseExists = await _context.Courses
            .AnyAsync(c => c.Id == request.CourseId, cancellationToken);

        if (!courseExists)
        {
            throw new InvalidOperationException($"Course with ID '{request.CourseId}' does not exist.");
        }

        var classGroup = new ClassGroup
        {
            CourseId = request.CourseId,
            Name = request.Name,
            MaximumStudents = request.MaximumStudents,
            IsActive = true
        };

        _context.ClassGroups.Add(classGroup);
        await _context.SaveChangesAsync(cancellationToken);

        return new CreateClassGroupResponse
        {
            Id = classGroup.Id,
            CourseId = classGroup.CourseId,
            Name = classGroup.Name,
            MaximumStudents = classGroup.MaximumStudents,
            IsActive = classGroup.IsActive
        };
    }
}
