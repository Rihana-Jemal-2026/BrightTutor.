namespace BrightTutor.Application.Enrollments.Commands.EnrollStudent;

public class EnrollStudentResponse
{
    public Guid Id { get; set; }
    public Guid StudentId { get; set; }
    public Guid CourseId { get; set; }
    public Guid? ClassGroupId { get; set; }
    public DateTime EnrollmentDate { get; set; }
    public bool IsActive { get; set; }
}
