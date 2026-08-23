using BrightTutor.Domain.Enums;
using MediatR;

namespace BrightTutor.Application.Courses.Commands.CreateCourse;

public class CreateCourseCommand : IRequest<CreateCourseResponse>
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public ServiceType ServiceType { get; set; }
}
