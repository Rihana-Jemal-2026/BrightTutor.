using MediatR;

namespace BrightTutor.Application.TeacherAssignments.Commands.UpdateTeacherAssignment;

public class UpdateTeacherAssignmentCommand : IRequest<bool>
{
    public Guid AssignmentId { get; set; }
    public Guid TeacherId { get; set; }
    public Guid CourseId { get; set; }
    public Guid? ClassGroupId { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}
