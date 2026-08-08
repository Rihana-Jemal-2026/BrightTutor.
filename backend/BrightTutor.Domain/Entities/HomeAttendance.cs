using BrightTutor.Domain.Common;

namespace BrightTutor.Domain.Entities;

public class HomeAttendance : BaseEntity
{
    public Guid AttendanceId { get; set; }

    public decimal CheckInLatitude { get; set; }
    public decimal CheckInLongitude { get; set; }
    public decimal? CheckOutLatitude { get; set; }
    public decimal? CheckOutLongitude { get; set; }

    public string? Address { get; set; }
    public bool IsLocationVerified { get; set; }
    public decimal? DistanceFromStudentHomeInMeters { get; set; }
}