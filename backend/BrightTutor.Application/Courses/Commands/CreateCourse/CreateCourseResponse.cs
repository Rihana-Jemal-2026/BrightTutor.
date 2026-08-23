using BrightTutor.Domain.Enums;

namespace BrightTutor.Application.Courses.Commands.CreateCourse;

public class CreateCourseResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public ServiceType ServiceType { get; set; }
    public bool IsActive { get; set; }
}
