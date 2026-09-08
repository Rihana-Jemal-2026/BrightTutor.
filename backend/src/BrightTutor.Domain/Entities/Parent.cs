using BrightTutor.Domain.Common;

namespace BrightTutor.Domain.Entities;

public class Parent : BaseEntity
{
    public Guid UserId { get; set; }
    public string ParentCode { get; set; } = string.Empty;
    public string? Occupation { get; set; }

    public User User { get; set; } = null!;
}
