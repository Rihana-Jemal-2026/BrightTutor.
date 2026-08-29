using BrightTutor.Application.Abstractions.Persistence;
using BrightTutor.Domain.Entities;
using BrightTutor.Domain.Enums;
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
            .AnyAsync(e => e.StudentId == student.Id && e.CourseId == request.CourseId && e.IsActive, cancellationToken);
        if (activeEnrollment)
        {
            throw new InvalidOperationException($"Student is already actively enrolled in this course.");
        }

        var enrollment = new Enrollment
        {
            StudentId = student.Id,
            CourseId = request.CourseId,
            ClassGroupId = (request.ClassGroupId.HasValue && request.ClassGroupId.Value != Guid.Empty) ? request.ClassGroupId : null,
            EnrollmentDate = DateTime.UtcNow,
            IsActive = true
        };

        _context.Enrollments.Add(enrollment);

        // Auto-generate 4 weekly recurring schedule slots if a teacher is assigned
        var course = await _context.Courses.FirstOrDefaultAsync(c => c.Id == request.CourseId, cancellationToken);
        var teacherAssignment = await _context.TeacherAssignments
            .FirstOrDefaultAsync(a => a.CourseId == request.CourseId && (!request.ClassGroupId.HasValue || a.ClassGroupId == request.ClassGroupId), cancellationToken);

        if (course != null && teacherAssignment != null)
        {
            var baseDate = DateTime.UtcNow.Date.AddDays(1).AddHours(10); // Tomorrow 10:00 AM
            for (int i = 0; i < 4; i++)
            {
                var startTime = baseDate.AddDays(i * 7);
                var endTime = startTime.AddHours(1);

                var schedule = new Schedule
                {
                    CourseId = course.Id,
                    TeacherId = teacherAssignment.TeacherId,
                    ClassGroupId = request.ClassGroupId,
                    StudentId = student.Id,
                    ServiceType = course.ServiceType,
                    StartTime = startTime,
                    EndTime = endTime,
                    Status = ScheduleStatus.Scheduled,
                    MeetingLink = course.ServiceType == Domain.Enums.ServiceType.Online ? $"https://meet.brighttutor.com/room-{Guid.NewGuid().ToString()[..8]}" : null,
                    LocationAddress = course.ServiceType == Domain.Enums.ServiceType.HomeToHome ? "Student Registered Home Address" : null
                };
                _context.Schedules.Add(schedule);
            }
        }

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
