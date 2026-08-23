using BrightTutor.Domain.Enums;
using MediatR;

namespace BrightTutor.Application.Schedules.Queries.GetSchedulesList;

public class GetSchedulesListQuery : IRequest<List<ScheduleDto>>
{
    public Guid? TeacherId { get; set; }
    public Guid? StudentId { get; set; }
    public Guid? CourseId { get; set; }
    public Guid? ClassGroupId { get; set; }
    public ServiceType? ServiceType { get; set; }
    public ScheduleStatus? Status { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
}
