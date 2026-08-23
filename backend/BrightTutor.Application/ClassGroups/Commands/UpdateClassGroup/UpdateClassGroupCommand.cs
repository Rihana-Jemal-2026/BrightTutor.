using MediatR;

namespace BrightTutor.Application.ClassGroups.Commands.UpdateClassGroup;

public class UpdateClassGroupCommand : IRequest<bool>
{
    public Guid ClassGroupId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int MaximumStudents { get; set; }
    public bool IsActive { get; set; }
}
