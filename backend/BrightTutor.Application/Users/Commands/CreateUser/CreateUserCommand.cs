using BrightTutor.Domain.Enums;
using MediatR;

namespace BrightTutor.Application.Users.Commands.CreateUser;

public class CreateUserCommand : IRequest<CreateUserResponse>
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public string Password { get; set; } = string.Empty;
}
