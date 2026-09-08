using BrightTutor.Domain.Enums;
using MediatR;

namespace BrightTutor.Application.Users.Commands.UpdateUserStatus;

public class UpdateUserStatusCommand : IRequest<bool>
{
    public Guid UserId { get; set; }
    public UserStatus Status { get; set; }
}
