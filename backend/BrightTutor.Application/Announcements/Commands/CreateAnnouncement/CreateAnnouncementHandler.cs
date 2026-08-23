using BrightTutor.Application.Abstractions.Persistence;
using BrightTutor.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Application.Announcements.Commands.CreateAnnouncement;

public class CreateAnnouncementHandler : IRequestHandler<CreateAnnouncementCommand, CreateAnnouncementResponse>
{
    private readonly IApplicationDbContext _context;

    public CreateAnnouncementHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<CreateAnnouncementResponse> Handle(CreateAnnouncementCommand request, CancellationToken cancellationToken)
    {
        var authorExists = await _context.Users
            .AnyAsync(u => u.Id == request.CreatedByUserId, cancellationToken);

        if (!authorExists)
        {
            throw new InvalidOperationException($"User with ID '{request.CreatedByUserId}' not found.");
        }

        var announcement = new Announcement
        {
            Title = request.Title,
            Content = request.Content,
            TargetRole = request.TargetRole,
            CreatedByUserId = request.CreatedByUserId,
            IsActive = true
        };

        _context.Announcements.Add(announcement);
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
