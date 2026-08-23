namespace BrightTutor.Application.Enrollments.Queries.GetStudentEnrollments;

public class EnrollmentDto
{
    public Guid Id { get; set; }
    public Guid StudentId { get; set; }
    public string StudentCode { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;

    public Guid CourseId { get; set; }
    public string CourseName { get; set; } = string.Empty;

    public Guid? ClassGroupId { get; set; }
    public string? ClassGroupName { get; set; }

    public DateTime EnrollmentDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool IsActive { get; set; }
}
