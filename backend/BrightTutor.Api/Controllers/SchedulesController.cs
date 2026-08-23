using BrightTutor.Application.Schedules.Commands.CreateSchedule;
using BrightTutor.Application.Schedules.Commands.UpdateSchedule;
using BrightTutor.Application.Schedules.Commands.UpdateScheduleStatus;
using BrightTutor.Application.Schedules.Queries.GetScheduleById;
using BrightTutor.Application.Schedules.Queries.GetSchedulesList;
using BrightTutor.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace BrightTutor.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SchedulesController : ControllerBase
{
    private readonly IMediator _mediator;

    public SchedulesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost]
    public async Task<ActionResult<CreateScheduleResponse>> CreateSchedule([FromBody] CreateScheduleCommand command)
    {
        var result = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetScheduleById), new { id = result.Id }, result);
    }

    [HttpGet]
    public async Task<ActionResult<List<ScheduleDto>>> GetSchedules(
        [FromQuery] Guid? teacherId,
        [FromQuery] Guid? studentId,
        [FromQuery] Guid? courseId,
        [FromQuery] Guid? classGroupId,
        [FromQuery] ServiceType? serviceType,
        [FromQuery] ScheduleStatus? status,
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate)
    {
        var result = await _mediator.Send(new GetSchedulesListQuery
        {
            TeacherId = teacherId,
            StudentId = studentId,
            CourseId = courseId,
            ClassGroupId = classGroupId,
            ServiceType = serviceType,
            Status = status,
            FromDate = fromDate,
            ToDate = toDate
        });
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ScheduleDto>> GetScheduleById(Guid id)
    {
        var result = await _mediator.Send(new GetScheduleByIdQuery { ScheduleId = id });
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateSchedule(Guid id, [FromBody] UpdateScheduleCommand command)
    {
        command.ScheduleId = id;
        var success = await _mediator.Send(command);
        if (!success) return NotFound();
        return NoContent();
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> UpdateScheduleStatus(Guid id, [FromBody] ScheduleStatus status)
    {
        var success = await _mediator.Send(new UpdateScheduleStatusCommand { ScheduleId = id, Status = status });
        if (!success) return NotFound();
        return NoContent();
    }
}
