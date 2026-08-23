using BrightTutor.Application.Courses.Queries.GetCoursesList;
using MediatR;

namespace BrightTutor.Application.Courses.Queries.GetCourseById;

public class GetCourseByIdQuery : IRequest<CourseDto?>
{
    public Guid CourseId { get; set; }
}
