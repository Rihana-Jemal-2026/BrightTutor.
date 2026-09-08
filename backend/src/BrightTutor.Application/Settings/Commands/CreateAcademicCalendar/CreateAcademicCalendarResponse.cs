namespace BrightTutor.Application.Settings.Commands.CreateAcademicCalendar;

public class CreateAcademicCalendarResponse
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsActive { get; set; }
}
