using BrightTutor.Application.Abstractions.Persistence;
using BrightTutor.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Application.TeacherAssignments.Commands.AssignTeacher;

public class AssignTeacherHandler : IRequestHandler<AssignTeacherCommand, AssignTeacherResponse>
{
    private readonly IApplicationDbContext _context;

    public AssignTeacherHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<AssignTeacherResponse> Handle(AssignTeacherCommand request, CancellationToken cancellationToken)
    {
        var teacherExists = await _context.Teachers
            .AnyAsync(t => t.Id == request.TeacherId, cancellationToken);
        if (!teacherExists)
        {
            throw new InvalidOperationException($"Teacher with ID '{request.TeacherId}' not found.");
        }

        var courseExists = await _context.Courses
            .AnyAsync(c => c.Id == request.CourseId, cancellationToken);
        if (!courseExists)
        {
            throw new InvalidOperationException($"Course with ID '{request.CourseId}' not found.");
        }

        if (request.ClassGroupId.HasValue)
        {
            var groupExists = await _context.ClassGroups
                .AnyAsync(g => g.Id == request.ClassGroupId.Value && g.CourseId == request.CourseId, cancellationToken);
            if (!groupExists)
            {
                throw new InvalidOperationException($"Class group with ID '{request.ClassGroupId}' not found for this course.");
            }
        }

        var assignment = new TeacherAssignment
        {
            TeacherId = request.TeacherId,
            CourseId = request.CourseId,
            ClassGroupId = request.ClassGroupId,
            StartDate = DateTime.UtcNow
        };

        _context.TeacherAssignments.Add(assignment);
        await _context.SaveChangesAsync(cancellationToken);

        return new AssignTeacherResponse
        {
            Id = assignment.Id,
            TeacherId = assignment.TeacherId,
            CourseId = assignment.CourseId,
            ClassGroupId = assignment.ClassGroupId,
            StartDate = assignment.StartDate
        };
    }
}
