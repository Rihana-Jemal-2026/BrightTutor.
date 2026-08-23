using BrightTutor.Application.Settings.Commands.UpdateSystemSetting;
using FluentValidation;

namespace BrightTutor.Application.Settings.Commands.UpdateSystemSetting;

public class UpdateSystemSettingCommandValidator : AbstractValidator<UpdateSystemSettingCommand>
{
    public UpdateSystemSettingCommandValidator()
    {
        RuleFor(x => x.Key)
            .NotEmpty().WithMessage("Setting key is required.")
            .MaximumLength(100).WithMessage("Setting key must not exceed 100 characters.");

        RuleFor(x => x.Value)
            .NotEmpty().WithMessage("Setting value is required.");
    }
}
