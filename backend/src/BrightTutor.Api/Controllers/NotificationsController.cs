using BrightTutor.Application.Notifications.Commands.MarkNotificationAsRead;
using BrightTutor.Application.Notifications.Commands.SendNotification;
using BrightTutor.Application.Notifications.Queries.GetUserNotifications;
using BrightTutor.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace BrightTutor.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NotificationsController : ControllerBase
{
    private readonly IMediator _mediator;

    public NotificationsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost]
    public async Task<ActionResult<SendNotificationResponse>> SendNotification([FromBody] SendNotificationCommand command)
    {
        var result = await _mediator.Send(command);
        return Ok(result);
    }

    [HttpPatch("{id:guid}/read")]
    public async Task<IActionResult> MarkNotificationAsRead(Guid id)
    {
        var success = await _mediator.Send(new MarkNotificationAsReadCommand { NotificationId = id });
        if (!success) return NotFound();
        return NoContent();
    }

    [HttpGet("user/{userId:guid}")]
    public async Task<ActionResult<List<NotificationDto>>> GetUserNotifications(Guid userId, [FromQuery] NotificationStatus? status)
    {
        var result = await _mediator.Send(new GetUserNotificationsQuery { UserId = userId, Status = status });
        return Ok(result);
    }
}
