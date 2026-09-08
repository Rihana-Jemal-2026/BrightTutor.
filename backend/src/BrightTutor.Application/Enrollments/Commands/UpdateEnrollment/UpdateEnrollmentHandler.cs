using BrightTutor.Application.Abstractions.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Application.Enrollments.Commands.UpdateEnrollment;

public class UpdateEnrollmentHandler : IRequestHandler<UpdateEnrollmentCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public UpdateEnrollmentHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(UpdateEnrollmentCommand request, CancellationToken cancellationToken)
    {
        var enrollment = await _context.Enrollments
            .FirstOrDefaultAsync(e => e.Id == request.EnrollmentId, cancellationToken);

        if (enrollment == null) return false;

        var targetCourseId = (request.CourseId.HasValue && request.CourseId.Value != Guid.Empty)
            ? request.CourseId.Value
            : enrollment.CourseId;

        // If switching course, verify course exists and student not already enrolled in that other course
        if (targetCourseId != enrollment.CourseId)
        {
            var courseExists = await _context.Courses
                .AnyAsync(c => c.Id == targetCourseId, cancellationToken);
            if (!courseExists)
            {
                throw new InvalidOperationException("Selected course not found.");
            }

            var alreadyEnrolledInTargetCourse = await _context.Enrollments
                .AnyAsync(e => e.StudentId == enrollment.StudentId && e.CourseId == targetCourseId && e.Id != enrollment.Id && e.IsActive, cancellationToken);
            if (alreadyEnrolledInTargetCourse)
            {
                throw new InvalidOperationException("Student is already actively enrolled in that selected course.");
            }

            enrollment.CourseId = targetCourseId;
        }

        // Handle class group validation for the target course
        if (request.ClassGroupId.HasValue && request.ClassGroupId.Value != Guid.Empty)
        {
            var groupExists = await _context.ClassGroups
                .AnyAsync(g => g.Id == request.ClassGroupId.Value && g.CourseId == targetCourseId, cancellationToken);

            if (!groupExists)
            {
                throw new InvalidOperationException("Selected class group does not belong to this course.");
            }
            enrollment.ClassGroupId = request.ClassGroupId.Value;
        }
        else
        {
            enrollment.ClassGroupId = null;
        }

        enrollment.IsActive = request.IsActive;
        if (!request.IsActive && enrollment.EndDate == null)
        {
            enrollment.EndDate = DateTime.UtcNow;
        }
        else if (request.IsActive)
        {
            enrollment.EndDate = null;
        }

        enrollment.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
