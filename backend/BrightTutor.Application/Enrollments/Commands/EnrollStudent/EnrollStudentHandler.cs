using BrightTutor.Application.Abstractions.Persistence;
using BrightTutor.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Application.Enrollments.Commands.EnrollStudent;

public class EnrollStudentHandler : IRequestHandler<EnrollStudentCommand, EnrollStudentResponse>
{
    private readonly IApplicationDbContext _context;

    public EnrollStudentHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<EnrollStudentResponse> Handle(EnrollStudentCommand request, CancellationToken cancellationToken)
    {
        var student = await _context.Students
            .FirstOrDefaultAsync(s => s.Id == request.StudentId || s.UserId == request.StudentId, cancellationToken);
        if (student == null)
        {
            throw new InvalidOperationException($"Student not found.");
        }
        var actualStudentId = student.Id;

        var courseExists = await _context.Courses
            .AnyAsync(c => c.Id == request.CourseId, cancellationToken);
        if (!courseExists)
        {
            throw new InvalidOperationException($"Course not found.");
        }

        if (request.ClassGroupId.HasValue && request.ClassGroupId.Value != Guid.Empty)
        {
            var groupExists = await _context.ClassGroups
                .AnyAsync(g => g.Id == request.ClassGroupId.Value && g.CourseId == request.CourseId, cancellationToken);
            if (!groupExists)
            {
                throw new InvalidOperationException($"Class group not found for this course.");
            }
        }

        var activeEnrollment = await _context.Enrollments
            .AnyAsync(e => e.StudentId == actualStudentId && e.CourseId == request.CourseId && e.IsActive, cancellationToken);
        if (activeEnrollment)
        {
            throw new InvalidOperationException($"Student is already actively enrolled in this course.");
        }

        var enrollment = new Enrollment
        {
            StudentId = actualStudentId,
            CourseId = request.CourseId,
            ClassGroupId = (request.ClassGroupId.HasValue && request.ClassGroupId.Value != Guid.Empty) ? request.ClassGroupId : null,
            EnrollmentDate = DateTime.UtcNow,
            IsActive = true
        };

        _context.Enrollments.Add(enrollment);
        await _context.SaveChangesAsync(cancellationToken);

        return new EnrollStudentResponse
        {
            Id = enrollment.Id,
            StudentId = enrollment.StudentId,
            CourseId = enrollment.CourseId,
            ClassGroupId = enrollment.ClassGroupId,
            EnrollmentDate = enrollment.EnrollmentDate,
            IsActive = enrollment.IsActive
        };
    }
}
