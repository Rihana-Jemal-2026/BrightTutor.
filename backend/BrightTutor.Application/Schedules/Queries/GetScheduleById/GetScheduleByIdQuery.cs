using BrightTutor.Application.Schedules.Queries.GetSchedulesList;
using MediatR;

namespace BrightTutor.Application.Schedules.Queries.GetScheduleById;

public class GetScheduleByIdQuery : IRequest<ScheduleDto?>
{
    public Guid ScheduleId { get; set; }
}
