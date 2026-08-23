using BrightTutor.Application.Settings.Commands.CreateAcademicCalendar;
using FluentValidation;

namespace BrightTutor.Application.Settings.Commands.CreateAcademicCalendar;

public class CreateAcademicCalendarCommandValidator : AbstractValidator<CreateAcademicCalendarCommand>
{
    public CreateAcademicCalendarCommandValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Academic calendar title is required.")
            .MaximumLength(150).WithMessage("Academic calendar title must not exceed 150 characters.");

        RuleFor(x => x.StartDate)
            .NotEmpty().WithMessage("Start date is required.");

        RuleFor(x => x.EndDate)
            .NotEmpty().WithMessage("End date is required.")
            .GreaterThan(x => x.StartDate).WithMessage("End date must be strictly later than start date.");
    }
}
