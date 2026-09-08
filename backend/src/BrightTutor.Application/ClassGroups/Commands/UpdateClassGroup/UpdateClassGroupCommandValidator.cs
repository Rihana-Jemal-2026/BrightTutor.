using BrightTutor.Application.ClassGroups.Commands.UpdateClassGroup;
using FluentValidation;

namespace BrightTutor.Application.ClassGroups.Commands.UpdateClassGroup;

public class UpdateClassGroupCommandValidator : AbstractValidator<UpdateClassGroupCommand>
{
    public UpdateClassGroupCommandValidator()
    {
        RuleFor(x => x.ClassGroupId)
            .NotEmpty().WithMessage("Class group ID is required.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Class group name is required.")
            .MaximumLength(100).WithMessage("Class group name must not exceed 100 characters.");

        RuleFor(x => x.MaximumStudents)
            .GreaterThan(0).WithMessage("Maximum students capacity must be greater than 0.");
    }
}
