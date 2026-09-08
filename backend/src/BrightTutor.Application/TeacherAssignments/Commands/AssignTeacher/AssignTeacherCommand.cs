using MediatR;

namespace BrightTutor.Application.TeacherAssignments.Commands.AssignTeacher;

public class AssignTeacherCommand : IRequest<AssignTeacherResponse>
{
    public Guid TeacherId { get; set; }
    public Guid CourseId { get; set; }
    public Guid? ClassGroupId { get; set; }
}
