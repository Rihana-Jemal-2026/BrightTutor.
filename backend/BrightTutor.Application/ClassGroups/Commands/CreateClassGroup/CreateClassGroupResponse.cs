namespace BrightTutor.Application.ClassGroups.Commands.CreateClassGroup;

public class CreateClassGroupResponse
{
    public Guid Id { get; set; }
    public Guid CourseId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int MaximumStudents { get; set; }
    public bool IsActive { get; set; }
}
