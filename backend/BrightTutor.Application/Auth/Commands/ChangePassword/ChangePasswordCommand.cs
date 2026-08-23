using MediatR;

namespace BrightTutor.Application.Auth.Commands.ChangePassword;

public class ChangePasswordCommand : IRequest<bool>
{
    public string OldPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}
