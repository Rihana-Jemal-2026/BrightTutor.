using BrightTutor.Application.Enrollments.Commands.EnrollStudent;
using BrightTutor.Application.Enrollments.Commands.UnenrollStudent;
using BrightTutor.Application.Enrollments.Queries.GetCourseEnrollments;
using BrightTutor.Application.Enrollments.Queries.GetStudentEnrollments;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace BrightTutor.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EnrollmentsController : ControllerBase
{
    private readonly IMediator _mediator;

    public EnrollmentsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost]
    public async Task<ActionResult<EnrollStudentResponse>> EnrollStudent([FromBody] EnrollStudentCommand command)
    {
        var result = await _mediator.Send(command);
        return Ok(result);
    }

    [HttpPatch("{id:guid}/unenroll")]
    public async Task<IActionResult> UnenrollStudent(Guid id)
    {
        var success = await _mediator.Send(new UnenrollStudentCommand { EnrollmentId = id });
        if (!success) return NotFound();
        return NoContent();
    }

    [HttpGet("student/{studentId:guid}")]
    public async Task<ActionResult<List<EnrollmentDto>>> GetStudentEnrollments(Guid studentId)
    {
        var result = await _mediator.Send(new GetStudentEnrollmentsQuery { StudentId = studentId });
        return Ok(result);
    }

    [HttpGet("course/{courseId:guid}")]
    public async Task<ActionResult<List<EnrollmentDto>>> GetCourseEnrollments(Guid courseId, [FromQuery] Guid? classGroupId)
    {
        var result = await _mediator.Send(new GetCourseEnrollmentsQuery { CourseId = courseId, ClassGroupId = classGroupId });
        return Ok(result);
    }
}
