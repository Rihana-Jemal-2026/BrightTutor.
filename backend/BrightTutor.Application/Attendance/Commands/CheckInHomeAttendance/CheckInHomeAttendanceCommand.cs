using BrightTutor.Application.Abstractions.Persistence;
using BrightTutor.Domain.Entities;
using BrightTutor.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Application.Attendance.Commands.CheckInHomeAttendance;

public class CheckInHomeAttendanceCommand : IRequest<Guid>
{
    public Guid StudentId { get; set; }
    public Guid TeacherId { get; set; }
    public Guid ClassGroupId { get; set; }
    public DateOnly AttendanceDate { get; set; }
    public decimal CheckInLatitude { get; set; }
    public decimal CheckInLongitude { get; set; }
    public decimal? TargetLatitude { get; set; }
    public decimal? TargetLongitude { get; set; }
    public string? Address { get; set; }
    public string? LessonCovered { get; set; }
}

public class CheckInHomeAttendanceHandler : IRequestHandler<CheckInHomeAttendanceCommand, Guid>
{
    private readonly IApplicationDbContext _context;

    public CheckInHomeAttendanceHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Guid> Handle(CheckInHomeAttendanceCommand request, CancellationToken cancellationToken)
    {
        // Resolve TeacherId (support either Teacher.Id or User.Id)
        var teacher = await _context.Teachers
            .FirstOrDefaultAsync(t => t.Id == request.TeacherId || t.UserId == request.TeacherId, cancellationToken);
        var actualTeacherId = teacher?.Id ?? request.TeacherId;

        // Resolve StudentId (support either Student.Id or User.Id)
        var studentEntity = await _context.Students
            .FirstOrDefaultAsync(st => st.Id == request.StudentId || st.UserId == request.StudentId, cancellationToken);
        var actualStudentId = studentEntity?.Id ?? request.StudentId;

        // GPS Location Distance Verification (Allowed Radius: 300 meters)
        bool isVerified = true;
        double distanceMeters = 0;

        if (request.TargetLatitude.HasValue && request.TargetLongitude.HasValue)
        {
            distanceMeters = CalculateDistanceInMeters(
                request.CheckInLatitude, request.CheckInLongitude,
                request.TargetLatitude.Value, request.TargetLongitude.Value);

            if (distanceMeters > 300)
            {
                isVerified = false;
                throw new InvalidOperationException($"GPS Location Verification Failed: You are {Math.Round(distanceMeters)} meters away from the student's registered home address (Allowed Radius: 300m). Please check in when you arrive at the student's location.");
            }
        }

        // Check if home attendance record already exists for this student & date (UPSERT Strategy)
        var existingRecord = await _context.Attendances
            .FirstOrDefaultAsync(a => a.StudentId == actualStudentId && a.AttendanceDate == request.AttendanceDate && a.AttendanceType == AttendanceType.Home, cancellationToken);

        Domain.Entities.Attendance attendance;

        if (existingRecord != null)
        {
            existingRecord.TeacherId = actualTeacherId;
            existingRecord.ClassGroupId = request.ClassGroupId;
            existingRecord.CheckInTime = DateTime.UtcNow;
            existingRecord.LessonCovered = request.LessonCovered;
            existingRecord.UpdatedAt = DateTime.UtcNow;
            attendance = existingRecord;
        }
        else
        {
            attendance = new Domain.Entities.Attendance
            {
                StudentId = actualStudentId,
                TeacherId = actualTeacherId,
                ClassGroupId = request.ClassGroupId,
                AttendanceType = AttendanceType.Home,
                Status = AttendanceStatus.Present,
                AttendanceDate = request.AttendanceDate,
                CheckInTime = DateTime.UtcNow,
                LessonCovered = request.LessonCovered
            };
            _context.Attendances.Add(attendance);
        }

        await _context.SaveChangesAsync(cancellationToken);

        // Check or add HomeAttendance detail
        var existingHomeDetail = await _context.HomeAttendances
            .FirstOrDefaultAsync(h => h.AttendanceId == attendance.Id, cancellationToken);

        if (existingHomeDetail != null)
        {
            existingHomeDetail.CheckInLatitude = request.CheckInLatitude;
            existingHomeDetail.CheckInLongitude = request.CheckInLongitude;
            existingHomeDetail.Address = request.Address;
            existingHomeDetail.IsLocationVerified = isVerified;
            existingHomeDetail.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            var homeDetail = new HomeAttendance
            {
                AttendanceId = attendance.Id,
                CheckInLatitude = request.CheckInLatitude,
                CheckInLongitude = request.CheckInLongitude,
                Address = request.Address,
                IsLocationVerified = isVerified
            };
            _context.HomeAttendances.Add(homeDetail);
        }

        // Automated Home Check-In Notification to Student & Parent (Module 5 Integration)
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
                    Title = "Home Tutoring Check-In Alert",
                    Message = $"Your teacher has checked in for your home tutoring session today on {request.AttendanceDate}.",
                    Type = NotificationType.AttendanceAlert,
                    Status = NotificationStatus.Unread
                });

                if (studentWithParent.Parent != null)
                {
                    _context.Notifications.Add(new Notification
                    {
                        UserId = studentWithParent.Parent.UserId,
                        Title = "Home Tutoring Check-In Alert",
                        Message = $"Teacher has checked in for student ({studentWithParent.StudentCode})'s home tutoring session today on {request.AttendanceDate}.",
                        Type = NotificationType.AttendanceAlert,
                        Status = NotificationStatus.Unread
                    });
                }
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        return attendance.Id;
    }

    private static double CalculateDistanceInMeters(decimal lat1, decimal lon1, decimal lat2, decimal lon2)
    {
        const double R = 6371000.0; // Earth radius in meters
        double dLat = ToRadians((double)(lat2 - lat1));
        double dLon = ToRadians((double)(lon2 - lon1));

        double a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                   Math.Cos(ToRadians((double)lat1)) * Math.Cos(ToRadians((double)lat2)) *
                   Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

        double c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return R * c;
    }

    private static double ToRadians(double degrees)
    {
        return degrees * (Math.PI / 180.0);
    }
}
