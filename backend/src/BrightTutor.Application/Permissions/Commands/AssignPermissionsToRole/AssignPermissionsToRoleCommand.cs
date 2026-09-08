using BrightTutor.Domain.Enums;
using MediatR;

namespace BrightTutor.Application.Permissions.Commands.AssignPermissionsToRole;

public class AssignPermissionsToRoleCommand : IRequest<bool>
{
    public UserRole Role { get; set; }
    public List<string> PermissionCodes { get; set; } = [];
}
