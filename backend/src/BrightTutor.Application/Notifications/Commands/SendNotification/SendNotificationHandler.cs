using BrightTutor.Application.Abstractions.Persistence;
using BrightTutor.Domain.Entities;
using BrightTutor.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Application.Notifications.Commands.SendNotification;

public class SendNotificationHandler : IRequestHandler<SendNotificationCommand, SendNotificationResponse>
{
    private readonly IApplicationDbContext _context;

    public SendNotificationHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<SendNotificationResponse> Handle(SendNotificationCommand request, CancellationToken cancellationToken)
    {
        var userExists = await _context.Users
            .AnyAsync(u => u.Id == request.UserId, cancellationToken);

        if (!userExists)
        {
            throw new InvalidOperationException($"User with ID '{request.UserId}' not found.");
        }

        var notification = new Notification
        {
            UserId = request.UserId,
            Title = request.Title,
            Message = request.Message,
            Type = request.Type,
            Status = NotificationStatus.Unread
        };

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync(cancellationToken);

        return new SendNotificationResponse
        {
            Id = notification.Id,
            UserId = notification.UserId,
            Title = notification.Title,
            Type = notification.Type,
            Status = notification.Status,
            CreatedAt = notification.CreatedAt
        };
    }
}
