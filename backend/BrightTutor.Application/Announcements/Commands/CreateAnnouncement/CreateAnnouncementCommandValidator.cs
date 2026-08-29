using FluentValidation;

namespace BrightTutor.Application.Announcements.Commands.CreateAnnouncement;

public class CreateAnnouncementCommandValidator : AbstractValidator<CreateAnnouncementCommand>
{
    public CreateAnnouncementCommandValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Announcement title is required.")
            .MaximumLength(150).WithMessage("Announcement title must not exceed 150 characters.");

        RuleFor(x => x.Content)
            .NotEmpty().WithMessage("Announcement content is required.");
    }
}
