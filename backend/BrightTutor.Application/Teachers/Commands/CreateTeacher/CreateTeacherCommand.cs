using MediatR;

namespace BrightTutor.Application.Teachers.Commands.CreateTeacher;

public class CreateTeacherCommand : IRequest<CreateTeacherResponse>
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;

    public string TeacherCode { get; set; } = string.Empty;
    public string? Specialization { get; set; }
}
