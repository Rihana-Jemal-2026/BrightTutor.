using MediatR;

namespace BrightTutor.Application.Settings.Commands.UpdateSystemSetting;

public class UpdateSystemSettingCommand : IRequest<bool>
{
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public string? Description { get; set; }
}
