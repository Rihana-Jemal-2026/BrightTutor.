using BrightTutor.Domain.Common;

namespace BrightTutor.Domain.Entities;

public class Teacher : BaseEntity
{
    public Guid UserId { get; set; }
    public string TeacherCode { get; set; } = string.Empty;
    public string? Specialization { get; set; }

    public User User { get; set; } = null!;
}
