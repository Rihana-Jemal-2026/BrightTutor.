using MediatR;

namespace BrightTutor.Application.ClassGroups.Commands.ToggleClassGroupStatus;

public class ToggleClassGroupStatusCommand : IRequest<bool>
{
    public Guid ClassGroupId { get; set; }
    public bool IsActive { get; set; }
}
