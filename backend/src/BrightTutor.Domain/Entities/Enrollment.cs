using BrightTutor.Domain.Common;

namespace BrightTutor.Domain.Entities;

public class Enrollment : BaseEntity
{
    public Guid StudentId { get; set; }
    public Guid CourseId { get; set; }
    public Guid? ClassGroupId { get; set; }
    public DateTime EnrollmentDate { get; set; } = DateTime.UtcNow;
    public DateTime? EndDate { get; set; }
    public bool IsActive { get; set; } = true;

    public Student Student { get; set; } = null!;
    public Course Course { get; set; } = null!;
    public ClassGroup? ClassGroup { get; set; }
}
