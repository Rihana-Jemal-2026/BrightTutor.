using BrightTutor.Application.Abstractions.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Application.Permissions.Queries.GetPermissionsList;

public class GetPermissionsListHandler : IRequestHandler<GetPermissionsListQuery, List<PermissionDto>>
{
    private readonly IApplicationDbContext _context;

    public GetPermissionsListHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<PermissionDto>> Handle(GetPermissionsListQuery request, CancellationToken cancellationToken)
    {
        return await _context.Permissions
            .OrderBy(p => p.Module)
            .ThenBy(p => p.Name)
            .Select(p => new PermissionDto
            {
                Id = p.Id,
                Code = p.Code,
                Name = p.Name,
                Module = p.Module,
                Description = p.Description
            })
            .ToListAsync(cancellationToken);
    }
}
