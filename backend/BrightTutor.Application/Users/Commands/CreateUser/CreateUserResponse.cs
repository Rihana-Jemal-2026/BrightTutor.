using BrightTutor.Domain.Enums;

namespace BrightTutor.Application.Users.Commands.CreateUser;

public class CreateUserResponse
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public UserStatus Status { get; set; }
}
