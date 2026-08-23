using BrightTutor.Application.Courses.Commands.UpdateCourse;
using FluentValidation;

namespace BrightTutor.Application.Courses.Commands.UpdateCourse;

public class UpdateCourseCommandValidator : AbstractValidator<UpdateCourseCommand>
{
    public UpdateCourseCommandValidator()
    {
        RuleFor(x => x.CourseId)
            .NotEmpty().WithMessage("Course ID is required.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Course name is required.")
            .MaximumLength(100).WithMessage("Course name must not exceed 100 characters.");

        RuleFor(x => x.ServiceType)
            .IsInEnum().WithMessage("A valid service type must be specified.");
    }
}
