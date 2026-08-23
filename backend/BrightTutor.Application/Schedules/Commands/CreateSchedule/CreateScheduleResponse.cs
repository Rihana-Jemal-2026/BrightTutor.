using BrightTutor.Domain.Enums;

namespace BrightTutor.Application.Schedules.Commands.CreateSchedule;

public class CreateScheduleResponse
{
    public Guid Id { get; set; }
    public Guid CourseId { get; set; }
    public Guid TeacherId { get; set; }
    public Guid? ClassGroupId { get; set; }
    public Guid? StudentId { get; set; }
    public ServiceType ServiceType { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public ScheduleStatus Status { get; set; }
}
