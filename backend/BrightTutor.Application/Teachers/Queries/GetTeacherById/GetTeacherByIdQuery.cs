using BrightTutor.Application.Teachers.Queries.GetTeachersList;
using MediatR;

namespace BrightTutor.Application.Teachers.Queries.GetTeacherById;

public class GetTeacherByIdQuery : IRequest<TeacherDto?>
{
    public Guid TeacherId { get; set; }
}
