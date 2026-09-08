using FluentValidation;

namespace BrightTutor.Application.Attendance.Commands.UpdateAttendance;

public class UpdateAttendanceValidator : AbstractValidator<UpdateAttendanceCommand>
{
    public UpdateAttendanceValidator()
    {
        RuleFor(x => x.AttendanceId).NotEmpty();
        RuleFor(x => x.NewStatus).IsInEnum();
    }
}
