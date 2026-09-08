using BrightTutor.Domain.Enums;

namespace BrightTutor.Application.Notifications.Commands.SendNotification;

public class SendNotificationResponse
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public NotificationType Type { get; set; }
    public NotificationStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
}
