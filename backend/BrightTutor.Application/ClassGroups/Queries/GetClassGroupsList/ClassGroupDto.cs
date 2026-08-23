namespace BrightTutor.Application.ClassGroups.Queries.GetClassGroupsList;

public class ClassGroupDto
{
    public Guid Id { get; set; }
    public Guid CourseId { get; set; }
    public string CourseName { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int MaximumStudents { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}
