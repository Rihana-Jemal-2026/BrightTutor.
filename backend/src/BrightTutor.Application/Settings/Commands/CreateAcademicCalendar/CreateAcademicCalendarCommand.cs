using MediatR;

namespace BrightTutor.Application.Settings.Commands.CreateAcademicCalendar;

public class CreateAcademicCalendarCommand : IRequest<CreateAcademicCalendarResponse>
{
    public string Title { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsActive { get; set; } = true;
}
