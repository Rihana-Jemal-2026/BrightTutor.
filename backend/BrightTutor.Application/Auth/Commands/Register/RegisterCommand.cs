using BrightTutor.Domain.Enums;
using MediatR;

namespace BrightTutor.Application.Auth.Commands.Register;

public class RegisterCommand : IRequest<RegisterResponse>
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.Student;
}
