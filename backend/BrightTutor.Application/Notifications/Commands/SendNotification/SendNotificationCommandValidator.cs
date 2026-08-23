using BrightTutor.Application.Notifications.Commands.SendNotification;
using FluentValidation;

namespace BrightTutor.Application.Notifications.Commands.SendNotification;

public class SendNotificationCommandValidator : AbstractValidator<SendNotificationCommand>
{
    public SendNotificationCommandValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("Target User ID is required.");

        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Notification title is required.")
            .MaximumLength(150).WithMessage("Notification title must not exceed 150 characters.");

        RuleFor(x => x.Message)
            .NotEmpty().WithMessage("Notification message is required.");

        RuleFor(x => x.Type)
            .IsInEnum().WithMessage("A valid notification type must be specified.");
    }
}
