using BrightTutor.Domain.Common;

namespace BrightTutor.Domain.Entities;

public class Admin : BaseEntity
{
    public Guid UserId { get; set; }
    public string AdminCode { get; set; } = string.Empty;
    public string? Department { get; set; }

    public User User { get; set; } = null!;
}
