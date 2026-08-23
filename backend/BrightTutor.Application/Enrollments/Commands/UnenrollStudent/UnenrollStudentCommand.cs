using MediatR;

namespace BrightTutor.Application.Enrollments.Commands.UnenrollStudent;

public class UnenrollStudentCommand : IRequest<bool>
{
    public Guid EnrollmentId { get; set; }
}
