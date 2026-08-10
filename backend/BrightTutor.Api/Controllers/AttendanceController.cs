using BrightTutor.Application.Attendance.Commands.MarkGroupAttendance;
using BrightTutor.Application.Attendance.Queries.GetGroupAttendance;
using BrightTutor.Application.Attendance.Commands.MarkTeacherAttendance;
using BrightTutor.Application.Attendance.Commands.CheckInHomeAttendance;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using BrightTutor.Application.Attendance.Queries.GetTeacherAttendance;
using BrightTutor.Application.Attendance.Queries.GetHomeAttendance;
using BrightTutor.Application.Attendance.Commands.CheckOutHomeAttendance;
using BrightTutor.Application.Attendance.Commands.MarkOnlineAttendance;
using BrightTutor.Application.Attendance.Queries.GetOnlineAttendance;
using FluentValidation;
using BrightTutor.Application.Attendance.Queries.GetStudentAttendanceSummary;
using BrightTutor.Application.Attendance.Commands.VerifyHomeAttendance;
using BrightTutor.Application.Attendance.Queries.GetClassAttendanceReport;
using BrightTutor.Application.Attendance.Commands.UpdateAttendance;
using BrightTutor.Application.Attendance.Queries.GetTeacherAttendanceReport;

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
        try
        {
            var result = await _mediator.Send(command);
            return Ok(result);
        }
        catch (ValidationException ex)
        {
            return BadRequest(ex.Errors.Select(e => e.ErrorMessage));
        }
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

    [HttpPost("home/checkin")]
    public async Task<ActionResult<Guid>> CheckInHomeAttendance([FromBody] CheckInHomeAttendanceCommand command)
    {
        var result = await _mediator.Send(command);
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

    [HttpPost("online")]
    public async Task<ActionResult<Guid>> MarkOnlineAttendance([FromBody] MarkOnlineAttendanceCommand command)
    {
        var result = await _mediator.Send(command);
        return Ok(result);
    }

    [HttpGet("online")]
    public async Task<ActionResult<List<GetOnlineAttendanceResponse>>> GetOnlineAttendance(
        [FromQuery] Guid classGroupId, [FromQuery] DateOnly attendanceDate)
    {
        var result = await _mediator.Send(new GetOnlineAttendanceQuery
        {
            ClassGroupId = classGroupId,
            AttendanceDate = attendanceDate
        });
        return Ok(result);
    }
[HttpGet("student-summary")]
public async Task<ActionResult<GetStudentAttendanceSummaryResponse>> GetStudentAttendanceSummary(
    [FromQuery] Guid studentId, [FromQuery] DateOnly startDate, [FromQuery] DateOnly endDate)
{
    var result = await _mediator.Send(new GetStudentAttendanceSummaryQuery
    {
        StudentId = studentId,
        StartDate = startDate,
        EndDate = endDate
    });
    return Ok(result);
}
[HttpPost("home/verify")]
public async Task<IActionResult> VerifyHomeAttendance([FromBody] VerifyHomeAttendanceCommand command)
{
    var success = await _mediator.Send(command);
    if (!success)
        return NotFound("Home attendance record not found.");

    return Ok(new { message = "Verification updated." });
}
[HttpGet("class-report")]
public async Task<ActionResult<GetClassAttendanceReportResponse>> GetClassAttendanceReport(
    [FromQuery] Guid classGroupId, [FromQuery] DateOnly startDate, [FromQuery] DateOnly endDate)
{
    var result = await _mediator.Send(new GetClassAttendanceReportQuery
    {
        ClassGroupId = classGroupId,
        StartDate = startDate,
        EndDate = endDate
    });
    return Ok(result);
}
[HttpPut("{attendanceId}")]
public async Task<IActionResult> UpdateAttendance(Guid attendanceId, [FromBody] UpdateAttendanceCommand command)
{
    if (attendanceId != command.AttendanceId)
        command.AttendanceId = attendanceId;

    var success = await _mediator.Send(command);
    if (!success)
        return NotFound("Attendance record not found.");

    return Ok(new { message = "Attendance record updated." });
}
[HttpGet("teacher-report")]
public async Task<ActionResult<GetTeacherAttendanceReportResponse>> GetTeacherAttendanceReport(
    [FromQuery] Guid teacherId, [FromQuery] DateOnly startDate, [FromQuery] DateOnly endDate)
{
    var result = await _mediator.Send(new GetTeacherAttendanceReportQuery
    {
        TeacherId = teacherId,
        StartDate = startDate,
        EndDate = endDate
    });
    return Ok(result);
}
}