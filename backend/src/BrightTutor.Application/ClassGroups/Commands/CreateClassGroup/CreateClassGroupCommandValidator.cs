using BrightTutor.Application.ClassGroups.Commands.CreateClassGroup;
using FluentValidation;

namespace BrightTutor.Application.ClassGroups.Commands.CreateClassGroup;

public class CreateClassGroupCommandValidator : AbstractValidator<CreateClassGroupCommand>
{
    public CreateClassGroupCommandValidator()
    {
        RuleFor(x => x.CourseId)
            .NotEmpty().WithMessage("Course ID is required.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Class group name is required.")
            .MaximumLength(100).WithMessage("Class group name must not exceed 100 characters.");

        RuleFor(x => x.MaximumStudents)
            .GreaterThan(0).WithMessage("Maximum students capacity must be greater than 0.");
    }
}
