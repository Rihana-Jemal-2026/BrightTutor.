using BrightTutor.Application.Abstractions.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Application.Permissions.Queries.GetRolePermissions;

public class GetRolePermissionsHandler : IRequestHandler<GetRolePermissionsQuery, List<string>>
{
    private readonly IApplicationDbContext _context;

    public GetRolePermissionsHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<string>> Handle(GetRolePermissionsQuery request, CancellationToken cancellationToken)
    {
        return await _context.RolePermissions
            .Where(rp => rp.Role == request.Role)
            .Include(rp => rp.Permission)
            .Select(rp => rp.Permission.Code)
            .ToListAsync(cancellationToken);
    }
}
