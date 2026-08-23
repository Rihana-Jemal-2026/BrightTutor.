using BrightTutor.Domain.Common;
using BrightTutor.Domain.Enums;

namespace BrightTutor.Domain.Entities;

public class Announcement : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public UserRole? TargetRole { get; set; }
    public Guid CreatedByUserId { get; set; }
    public bool IsActive { get; set; } = true;

    public User CreatedByUser { get; set; } = null!;
}
