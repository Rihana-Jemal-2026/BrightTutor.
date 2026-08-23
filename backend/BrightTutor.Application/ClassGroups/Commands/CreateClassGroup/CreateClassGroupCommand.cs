using MediatR;

namespace BrightTutor.Application.ClassGroups.Commands.CreateClassGroup;

public class CreateClassGroupCommand : IRequest<CreateClassGroupResponse>
{
    public Guid CourseId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int MaximumStudents { get; set; } = 30;
}
