using BrightTutor.Domain.Common;
using BrightTutor.Domain.Enums;

namespace BrightTutor.Domain.Entities;

public class Attendance : BaseEntity
{
    public Guid StudentId { get; set; }
    public Guid TeacherId { get; set; }
    public Guid ClassGroupId { get; set; }

    public AttendanceType AttendanceType { get; set; }
    public AttendanceStatus Status { get; set; }

    public DateOnly AttendanceDate { get; set; }
    public DateTime? CheckInTime { get; set; }
    public DateTime? CheckOutTime { get; set; }

    public string? Notes { get; set; }
}