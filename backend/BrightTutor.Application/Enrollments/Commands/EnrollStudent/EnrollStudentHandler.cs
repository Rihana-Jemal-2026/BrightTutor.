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
        var studentExists = await _context.Students
            .AnyAsync(s => s.Id == request.StudentId, cancellationToken);
        if (!studentExists)
        {
            throw new InvalidOperationException($"Student with ID '{request.StudentId}' not found.");
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

        var activeEnrollment = await _context.Enrollments
            .AnyAsync(e => e.StudentId == request.StudentId && e.CourseId == request.CourseId && e.IsActive, cancellationToken);
        if (activeEnrollment)
        {
            throw new InvalidOperationException($"Student is already actively enrolled in this course.");
        }

        var enrollment = new Enrollment
        {
            StudentId = request.StudentId,
            CourseId = request.CourseId,
            ClassGroupId = request.ClassGroupId,
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
