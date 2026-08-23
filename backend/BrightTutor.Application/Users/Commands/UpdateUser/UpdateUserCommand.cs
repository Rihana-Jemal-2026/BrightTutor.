using BrightTutor.Domain.Enums;
using MediatR;

namespace BrightTutor.Application.Users.Commands.UpdateUser;

public class UpdateUserCommand : IRequest<bool>
{
    public Guid UserId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public UserRole Role { get; set; }
}
