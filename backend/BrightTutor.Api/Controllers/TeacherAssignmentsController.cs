using BrightTutor.Application.TeacherAssignments.Commands.AssignTeacher;
using BrightTutor.Application.TeacherAssignments.Commands.RemoveTeacherAssignment;
using BrightTutor.Application.TeacherAssignments.Commands.UpdateTeacherAssignment;
using BrightTutor.Application.TeacherAssignments.Queries.GetTeacherAssignments;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BrightTutor.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TeacherAssignmentsController : ControllerBase
{
    private readonly IMediator _mediator;

    public TeacherAssignmentsController(IMediator mediator)
    {
        _mediator = mediator;
    }


    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<AssignTeacherResponse>> AssignTeacher([FromBody] AssignTeacherCommand command)
    {
        var result = await _mediator.Send(command);
        return Ok(result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateTeacherAssignment(Guid id, [FromBody] UpdateTeacherAssignmentCommand command)
    {
        command.AssignmentId = id;
        var success = await _mediator.Send(command);
        if (!success) return NotFound();
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> RemoveTeacherAssignment(Guid id)
    {
        var success = await _mediator.Send(new RemoveTeacherAssignmentCommand { AssignmentId = id });
        if (!success) return NotFound();
        return NoContent();
    }

    [HttpGet]
    [Authorize(Roles = "Admin,Teacher")]
    public async Task<ActionResult<List<TeacherAssignmentDto>>> GetTeacherAssignments(
        [FromQuery] Guid? teacherId,
        [FromQuery] Guid? courseId,
        [FromQuery] Guid? classGroupId)
    {
        var result = await _mediator.Send(new GetTeacherAssignmentsQuery { TeacherId = teacherId, CourseId = courseId, ClassGroupId = classGroupId });
        return Ok(result);
    }

    [HttpGet("teacher/{teacherId:guid}")]
    public async Task<ActionResult<List<TeacherAssignmentDto>>> GetAssignmentsByTeacher(Guid teacherId)
    {
        var result = await _mediator.Send(new GetTeacherAssignmentsQuery { TeacherId = teacherId });
        return Ok(result);
    }
}
