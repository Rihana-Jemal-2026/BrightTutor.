using MediatR;

namespace BrightTutor.Application.Enrollments.Queries.GetStudentEnrollments;

public class GetStudentEnrollmentsQuery : IRequest<List<EnrollmentDto>>
{
    public Guid StudentId { get; set; }
}
