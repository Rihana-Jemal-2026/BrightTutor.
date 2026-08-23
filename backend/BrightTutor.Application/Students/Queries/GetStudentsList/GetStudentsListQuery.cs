using MediatR;

namespace BrightTutor.Application.Students.Queries.GetStudentsList;

public class GetStudentsListQuery : IRequest<List<StudentDto>>
{
    public string? GradeLevel { get; set; }
}
