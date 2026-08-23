using BrightTutor.Application.Schedules.Commands.CreateSchedule;
using FluentValidation;

namespace BrightTutor.Application.Schedules.Commands.CreateSchedule;

public class CreateScheduleCommandValidator : AbstractValidator<CreateScheduleCommand>
{
    public CreateScheduleCommandValidator()
    {
        RuleFor(x => x.CourseId)
            .NotEmpty().WithMessage("Course ID is required.");

        RuleFor(x => x.TeacherId)
            .NotEmpty().WithMessage("Teacher ID is required.");

        RuleFor(x => x.ServiceType)
            .IsInEnum().WithMessage("A valid service type must be specified.");

        RuleFor(x => x.StartTime)
            .NotEmpty().WithMessage("Start time is required.");

        RuleFor(x => x.EndTime)
            .NotEmpty().WithMessage("End time is required.")
            .GreaterThan(x => x.StartTime).WithMessage("End time must be strictly later than start time.");
    }
}
