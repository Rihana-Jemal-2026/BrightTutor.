using BrightTutor.Domain.Common;

namespace BrightTutor.Domain.Entities;

public class AcademicCalendar : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsActive { get; set; } = true;
}
