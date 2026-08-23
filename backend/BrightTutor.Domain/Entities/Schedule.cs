using BrightTutor.Domain.Common;
using BrightTutor.Domain.Enums;

namespace BrightTutor.Domain.Entities;

public class Schedule : BaseEntity
{
    public Guid CourseId { get; set; }
    public Guid TeacherId { get; set; }
    public Guid? ClassGroupId { get; set; }
    public Guid? StudentId { get; set; }

    public ServiceType ServiceType { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }

    public string? MeetingLink { get; set; }
    public string? LocationAddress { get; set; }
    public ScheduleStatus Status { get; set; } = ScheduleStatus.Scheduled;

    public Course Course { get; set; } = null!;
    public Teacher Teacher { get; set; } = null!;
    public ClassGroup? ClassGroup { get; set; }
    public Student? Student { get; set; }
}
