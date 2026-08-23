using BrightTutor.Application.Students.Queries.GetStudentsList;
using MediatR;

namespace BrightTutor.Application.Students.Queries.GetStudentById;

public class GetStudentByIdQuery : IRequest<StudentDto?>
{
    public Guid StudentId { get; set; }
}
