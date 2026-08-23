using BrightTutor.Application.Schedules.Commands.UpdateSchedule;
using FluentValidation;

namespace BrightTutor.Application.Schedules.Commands.UpdateSchedule;

public class UpdateScheduleCommandValidator : AbstractValidator<UpdateScheduleCommand>
{
    public UpdateScheduleCommandValidator()
    {
        RuleFor(x => x.ScheduleId)
            .NotEmpty().WithMessage("Schedule ID is required.");

        RuleFor(x => x.StartTime)
            .NotEmpty().WithMessage("Start time is required.");

        RuleFor(x => x.EndTime)
            .NotEmpty().WithMessage("End time is required.")
            .GreaterThan(x => x.StartTime).WithMessage("End time must be strictly later than start time.");

        RuleFor(x => x.Status)
            .IsInEnum().WithMessage("A valid schedule status must be specified.");
    }
}
