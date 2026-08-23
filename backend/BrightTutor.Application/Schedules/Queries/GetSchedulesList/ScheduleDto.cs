using BrightTutor.Domain.Enums;

namespace BrightTutor.Application.Schedules.Queries.GetSchedulesList;

public class ScheduleDto
{
    public Guid Id { get; set; }
    public Guid CourseId { get; set; }
    public string CourseName { get; set; } = string.Empty;

    public Guid TeacherId { get; set; }
    public string TeacherCode { get; set; } = string.Empty;
    public string TeacherName { get; set; } = string.Empty;

    public Guid? ClassGroupId { get; set; }
    public string? ClassGroupName { get; set; }

    public Guid? StudentId { get; set; }
    public string? StudentCode { get; set; }
    public string? StudentName { get; set; }

    public ServiceType ServiceType { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }

    public string? MeetingLink { get; set; }
    public string? LocationAddress { get; set; }
    public ScheduleStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
}
