using BrightTutor.Domain.Enums;
using MediatR;

namespace BrightTutor.Application.Courses.Commands.UpdateCourse;

public class UpdateCourseCommand : IRequest<bool>
{
    public Guid CourseId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public ServiceType ServiceType { get; set; }
}
