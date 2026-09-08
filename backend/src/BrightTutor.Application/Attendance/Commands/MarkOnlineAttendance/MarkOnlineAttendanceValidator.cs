using FluentValidation;

namespace BrightTutor.Application.Attendance.Commands.MarkOnlineAttendance;

public class MarkOnlineAttendanceValidator : AbstractValidator<MarkOnlineAttendanceCommand>
{
    public MarkOnlineAttendanceValidator()
    {
        RuleFor(x => x.StudentId).NotEmpty();
        RuleFor(x => x.TeacherId).NotEmpty();
        RuleFor(x => x.ClassGroupId).NotEmpty();
        RuleFor(x => x.AttendanceDate).NotEmpty();
        RuleFor(x => x.Status).IsInEnum();
    }
}
