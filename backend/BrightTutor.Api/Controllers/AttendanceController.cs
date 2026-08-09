using BrightTutor.Application.Attendance.Commands.MarkGroupAttendance;
using BrightTutor.Application.Attendance.Queries.GetGroupAttendance;
using BrightTutor.Application.Attendance.Commands.MarkTeacherAttendance;
using BrightTutor.Application.Attendance.Commands.CheckInHomeAttendance;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using BrightTutor.Application.Attendance.Queries.GetTeacherAttendance;
using BrightTutor.Application.Attendance.Queries.GetHomeAttendance;
using BrightTutor.Application.Attendance.Commands.CheckOutHomeAttendance;

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
[HttpGet("teacher")]
public async Task<ActionResult<List<GetTeacherAttendanceResponse>>> GetTeacherAttendance(
    [FromQuery] Guid teacherId, [FromQuery] DateOnly attendanceDate)
{
    var result = await _mediator.Send(new GetTeacherAttendanceQuery
    {
        TeacherId = teacherId,
        AttendanceDate = attendanceDate
    });
    return Ok(result);
}

[HttpGet("home")]
public async Task<ActionResult<List<GetHomeAttendanceResponse>>> GetHomeAttendance(
    [FromQuery] Guid studentId, [FromQuery] DateOnly attendanceDate)
{
    var result = await _mediator.Send(new GetHomeAttendanceQuery
    {
        StudentId = studentId,
        AttendanceDate = attendanceDate
    });
    return Ok(result);
}
[HttpPost("home/checkout")]
public async Task<IActionResult> CheckOutHomeAttendance([FromBody] CheckOutHomeAttendanceCommand command)
{
    var success = await _mediator.Send(command);
    if (!success)
        return NotFound("Attendance record not found for check-out.");

    return Ok(new { message = "Checked out successfully." });
}
}