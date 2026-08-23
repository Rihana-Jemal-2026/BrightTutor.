namespace BrightTutor.Application.TeacherAssignments.Queries.GetTeacherAssignments;

public class TeacherAssignmentDto
{
    public Guid Id { get; set; }
    public Guid TeacherId { get; set; }
    public string TeacherCode { get; set; } = string.Empty;
    public string TeacherName { get; set; } = string.Empty;

    public Guid CourseId { get; set; }
    public string CourseName { get; set; } = string.Empty;

    public Guid? ClassGroupId { get; set; }
    public string? ClassGroupName { get; set; }

    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}
