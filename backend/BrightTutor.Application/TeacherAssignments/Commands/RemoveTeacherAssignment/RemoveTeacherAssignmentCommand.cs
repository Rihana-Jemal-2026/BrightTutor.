using MediatR;

namespace BrightTutor.Application.TeacherAssignments.Commands.RemoveTeacherAssignment;

public class RemoveTeacherAssignmentCommand : IRequest<bool>
{
    public Guid AssignmentId { get; set; }
}
