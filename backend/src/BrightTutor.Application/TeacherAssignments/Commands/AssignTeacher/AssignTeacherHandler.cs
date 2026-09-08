using BrightTutor.Application.Abstractions.Persistence;
using BrightTutor.Domain.Entities;
using BrightTutor.Domain.Enums;
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
        var teacher = await _context.Teachers
            .FirstOrDefaultAsync(t => t.Id == request.TeacherId || t.UserId == request.TeacherId, cancellationToken);
        if (teacher == null)
        {
            throw new InvalidOperationException($"Teacher with ID '{request.TeacherId}' not found.");
        }
        var actualTeacherId = teacher.Id;

        var courseExists = await _context.Courses
            .AnyAsync(c => c.Id == request.CourseId, cancellationToken);
        if (!courseExists)
        {
            throw new InvalidOperationException($"Course with ID '{request.CourseId}' not found.");
        }

        if (request.ClassGroupId.HasValue && request.ClassGroupId.Value != Guid.Empty)
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
            TeacherId = teacher.Id,
            CourseId = request.CourseId,
            ClassGroupId = (request.ClassGroupId.HasValue && request.ClassGroupId.Value != Guid.Empty) ? request.ClassGroupId : null,
            StartDate = DateTime.UtcNow
        };

        _context.TeacherAssignments.Add(assignment);

        // Auto-generate schedules for existing enrolled students who don't have schedules yet
        var course = await _context.Courses.FirstOrDefaultAsync(c => c.Id == request.CourseId, cancellationToken);
        if (course != null)
        {
            var enrollments = await _context.Enrollments
                .Where(e => e.CourseId == request.CourseId && (!request.ClassGroupId.HasValue || e.ClassGroupId == request.ClassGroupId) && e.IsActive)
                .ToListAsync(cancellationToken);

            foreach (var e in enrollments)
            {
                var existingScheduleCount = await _context.Schedules
                    .CountAsync(s => s.CourseId == request.CourseId && s.StudentId == e.StudentId, cancellationToken);

                if (existingScheduleCount == 0)
                {
                    var baseDate = DateTime.UtcNow.Date.AddDays(1).AddHours(10);
                    for (int i = 0; i < 4; i++)
                    {
                        var startTime = baseDate.AddDays(i * 7);
                        var endTime = startTime.AddHours(1);

                        var schedule = new Schedule
                        {
                            CourseId = course.Id,
                            TeacherId = teacher.Id,
                            ClassGroupId = request.ClassGroupId,
                            StudentId = e.StudentId,
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
            }
        }

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
