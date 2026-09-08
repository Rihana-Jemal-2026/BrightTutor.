using MediatR;

namespace BrightTutor.Application.TeacherAssignments.Queries.GetTeacherAssignments;

public class GetTeacherAssignmentsQuery : IRequest<List<TeacherAssignmentDto>>
{
    public Guid? TeacherId { get; set; }
    public Guid? CourseId { get; set; }
    public Guid? ClassGroupId { get; set; }
}
