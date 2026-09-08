using BrightTutor.Application.Users.Commands.CreateUser;
using BrightTutor.Application.Users.Commands.UpdateUser;
using BrightTutor.Application.Users.Commands.UpdateUserStatus;
using BrightTutor.Application.Users.Queries.GetUserById;
using BrightTutor.Application.Users.Queries.GetUsersList;
using BrightTutor.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BrightTutor.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IMediator _mediator;

    public UsersController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<CreateUserResponse>> CreateUser([FromBody] CreateUserCommand command)
    {
        var result = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetUserById), new { id = result.Id }, result);
    }

    [HttpGet]
    [Authorize(Roles = "Admin,Teacher")]
    public async Task<ActionResult<List<UserDto>>> GetUsers([FromQuery] UserRole? role, [FromQuery] UserStatus? status)
    {
        var result = await _mediator.Send(new GetUsersListQuery { Role = role, Status = status });
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [Authorize]
    public async Task<ActionResult<UserDto>> GetUserById(Guid id)
    {
        var result = await _mediator.Send(new GetUserByIdQuery { UserId = id });
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateUser(Guid id, [FromBody] UpdateUserCommand command)
    {
        command.UserId = id;
        var success = await _mediator.Send(command);
        if (!success) return NotFound();
        return NoContent();
    }

    [HttpPatch("{id:guid}/status")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateUserStatus(Guid id, [FromBody] UserStatus status)
    {
        var success = await _mediator.Send(new UpdateUserStatusCommand { UserId = id, Status = status });
        if (!success) return NotFound();
        return NoContent();
    }
}
