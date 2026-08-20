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
        var alreadySubmitted = await _context.Attendances
            .AnyAsync(a => a.StudentId == request.StudentId && a.ClassGroupId == request.ClassGroupId && a.AttendanceDate == request.AttendanceDate, cancellationToken);

        if (alreadySubmitted)
        {
            throw new InvalidOperationException($"Home visit attendance for this student on {request.AttendanceDate} has already been checked in today.");
        }

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

        var attendance = new Domain.Entities.Attendance
        {
            StudentId = request.StudentId,
            TeacherId = request.TeacherId,
            ClassGroupId = request.ClassGroupId,
            AttendanceType = AttendanceType.Home,
            Status = AttendanceStatus.Present,
            AttendanceDate = request.AttendanceDate,
            CheckInTime = DateTime.UtcNow,
            LessonCovered = request.LessonCovered
        };

        _context.Attendances.Add(attendance);
        await _context.SaveChangesAsync(cancellationToken);

        var homeDetail = new HomeAttendance
        {
            AttendanceId = attendance.Id,
            CheckInLatitude = request.CheckInLatitude,
            CheckInLongitude = request.CheckInLongitude,
            Address = request.Address,
            IsLocationVerified = isVerified
        };

        _context.HomeAttendances.Add(homeDetail);
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
