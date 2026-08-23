using BrightTutor.Application.TeacherAssignments.Commands.AssignTeacher;
using BrightTutor.Application.TeacherAssignments.Commands.RemoveTeacherAssignment;
using BrightTutor.Application.TeacherAssignments.Queries.GetTeacherAssignments;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace BrightTutor.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TeacherAssignmentsController : ControllerBase
{
    private readonly IMediator _mediator;

    public TeacherAssignmentsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost]
    public async Task<ActionResult<AssignTeacherResponse>> AssignTeacher([FromBody] AssignTeacherCommand command)
    {
        var result = await _mediator.Send(command);
        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> RemoveTeacherAssignment(Guid id)
    {
        var success = await _mediator.Send(new RemoveTeacherAssignmentCommand { AssignmentId = id });
        if (!success) return NotFound();
        return NoContent();
    }

    [HttpGet("teacher/{teacherId:guid}")]
    public async Task<ActionResult<List<TeacherAssignmentDto>>> GetTeacherAssignments(Guid teacherId)
    {
        var result = await _mediator.Send(new GetTeacherAssignmentsQuery { TeacherId = teacherId });
        return Ok(result);
    }
}
