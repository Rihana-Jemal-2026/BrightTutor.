using BrightTutor.Domain.Enums;

namespace BrightTutor.Application.Courses.Queries.GetCoursesList;

public class CourseDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public ServiceType ServiceType { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}
