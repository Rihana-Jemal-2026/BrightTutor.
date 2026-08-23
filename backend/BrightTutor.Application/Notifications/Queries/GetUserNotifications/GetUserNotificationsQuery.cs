using BrightTutor.Domain.Enums;
using MediatR;

namespace BrightTutor.Application.Notifications.Queries.GetUserNotifications;

public class GetUserNotificationsQuery : IRequest<List<NotificationDto>>
{
    public Guid UserId { get; set; }
    public NotificationStatus? Status { get; set; }
}
