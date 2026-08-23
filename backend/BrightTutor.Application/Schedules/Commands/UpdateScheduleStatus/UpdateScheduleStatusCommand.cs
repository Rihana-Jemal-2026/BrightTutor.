using BrightTutor.Domain.Enums;
using MediatR;

namespace BrightTutor.Application.Schedules.Commands.UpdateScheduleStatus;

public class UpdateScheduleStatusCommand : IRequest<bool>
{
    public Guid ScheduleId { get; set; }
    public ScheduleStatus Status { get; set; }
}
