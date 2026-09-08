using MediatR;

namespace BrightTutor.Application.Settings.Queries.GetAcademicCalendars;

public class GetAcademicCalendarsQuery : IRequest<List<AcademicCalendarDto>>
{
    public bool? IsActive { get; set; }
}
