namespace BrightTutor.Application.Students.Commands.CreateStudent;

public class CreateStudentResponse
{
    public Guid StudentId { get; set; }
    public Guid UserId { get; set; }
    public string StudentCode { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
}
