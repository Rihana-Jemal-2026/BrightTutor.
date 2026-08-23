using BrightTutor.Domain.Enums;
using MediatR;

namespace BrightTutor.Application.Permissions.Queries.GetRolePermissions;

public class GetRolePermissionsQuery : IRequest<List<string>>
{
    public UserRole Role { get; set; }
}
