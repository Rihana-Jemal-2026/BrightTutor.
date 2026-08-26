using BrightTutor.Application.Announcements.Commands.CreateAnnouncement;
using BrightTutor.Application.Announcements.Queries.GetAnnouncementsList;
using BrightTutor.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BrightTutor.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AnnouncementsController : ControllerBase
{
    private readonly IMediator _mediator;

    public AnnouncementsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<CreateAnnouncementResponse>> CreateAnnouncement([FromBody] CreateAnnouncementCommand command)
    {
        var result = await _mediator.Send(command);
        return Ok(result);
    }

    [HttpGet]
    public async Task<ActionResult<List<AnnouncementDto>>> GetAnnouncements([FromQuery] UserRole? targetRole)
    {
        var result = await _mediator.Send(new GetAnnouncementsListQuery { TargetRole = targetRole });
        return Ok(result);
    }
}
