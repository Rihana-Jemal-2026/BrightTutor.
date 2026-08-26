using BrightTutor.Application.Abstractions.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Application.TeacherAssignments.Commands.UpdateTeacherAssignment;

public class UpdateTeacherAssignmentHandler : IRequestHandler<UpdateTeacherAssignmentCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public UpdateTeacherAssignmentHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(UpdateTeacherAssignmentCommand request, CancellationToken cancellationToken)
    {
        var assignment = await _context.TeacherAssignments
            .FirstOrDefaultAsync(a => a.Id == request.AssignmentId, cancellationToken);

        if (assignment == null) return false;

        // Resolve Teacher
        var teacher = await _context.Teachers
            .FirstOrDefaultAsync(t => t.Id == request.TeacherId || t.UserId == request.TeacherId, cancellationToken);

        if (teacher == null)
        {
            throw new InvalidOperationException("Selected teacher not found.");
        }

        // Verify Course
        var courseExists = await _context.Courses.AnyAsync(c => c.Id == request.CourseId, cancellationToken);
        if (!courseExists)
        {
            throw new InvalidOperationException("Selected course not found.");
        }

        // Verify Group if provided
        if (request.ClassGroupId.HasValue && request.ClassGroupId.Value != Guid.Empty)
        {
            var groupExists = await _context.ClassGroups
                .AnyAsync(g => g.Id == request.ClassGroupId.Value && g.CourseId == request.CourseId, cancellationToken);
            if (!groupExists)
            {
                throw new InvalidOperationException("Selected class group does not belong to this course.");
            }
            assignment.ClassGroupId = request.ClassGroupId.Value;
        }
        else
        {
            assignment.ClassGroupId = null;
        }

        // Check if duplicate assignment exists for other records
        var isDuplicate = await _context.TeacherAssignments
            .AnyAsync(a => a.Id != assignment.Id &&
                           a.TeacherId == teacher.Id &&
                           a.CourseId == request.CourseId &&
                           a.ClassGroupId == assignment.ClassGroupId, cancellationToken);

        if (isDuplicate)
        {
            throw new InvalidOperationException("This teacher is already assigned to the selected course and class group.");
        }

        assignment.TeacherId = teacher.Id;
        assignment.CourseId = request.CourseId;
        if (request.StartDate.HasValue)
        {
            assignment.StartDate = request.StartDate.Value;
        }
        assignment.EndDate = request.EndDate;
        assignment.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
