using BrightTutor.Application.Enrollments.Commands.EnrollStudent;
using BrightTutor.Application.Enrollments.Commands.UnenrollStudent;
using BrightTutor.Application.Enrollments.Commands.UpdateEnrollment;
using BrightTutor.Application.Enrollments.Queries.GetCourseEnrollments;
using BrightTutor.Application.Enrollments.Queries.GetStudentEnrollments;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BrightTutor.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EnrollmentsController : ControllerBase
{
    private readonly IMediator _mediator;

    public EnrollmentsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    [Authorize]
    public async Task<ActionResult<List<EnrollmentDto>>> GetEnrollments([FromQuery] Guid? courseId, [FromQuery] Guid? classGroupId, [FromQuery] Guid? studentId)
    {
        var result = await _mediator.Send(new GetCourseEnrollmentsQuery { CourseId = courseId, ClassGroupId = classGroupId, StudentId = studentId });
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<EnrollStudentResponse>> EnrollStudent([FromBody] EnrollStudentCommand command)
    {
        var result = await _mediator.Send(command);
        return Ok(result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateEnrollment(Guid id, [FromBody] UpdateEnrollmentCommand command)
    {
        command.EnrollmentId = id;
        var success = await _mediator.Send(command);
        if (!success) return NotFound();
        return NoContent();
    }

    [HttpPatch("{id:guid}/unenroll")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UnenrollStudent(Guid id)
    {
        var success = await _mediator.Send(new UnenrollStudentCommand { EnrollmentId = id });
        if (!success) return NotFound();
        return NoContent();
    }

    [HttpGet("student/{studentId:guid}")]
    [Authorize]
    public async Task<ActionResult<List<EnrollmentDto>>> GetStudentEnrollments(Guid studentId)
    {
        var result = await _mediator.Send(new GetStudentEnrollmentsQuery { StudentId = studentId });
        return Ok(result);
    }

    [HttpGet("course/{courseId:guid}")]
    [Authorize]
    public async Task<ActionResult<List<EnrollmentDto>>> GetCourseEnrollments(Guid courseId, [FromQuery] Guid? classGroupId)
    {
        var result = await _mediator.Send(new GetCourseEnrollmentsQuery { CourseId = courseId, ClassGroupId = classGroupId });
        return Ok(result);
    }
}
