using BrightTutor.Domain.Enums;
using MediatR;

namespace BrightTutor.Application.Announcements.Commands.CreateAnnouncement;

public class CreateAnnouncementCommand : IRequest<CreateAnnouncementResponse>
{
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public UserRole? TargetRole { get; set; }
    public Guid CreatedByUserId { get; set; }
}
