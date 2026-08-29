using BrightTutor.Application.Enrollments.Queries.GetStudentEnrollments;
using MediatR;

namespace BrightTutor.Application.Enrollments.Queries.GetCourseEnrollments;

public class GetCourseEnrollmentsQuery : IRequest<List<EnrollmentDto>>
{
    public Guid? CourseId { get; set; }
    public Guid? ClassGroupId { get; set; }
}
