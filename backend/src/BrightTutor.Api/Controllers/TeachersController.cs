using BrightTutor.Application.Teachers.Commands.CreateTeacher;
using BrightTutor.Application.Teachers.Queries.GetTeacherById;
using BrightTutor.Application.Teachers.Queries.GetTeachersList;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace BrightTutor.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TeachersController : ControllerBase
{
    private readonly IMediator _mediator;

    public TeachersController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost]
    public async Task<ActionResult<CreateTeacherResponse>> CreateTeacher([FromBody] CreateTeacherCommand command)
    {
        var result = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetTeacherById), new { id = result.TeacherId }, result);
    }

    [HttpGet]
    public async Task<ActionResult<List<TeacherDto>>> GetTeachers([FromQuery] string? specialization)
    {
        var result = await _mediator.Send(new GetTeachersListQuery { Specialization = specialization });
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<TeacherDto>> GetTeacherById(Guid id)
    {
        var result = await _mediator.Send(new GetTeacherByIdQuery { TeacherId = id });
        if (result == null) return NotFound();
        return Ok(result);
    }
}
