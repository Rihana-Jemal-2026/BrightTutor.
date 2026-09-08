using BrightTutor.Domain.Enums;
using MediatR;

namespace BrightTutor.Application.Courses.Queries.GetCoursesList;

public class GetCoursesListQuery : IRequest<List<CourseDto>>
{
    public ServiceType? ServiceType { get; set; }
    public bool? IsActive { get; set; }
}
