using FluentValidation;

namespace BrightTutor.Application.Attendance.Commands.MarkGroupAttendance;

public class MarkGroupAttendanceValidator : AbstractValidator<MarkGroupAttendanceCommand>
{
    public MarkGroupAttendanceValidator()
    {
        RuleFor(x => x.ClassGroupId)
            .NotEmpty().WithMessage("ClassGroupId is required.");

        RuleFor(x => x.TeacherId)
            .NotEmpty().WithMessage("TeacherId is required.");

        RuleFor(x => x.AttendanceDate)
            .NotEmpty().WithMessage("AttendanceDate is required.")
            .LessThanOrEqualTo(DateOnly.FromDateTime(DateTime.UtcNow))
            .WithMessage("AttendanceDate cannot be in the future.");

        RuleFor(x => x.Students)
            .NotEmpty().WithMessage("At least one student is required to mark group attendance.");

        RuleForEach(x => x.Students).ChildRules(student =>
        {
            student.RuleFor(s => s.StudentId)
                .NotEmpty().WithMessage("StudentId is required for each student.");
        });
    }
}