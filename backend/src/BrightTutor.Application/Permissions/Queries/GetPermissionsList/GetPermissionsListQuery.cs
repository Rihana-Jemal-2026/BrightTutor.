using MediatR;

namespace BrightTutor.Application.Permissions.Queries.GetPermissionsList;

public class GetPermissionsListQuery : IRequest<List<PermissionDto>>
{
}
