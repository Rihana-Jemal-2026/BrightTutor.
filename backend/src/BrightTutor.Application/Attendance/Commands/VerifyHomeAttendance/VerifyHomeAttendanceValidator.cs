using FluentValidation;

namespace BrightTutor.Application.Attendance.Commands.VerifyHomeAttendance;

public class VerifyHomeAttendanceValidator : AbstractValidator<VerifyHomeAttendanceCommand>
{
    public VerifyHomeAttendanceValidator()
    {
        RuleFor(x => x.AttendanceId).NotEmpty();
    }
}
