using BrightTutor.Application.Abstractions.Persistence;
using BrightTutor.Application.Attendance.Dtos;
using BrightTutor.Domain.Entities;
using BrightTutor.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Application.Attendance.Commands.MarkGroupAttendance;

public class MarkGroupAttendanceCommand : IRequest<MarkGroupAttendanceResponse>
{
    public Guid ClassGroupId { get; set; }
    public Guid TeacherId { get; set; }
    public DateOnly AttendanceDate { get; set; }
    public List<StudentAttendanceEntryDto> Students { get; set; } = [];
}

public class MarkGroupAttendanceHandler
    : IRequestHandler<MarkGroupAttendanceCommand, MarkGroupAttendanceResponse>
{
    private readonly IApplicationDbContext _context;

    public MarkGroupAttendanceHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<MarkGroupAttendanceResponse> Handle(
        MarkGroupAttendanceCommand request, CancellationToken cancellationToken)
    {
        // Resolve TeacherId (support either Teacher.Id or User.Id)
        var teacher = await _context.Teachers
            .FirstOrDefaultAsync(t => t.Id == request.TeacherId || t.UserId == request.TeacherId, cancellationToken);
        var actualTeacherId = teacher?.Id ?? request.TeacherId;

        // Resolve StudentIds (support either Student.Id or User.Id)
        var studentInputIds = request.Students.Select(s => s.StudentId).ToList();
        var studentsList = await _context.Students
            .Where(st => studentInputIds.Contains(st.Id) || studentInputIds.Contains(st.UserId))
            .ToListAsync(cancellationToken);

        var studentMap = new Dictionary<Guid, Guid>();
        foreach (var st in studentsList)
        {
            studentMap[st.Id] = st.Id;
            studentMap[st.UserId] = st.Id;
        }

        // Fetch existing attendance records for this class group on this date (UPSERT Strategy)
        var existingRecords = await _context.Attendances
            .Where(a => a.ClassGroupId == request.ClassGroupId && a.AttendanceDate == request.AttendanceDate)
            .ToDictionaryAsync(a => a.StudentId, cancellationToken);

        var processedRecords = new List<Domain.Entities.Attendance>();

        foreach (var s in request.Students)
        {
            Guid actualStudentId = studentMap.TryGetValue(s.StudentId, out var mappedId) ? mappedId : s.StudentId;

            if (existingRecords.TryGetValue(actualStudentId, out var existingRecord))
            {
                // Update existing attendance record (prevents duplicates and allows corrections)
                existingRecord.Status = s.Status;
                existingRecord.TeacherId = actualTeacherId;
                existingRecord.Notes = s.Notes;
                existingRecord.UpdatedAt = DateTime.UtcNow;
                processedRecords.Add(existingRecord);
            }
            else
            {
                // Create new attendance record
                var newRecord = new Domain.Entities.Attendance
                {
                    StudentId = actualStudentId,
                    TeacherId = actualTeacherId,
                    ClassGroupId = request.ClassGroupId,
                    AttendanceType = AttendanceType.Group,
                    Status = s.Status,
                    AttendanceDate = request.AttendanceDate,
                    Notes = s.Notes
                };
                _context.Attendances.Add(newRecord);
                processedRecords.Add(newRecord);
            }
        }

        // Automated Notification Trigger for Absent or Late Students (Module 5 Integration)
        foreach (var s in processedRecords.Where(r => r.Status == AttendanceStatus.Absent || r.Status == AttendanceStatus.Late))
        {
            var student = await _context.Students
                .Include(st => st.Parent)
                .FirstOrDefaultAsync(st => st.Id == s.StudentId, cancellationToken);

            if (student != null)
            {
                // Send notification to Student
                _context.Notifications.Add(new Notification
                {
                    UserId = student.UserId,
                    Title = "Attendance Alert",
                    Message = $"Your attendance status was recorded as {s.Status} for group class on {request.AttendanceDate}.",
                    Type = NotificationType.AttendanceAlert,
                    Status = NotificationStatus.Unread
                });

                // Send notification to Parent if linked
                if (student.Parent != null)
                {
                    _context.Notifications.Add(new Notification
                    {
                        UserId = student.Parent.UserId,
                        Title = "Student Attendance Alert",
                        Message = $"Student ({student.StudentCode}) attendance status was recorded as {s.Status} for group class on {request.AttendanceDate}.",
                        Type = NotificationType.AttendanceAlert,
                        Status = NotificationStatus.Unread
                    });
                }
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        return new MarkGroupAttendanceResponse
        {
            RecordsCreated = processedRecords.Count,
            ClassGroupId = request.ClassGroupId,
            AttendanceDate = request.AttendanceDate
        };
    }
}
