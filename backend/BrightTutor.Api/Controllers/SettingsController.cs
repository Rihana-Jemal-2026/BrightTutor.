using BrightTutor.Application.Settings.Commands.CreateAcademicCalendar;
using BrightTutor.Application.Settings.Commands.UpdateSystemSetting;
using BrightTutor.Application.Settings.Queries.GetAcademicCalendars;
using BrightTutor.Application.Settings.Queries.GetSystemSettings;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BrightTutor.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class SettingsController : ControllerBase
{
    private readonly IMediator _mediator;

    public SettingsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<ActionResult<List<SystemSettingDto>>> GetSettings()
    {
        var result = await _mediator.Send(new GetSystemSettingsQuery());
        return Ok(result);
    }

    [HttpPut]
    public async Task<IActionResult> UpdateSetting([FromBody] UpdateSystemSettingCommand command)
    {
        var success = await _mediator.Send(command);
        if (!success) return BadRequest();
        return NoContent();
    }

    [HttpGet("calendar")]
    public async Task<ActionResult<List<AcademicCalendarDto>>> GetAcademicCalendars([FromQuery] bool? isActive)
    {
        var result = await _mediator.Send(new GetAcademicCalendarsQuery { IsActive = isActive });
        return Ok(result);
    }

    [HttpPost("calendar")]
    public async Task<ActionResult<CreateAcademicCalendarResponse>> CreateAcademicCalendar([FromBody] CreateAcademicCalendarCommand command)
    {
        var result = await _mediator.Send(command);
        return Ok(result);
    }
}
