using BrightTutor.Application.Abstractions.Persistence;
using BrightTutor.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Application.Permissions.Commands.AssignPermissionsToRole;

public class AssignPermissionsToRoleHandler : IRequestHandler<AssignPermissionsToRoleCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public AssignPermissionsToRoleHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(AssignPermissionsToRoleCommand request, CancellationToken cancellationToken)
    {
        // 1. Remove existing role permissions for this role
        var existing = await _context.RolePermissions
            .Where(rp => rp.Role == request.Role)
            .ToListAsync(cancellationToken);

        _context.RolePermissions.RemoveRange(existing);

        // 2. Fetch permission IDs for the requested permission codes
        var matchingPermissions = await _context.Permissions
            .Where(p => request.PermissionCodes.Contains(p.Code))
            .ToListAsync(cancellationToken);

        // 3. Add new role permission entries
        var newEntries = matchingPermissions.Select(p => new RolePermission
        {
            Role = request.Role,
            PermissionId = p.Id
        }).ToList();

        _context.RolePermissions.AddRange(newEntries);
        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
