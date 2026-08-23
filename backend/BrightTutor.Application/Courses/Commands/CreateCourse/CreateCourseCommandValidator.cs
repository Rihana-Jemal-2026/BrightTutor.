using BrightTutor.Application.Courses.Commands.CreateCourse;
using FluentValidation;

namespace BrightTutor.Application.Courses.Commands.CreateCourse;

public class CreateCourseCommandValidator : AbstractValidator<CreateCourseCommand>
{
    public CreateCourseCommandValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Course name is required.")
            .MaximumLength(100).WithMessage("Course name must not exceed 100 characters.");

        RuleFor(x => x.ServiceType)
            .IsInEnum().WithMessage("A valid service type must be specified.");
    }
}
