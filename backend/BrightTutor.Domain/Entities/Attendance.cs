using BrightTutor.Domain.Common;
using BrightTutor.Domain.Enums;

namespace BrightTutor.Domain.Entities;

public class Attendance : BaseEntity
{
    public Guid StudentId { get; set; }
    public Guid TeacherId { get; set; }
    public Guid ClassGroupId { get; set; }
    public Guid? ScheduleId { get; set; }

    public AttendanceType AttendanceType { get; set; }
    public AttendanceStatus Status { get; set; }

    public DateOnly AttendanceDate { get; set; }
    public DateTime? CheckInTime { get; set; }
    public DateTime? CheckOutTime { get; set; }

    public string? Notes { get; set; }
    public string? LessonCovered { get; set; }

    public Student Student { get; set; } = null!;
    public Teacher Teacher { get; set; } = null!;
    public ClassGroup ClassGroup { get; set; } = null!;
    public Schedule? Schedule { get; set; }
}