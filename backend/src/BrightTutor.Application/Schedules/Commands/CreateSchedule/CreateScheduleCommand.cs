using BrightTutor.Domain.Enums;
using MediatR;

namespace BrightTutor.Application.Schedules.Commands.CreateSchedule;

public class CreateScheduleCommand : IRequest<CreateScheduleResponse>
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
}
