using BrightTutor.Application.Permissions.Commands.AssignPermissionsToRole;
using BrightTutor.Application.Permissions.Queries.GetPermissionsList;
using BrightTutor.Application.Permissions.Queries.GetRolePermissions;
using BrightTutor.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BrightTutor.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class PermissionsController : ControllerBase
{
    private readonly IMediator _mediator;

    public PermissionsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<ActionResult<List<PermissionDto>>> GetPermissions()
    {
        var result = await _mediator.Send(new GetPermissionsListQuery());
        return Ok(result);
    }

    [HttpGet("roles/{role}")]
    public async Task<ActionResult<List<string>>> GetRolePermissions(UserRole role)
    {
        var result = await _mediator.Send(new GetRolePermissionsQuery { Role = role });
        return Ok(result);
    }

    [HttpPost("roles/{role}")]
    public async Task<IActionResult> AssignPermissionsToRole(UserRole role, [FromBody] List<string> permissionCodes)
    {
        var success = await _mediator.Send(new AssignPermissionsToRoleCommand
        {
            Role = role,
            PermissionCodes = permissionCodes
        });

        if (!success) return BadRequest();
        return NoContent();
    }
}
