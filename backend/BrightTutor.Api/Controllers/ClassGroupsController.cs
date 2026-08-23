using BrightTutor.Application.ClassGroups.Commands.CreateClassGroup;
using BrightTutor.Application.ClassGroups.Commands.ToggleClassGroupStatus;
using BrightTutor.Application.ClassGroups.Commands.UpdateClassGroup;
using BrightTutor.Application.ClassGroups.Queries.GetClassGroupById;
using BrightTutor.Application.ClassGroups.Queries.GetClassGroupsList;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace BrightTutor.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ClassGroupsController : ControllerBase
{
    private readonly IMediator _mediator;

    public ClassGroupsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost]
    public async Task<ActionResult<CreateClassGroupResponse>> CreateClassGroup([FromBody] CreateClassGroupCommand command)
    {
        var result = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetClassGroupById), new { id = result.Id }, result);
    }

    [HttpGet]
    public async Task<ActionResult<List<ClassGroupDto>>> GetClassGroups([FromQuery] Guid? courseId)
    {
        var result = await _mediator.Send(new GetClassGroupsListQuery { CourseId = courseId });
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ClassGroupDto>> GetClassGroupById(Guid id)
    {
        var result = await _mediator.Send(new GetClassGroupByIdQuery { ClassGroupId = id });
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateClassGroup(Guid id, [FromBody] UpdateClassGroupCommand command)
    {
        command.ClassGroupId = id;
        var success = await _mediator.Send(command);
        if (!success) return NotFound();
        return NoContent();
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> ToggleClassGroupStatus(Guid id, [FromBody] ToggleClassGroupStatusCommand command)
    {
        command.ClassGroupId = id;
        var success = await _mediator.Send(command);
        if (!success) return NotFound();
        return NoContent();
    }
}
