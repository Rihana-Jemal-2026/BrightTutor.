using BrightTutor.Domain.Common;

namespace BrightTutor.Domain.Entities;

public class Student : BaseEntity
{
    public Guid UserId { get; set; }
    public string StudentCode { get; set; } = string.Empty;
    public DateTime? DateOfBirth { get; set; }
    public string? GradeLevel { get; set; }
    public Guid? ParentId { get; set; }

    public string? ProfilePhotoUrl { get; set; }
    public string? FaceDescriptorJson { get; set; }

    public User User { get; set; } = null!;
    public Parent? Parent { get; set; }
}
