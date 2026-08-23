using MediatR;

namespace BrightTutor.Application.Teachers.Queries.GetTeachersList;

public class GetTeachersListQuery : IRequest<List<TeacherDto>>
{
    public string? Specialization { get; set; }
}
