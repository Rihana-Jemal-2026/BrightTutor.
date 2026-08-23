using MediatR;

namespace BrightTutor.Application.Enrollments.Commands.EnrollStudent;

public class EnrollStudentCommand : IRequest<EnrollStudentResponse>
{
    public Guid StudentId { get; set; }
    public Guid CourseId { get; set; }
    public Guid? ClassGroupId { get; set; }
}
