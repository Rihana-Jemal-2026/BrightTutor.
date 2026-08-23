using BrightTutor.Domain.Enums;

namespace BrightTutor.Application.Announcements.Commands.CreateAnnouncement;

public class CreateAnnouncementResponse
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public UserRole? TargetRole { get; set; }
    public Guid CreatedByUserId { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}
