using BrightTutor.Domain.Common;
using BrightTutor.Domain.Enums;

namespace BrightTutor.Domain.Entities;

public class TeacherAttendance : BaseEntity
{
    public Guid TeacherId { get; set; }

    public DateOnly AttendanceDate { get; set; }
    public AttendanceStatus Status { get; set; }

    public DateTime? CheckInTime { get; set; }
    public DateTime? CheckOutTime { get; set; }

    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }

    public bool IsVerified { get; set; }
    public string? Notes { get; set; }
}