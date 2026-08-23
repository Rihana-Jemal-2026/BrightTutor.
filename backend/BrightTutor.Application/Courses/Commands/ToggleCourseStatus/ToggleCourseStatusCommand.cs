using MediatR;

namespace BrightTutor.Application.Courses.Commands.ToggleCourseStatus;

public class ToggleCourseStatusCommand : IRequest<bool>
{
    public Guid CourseId { get; set; }
    public bool IsActive { get; set; }
}
