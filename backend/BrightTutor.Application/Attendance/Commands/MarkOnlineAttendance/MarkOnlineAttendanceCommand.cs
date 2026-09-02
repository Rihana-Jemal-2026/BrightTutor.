using BrightTutor.Application.Abstractions.Persistence;
using BrightTutor.Domain.Entities;
using BrightTutor.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Application.Attendance.Commands.MarkOnlineAttendance;

public class MarkOnlineAttendanceCommand : IRequest<Guid>
{
    public Guid StudentId { get; set; }
    public Guid TeacherId { get; set; }
    public Guid? ClassGroupId { get; set; }
    public DateOnly AttendanceDate { get; set; }
    public AttendanceStatus Status { get; set; }
    public string? Notes { get; set; }
}

public class MarkOnlineAttendanceHandler : IRequestHandler<MarkOnlineAttendanceCommand, Guid>
{
    private readonly IApplicationDbContext _context;

    public MarkOnlineAttendanceHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Guid> Handle(MarkOnlineAttendanceCommand request, CancellationToken cancellationToken)
    {
        // Resolve TeacherId (support either Teacher.Id or User.Id)
        var teacher = await _context.Teachers
            .FirstOrDefaultAsync(t => t.Id == request.TeacherId || t.UserId == request.TeacherId, cancellationToken);
        var actualTeacherId = teacher?.Id ?? request.TeacherId;

        // Resolve StudentId (support either Student.Id or User.Id)
        var studentEntity = await _context.Students
            .FirstOrDefaultAsync(st => st.Id == request.StudentId || st.UserId == request.StudentId, cancellationToken);
        var actualStudentId = studentEntity?.Id ?? request.StudentId;

        // Resolve optional ClassGroupId or fallback to student's enrolled group
        var effectiveGroupId = request.ClassGroupId;
        if (!effectiveGroupId.HasValue || effectiveGroupId.Value == Guid.Empty)
        {
            var enrollment = await _context.Enrollments
                .FirstOrDefaultAsync(e => e.StudentId == actualStudentId, cancellationToken);
            effectiveGroupId = enrollment?.ClassGroupId;
        }

        // Check if attendance already exists for this student on this date (UPSERT Strategy)
        var existingRecord = await _context.Attendances
            .FirstOrDefaultAsync(a => a.StudentId == actualStudentId 
                && (a.AttendanceType == AttendanceType.Online || (effectiveGroupId.HasValue && a.ClassGroupId == effectiveGroupId.Value)) 
                && a.AttendanceDate == request.AttendanceDate, cancellationToken);

        Domain.Entities.Attendance attendance;

        if (existingRecord != null)
        {
            // Update existing attendance
            existingRecord.Status = request.Status;
            existingRecord.TeacherId = actualTeacherId;
            existingRecord.Notes = request.Notes;
            existingRecord.UpdatedAt = DateTime.UtcNow;
            attendance = existingRecord;
        }
        else
        {
            // Insert new 1-on-1 online attendance
            attendance = new Domain.Entities.Attendance
            {
                StudentId = actualStudentId,
                TeacherId = actualTeacherId,
                ClassGroupId = effectiveGroupId ?? Guid.Empty,
                AttendanceType = AttendanceType.Online,
                Status = request.Status,
                AttendanceDate = request.AttendanceDate,
                Notes = request.Notes
            };
            _context.Attendances.Add(attendance);
        }

        // Automated Notification Trigger for Absent or Late Online Sessions (Module 5 Integration)
        if (request.Status == AttendanceStatus.Absent || request.Status == AttendanceStatus.Late)
        {
            if (studentEntity != null)
            {
                var studentWithParent = await _context.Students
                    .Include(st => st.Parent)
                    .FirstOrDefaultAsync(st => st.Id == studentEntity.Id, cancellationToken);

                if (studentWithParent != null)
                {
                    _context.Notifications.Add(new Notification
                    {
                        UserId = studentWithParent.UserId,
                        Title = "Online Class Attendance Alert",
                        Message = $"Your attendance status was recorded as {request.Status} for online class on {request.AttendanceDate}.",
                        Type = NotificationType.AttendanceAlert,
                        Status = NotificationStatus.Unread
                    });

                    if (studentWithParent.Parent != null)
                    {
                        _context.Notifications.Add(new Notification
                        {
                            UserId = studentWithParent.Parent.UserId,
                            Title = "Student Online Attendance Alert",
                            Message = $"Student ({studentWithParent.StudentCode}) attendance status was recorded as {request.Status} for online class on {request.AttendanceDate}.",
                            Type = NotificationType.AttendanceAlert,
                            Status = NotificationStatus.Unread
                        });
                    }
                }
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        return attendance.Id;
    }
}
