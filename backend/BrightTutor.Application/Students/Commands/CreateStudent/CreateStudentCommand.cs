using MediatR;

namespace BrightTutor.Application.Students.Commands.CreateStudent;

public class CreateStudentCommand : IRequest<CreateStudentResponse>
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;

    public string StudentCode { get; set; } = string.Empty;
    public DateTime? DateOfBirth { get; set; }
    public string? GradeLevel { get; set; }
    public Guid? ParentId { get; set; }
}
