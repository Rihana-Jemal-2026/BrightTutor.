using BrightTutor.Application.Courses.Commands.CreateCourse;
using BrightTutor.Application.Courses.Commands.ToggleCourseStatus;
using BrightTutor.Application.Courses.Commands.UpdateCourse;
using BrightTutor.Application.Courses.Queries.GetCourseById;
using BrightTutor.Application.Courses.Queries.GetCoursesList;
using BrightTutor.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace BrightTutor.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CoursesController : ControllerBase
{
    private readonly IMediator _mediator;

    public CoursesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost]
    public async Task<ActionResult<CreateCourseResponse>> CreateCourse([FromBody] CreateCourseCommand command)
    {
        var result = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetCourseById), new { id = result.Id }, result);
    }

    [HttpGet]
    public async Task<ActionResult<List<CourseDto>>> GetCourses([FromQuery] ServiceType? serviceType, [FromQuery] bool? isActive)
    {
        var result = await _mediator.Send(new GetCoursesListQuery { ServiceType = serviceType, IsActive = isActive });
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<CourseDto>> GetCourseById(Guid id)
    {
        var result = await _mediator.Send(new GetCourseByIdQuery { CourseId = id });
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateCourse(Guid id, [FromBody] UpdateCourseCommand command)
    {
        command.CourseId = id;
        var success = await _mediator.Send(command);
        if (!success) return NotFound();
        return NoContent();
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> ToggleCourseStatus(Guid id, [FromBody] ToggleCourseStatusCommand command)
    {
        command.CourseId = id;
        var success = await _mediator.Send(command);
        if (!success) return NotFound();
        return NoContent();
    }
}
