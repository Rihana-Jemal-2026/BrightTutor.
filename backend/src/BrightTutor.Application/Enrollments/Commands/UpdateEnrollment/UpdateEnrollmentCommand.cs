using MediatR;

namespace BrightTutor.Application.Enrollments.Commands.UpdateEnrollment;

public class UpdateEnrollmentCommand : IRequest<bool>
{
    public Guid EnrollmentId { get; set; }
    public Guid? CourseId { get; set; }
    public Guid? ClassGroupId { get; set; }
    public bool IsActive { get; set; } = true;
}
