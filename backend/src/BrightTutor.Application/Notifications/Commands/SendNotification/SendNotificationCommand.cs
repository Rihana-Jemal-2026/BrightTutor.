using BrightTutor.Domain.Enums;
using MediatR;

namespace BrightTutor.Application.Notifications.Commands.SendNotification;

public class SendNotificationCommand : IRequest<SendNotificationResponse>
{
    public Guid UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public NotificationType Type { get; set; }
}
