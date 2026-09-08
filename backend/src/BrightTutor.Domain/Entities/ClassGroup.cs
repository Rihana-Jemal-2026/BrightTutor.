using BrightTutor.Domain.Common;

namespace BrightTutor.Domain.Entities;

public class ClassGroup : BaseEntity
{
    public Guid CourseId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int MaximumStudents { get; set; } = 30;
    public bool IsActive { get; set; } = true;

    public Course Course { get; set; } = null!;
}
