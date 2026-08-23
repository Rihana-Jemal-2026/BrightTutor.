using BrightTutor.Domain.Enums;
using MediatR;

namespace BrightTutor.Application.Schedules.Commands.UpdateSchedule;

public class UpdateScheduleCommand : IRequest<bool>
{
    public Guid ScheduleId { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string? MeetingLink { get; set; }
    public string? LocationAddress { get; set; }
    public ScheduleStatus Status { get; set; }
}
