using FluentValidation;

namespace BrightTutor.Application.Attendance.Commands.MarkOnlineAttendance;

public class MarkOnlineAttendanceValidator : AbstractValidator<MarkOnlineAttendanceCommand>
{
    public MarkOnlineAttendanceValidator()
    {
        RuleFor(x => x.StudentId).NotEmpty();
        RuleFor(x => x.TeacherId).NotEmpty();
        RuleFor(x => x.ClassGroupId).NotEmpty();
        RuleFor(x => x.AttendanceDate)
            .NotEmpty()
            .LessThanOrEqualTo(DateOnly.FromDateTime(DateTime.UtcNow))
            .WithMessage("AttendanceDate cannot be in the future.");
    }
}