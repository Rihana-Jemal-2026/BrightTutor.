using BrightTutor.Application.Attendance.Commands.MarkGroupAttendance;
using BrightTutor.Application.Attendance.Queries.GetGroupAttendance;
using BrightTutor.Application.Attendance.Commands.MarkTeacherAttendance;
using BrightTutor.Application.Attendance.Commands.CheckInHomeAttendance;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace BrightTutor.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AttendanceController : ControllerBase
{
    private readonly IMediator _mediator;

    public AttendanceController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost("group")]
    public async Task<ActionResult<MarkGroupAttendanceResponse>> MarkGroupAttendance(
        [FromBody] MarkGroupAttendanceCommand command)
    {
        var result = await _mediator.Send(command);
        return Ok(result);
    }

    [HttpGet("group")]
    public async Task<ActionResult<List<GetGroupAttendanceResponse>>> GetGroupAttendance(
        [FromQuery] Guid classGroupId, [FromQuery] DateOnly attendanceDate)
    {
        var result = await _mediator.Send(new GetGroupAttendanceQuery
        {
            ClassGroupId = classGroupId,
            AttendanceDate = attendanceDate
        });
        return Ok(result);
    }

    [HttpPost("teacher")]
    public async Task<ActionResult<Guid>> MarkTeacherAttendance([FromBody] MarkTeacherAttendanceCommand command)
    {
        var result = await _mediator.Send(command);
        return Ok(result);
    }

    [HttpPost("home/checkin")]
    public async Task<ActionResult<Guid>> CheckInHomeAttendance([FromBody] CheckInHomeAttendanceCommand command)
    {
        var result = await _mediator.Send(command);
        return Ok(result);
    }
}