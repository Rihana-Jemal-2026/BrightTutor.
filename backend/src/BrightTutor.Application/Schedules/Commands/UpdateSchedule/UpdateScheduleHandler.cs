using BrightTutor.Application.Abstractions.Persistence;
using BrightTutor.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Application.Schedules.Commands.UpdateSchedule;

public class UpdateScheduleHandler : IRequestHandler<UpdateScheduleCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public UpdateScheduleHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(UpdateScheduleCommand request, CancellationToken cancellationToken)
    {
        var schedule = await _context.Schedules
            .FirstOrDefaultAsync(s => s.Id == request.ScheduleId, cancellationToken);

        if (schedule == null) return false;

        if (request.EndTime <= request.StartTime)
        {
            throw new InvalidOperationException("EndTime must be later than StartTime.");
        }

        if (request.CourseId.HasValue && request.CourseId.Value != Guid.Empty)
        {
            var courseExists = await _context.Courses.AnyAsync(c => c.Id == request.CourseId.Value, cancellationToken);
            if (!courseExists) throw new InvalidOperationException("Selected course not found.");
            schedule.CourseId = request.CourseId.Value;
        }

        if (request.TeacherId.HasValue && request.TeacherId.Value != Guid.Empty)
        {
            var teacher = await _context.Teachers
                .FirstOrDefaultAsync(t => t.Id == request.TeacherId.Value || t.UserId == request.TeacherId.Value, cancellationToken);
            if (teacher == null) throw new InvalidOperationException("Assigned teacher not found.");
            schedule.TeacherId = teacher.Id;
        }

        if (request.ClassGroupId.HasValue && request.ClassGroupId.Value != Guid.Empty)
        {
            var groupExists = await _context.ClassGroups.AnyAsync(g => g.Id == request.ClassGroupId.Value, cancellationToken);
            if (!groupExists) throw new InvalidOperationException("Class group not found.");
            schedule.ClassGroupId = request.ClassGroupId.Value;
        }
        else if (request.ClassGroupId.HasValue && request.ClassGroupId.Value == Guid.Empty)
        {
            schedule.ClassGroupId = null;
        }

        if (request.ServiceType.HasValue)
        {
            schedule.ServiceType = request.ServiceType.Value;
        }

        // If Group class, studentId must be null
        if (schedule.ServiceType == ServiceType.Group)
        {
            schedule.StudentId = null;
        }
        else if (request.StudentId.HasValue && request.StudentId.Value != Guid.Empty)
        {
            var student = await _context.Students
                .FirstOrDefaultAsync(s => s.Id == request.StudentId.Value || s.UserId == request.StudentId.Value, cancellationToken);
            if (student != null) schedule.StudentId = student.Id;
        }
        else
        {
            schedule.StudentId = null;
        }

        if (request.Status.HasValue)
        {
            schedule.Status = request.Status.Value;
        }

        schedule.StartTime = request.StartTime;
        schedule.EndTime = request.EndTime;
        schedule.MeetingLink = request.MeetingLink;
        schedule.LocationAddress = request.LocationAddress;
        schedule.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
