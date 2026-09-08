using BrightTutor.Domain.Common;

namespace BrightTutor.Domain.Entities;

public class TeacherAssignment : BaseEntity
{
    public Guid TeacherId { get; set; }
    public Guid CourseId { get; set; }
    public Guid? ClassGroupId { get; set; }
    public DateTime StartDate { get; set; } = DateTime.UtcNow;
    public DateTime? EndDate { get; set; }

    public Teacher Teacher { get; set; } = null!;
    public Course Course { get; set; } = null!;
    public ClassGroup? ClassGroup { get; set; }
}
