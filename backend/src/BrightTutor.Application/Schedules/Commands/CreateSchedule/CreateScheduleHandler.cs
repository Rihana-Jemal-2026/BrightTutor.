using BrightTutor.Application.Abstractions.Persistence;
using BrightTutor.Domain.Entities;
using BrightTutor.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Application.Schedules.Commands.CreateSchedule;

public class CreateScheduleHandler : IRequestHandler<CreateScheduleCommand, CreateScheduleResponse>
{
    private readonly IApplicationDbContext _context;

    public CreateScheduleHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<CreateScheduleResponse> Handle(CreateScheduleCommand request, CancellationToken cancellationToken)
    {
        if (request.EndTime <= request.StartTime)
        {
            throw new InvalidOperationException("EndTime must be later than StartTime.");
        }

        var courseExists = await _context.Courses
            .AnyAsync(c => c.Id == request.CourseId, cancellationToken);
        if (!courseExists)
        {
            throw new InvalidOperationException($"Course with ID '{request.CourseId}' not found.");
        }

        var teacher = await _context.Teachers
            .FirstOrDefaultAsync(t => t.Id == request.TeacherId || t.UserId == request.TeacherId, cancellationToken);
        if (teacher == null)
        {
            throw new InvalidOperationException($"Teacher with ID '{request.TeacherId}' not found.");
        }
        var actualTeacherId = teacher.Id;

        if (request.ClassGroupId.HasValue && request.ClassGroupId.Value != Guid.Empty)
        {
            var groupExists = await _context.ClassGroups
                .AnyAsync(g => g.Id == request.ClassGroupId.Value, cancellationToken);
            if (!groupExists)
            {
                throw new InvalidOperationException($"Class group with ID '{request.ClassGroupId}' not found.");
            }
        }

        Guid? actualStudentId = null;
        if (request.StudentId.HasValue && request.StudentId.Value != Guid.Empty)
        {
            var student = await _context.Students
                .FirstOrDefaultAsync(s => s.Id == request.StudentId.Value || s.UserId == request.StudentId.Value, cancellationToken);
            if (student == null)
            {
                throw new InvalidOperationException($"Student with ID '{request.StudentId}' not found.");
            }
            actualStudentId = student.Id;
        }

        var schedule = new Schedule
        {
            CourseId = request.CourseId,
            TeacherId = actualTeacherId,
            ClassGroupId = (request.ClassGroupId.HasValue && request.ClassGroupId.Value != Guid.Empty) ? request.ClassGroupId : null,
            StudentId = actualStudentId,
            ServiceType = request.ServiceType,
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            MeetingLink = request.MeetingLink,
            LocationAddress = request.LocationAddress,
            Status = ScheduleStatus.Scheduled
        };

        _context.Schedules.Add(schedule);
        await _context.SaveChangesAsync(cancellationToken);

        return new CreateScheduleResponse
        {
            Id = schedule.Id,
            CourseId = schedule.CourseId,
            TeacherId = schedule.TeacherId,
            ClassGroupId = schedule.ClassGroupId,
            StudentId = schedule.StudentId,
            ServiceType = schedule.ServiceType,
            StartTime = schedule.StartTime,
            EndTime = schedule.EndTime,
            Status = schedule.Status
        };
    }
}
