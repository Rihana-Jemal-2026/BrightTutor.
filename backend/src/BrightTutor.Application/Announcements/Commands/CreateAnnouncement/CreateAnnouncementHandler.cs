using BrightTutor.Application.Abstractions.Authentication;
using BrightTutor.Application.Abstractions.Persistence;
using BrightTutor.Domain.Entities;
using BrightTutor.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Application.Announcements.Commands.CreateAnnouncement;

public class CreateAnnouncementHandler : IRequestHandler<CreateAnnouncementCommand, CreateAnnouncementResponse>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public CreateAnnouncementHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<CreateAnnouncementResponse> Handle(CreateAnnouncementCommand request, CancellationToken cancellationToken)
    {
        var authorId = (request.CreatedByUserId.HasValue && request.CreatedByUserId.Value != Guid.Empty)
            ? request.CreatedByUserId.Value
            : _currentUserService.UserId ?? Guid.Empty;

        if (authorId == Guid.Empty)
        {
            var defaultAdmin = await _context.Users.FirstOrDefaultAsync(u => u.Role == UserRole.Admin, cancellationToken);
            if (defaultAdmin != null) authorId = defaultAdmin.Id;
        }

        var announcement = new Announcement
        {
            Title = request.Title,
            Content = request.Content,
            TargetRole = request.TargetRole,
            CreatedByUserId = authorId,
            IsActive = true
        };

        _context.Announcements.Add(announcement);

        // Auto-dispatch in-app Notification to all targeted active users
        var targetUsersQuery = _context.Users.Where(u => u.Status == UserStatus.Active);
        if (request.TargetRole.HasValue)
        {
            targetUsersQuery = targetUsersQuery.Where(u => u.Role == request.TargetRole.Value);
        }

        var targetUsers = await targetUsersQuery.ToListAsync(cancellationToken);
        foreach (var user in targetUsers)
        {
            var notification = new Notification
            {
                UserId = user.Id,
                Title = $"📢 Notice: {request.Title}",
                Message = request.Content,
                Type = NotificationType.GeneralAnnouncement,
                Status = NotificationStatus.Unread,
                CreatedAt = DateTime.UtcNow
            };
            _context.Notifications.Add(notification);
        }

        await _context.SaveChangesAsync(cancellationToken);

        return new CreateAnnouncementResponse
        {
            Id = announcement.Id,
            Title = announcement.Title,
            TargetRole = announcement.TargetRole,
            CreatedByUserId = announcement.CreatedByUserId,
            IsActive = announcement.IsActive,
            CreatedAt = announcement.CreatedAt
        };
    }
}
