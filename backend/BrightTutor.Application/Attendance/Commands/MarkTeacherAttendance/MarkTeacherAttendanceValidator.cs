using FluentValidation;

namespace BrightTutor.Application.Attendance.Commands.MarkTeacherAttendance;

public class MarkTeacherAttendanceValidator : AbstractValidator<MarkTeacherAttendanceCommand>
{
    public MarkTeacherAttendanceValidator()
    {
        RuleFor(x => x.TeacherId).NotEmpty();
        RuleFor(x => x.AttendanceDate).NotEmpty();
        RuleFor(x => x.Status).IsInEnum();
    }
}
