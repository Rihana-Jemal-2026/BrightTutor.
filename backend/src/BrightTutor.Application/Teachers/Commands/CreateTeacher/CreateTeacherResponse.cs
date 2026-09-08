namespace BrightTutor.Application.Teachers.Commands.CreateTeacher;

public class CreateTeacherResponse
{
    public Guid TeacherId { get; set; }
    public Guid UserId { get; set; }
    public string TeacherCode { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
}
