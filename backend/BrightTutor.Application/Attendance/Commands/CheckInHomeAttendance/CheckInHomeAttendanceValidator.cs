using FluentValidation;

namespace BrightTutor.Application.Attendance.Commands.CheckInHomeAttendance;

public class CheckInHomeAttendanceValidator : AbstractValidator<CheckInHomeAttendanceCommand>
{
    public CheckInHomeAttendanceValidator()
    {
        RuleFor(x => x.StudentId).NotEmpty();
        RuleFor(x => x.TeacherId).NotEmpty();
        RuleFor(x => x.ClassGroupId).NotEmpty();
        RuleFor(x => x.AttendanceDate).NotEmpty();
        RuleFor(x => x.CheckInLatitude).InclusiveBetween(-90m, 90m);
        RuleFor(x => x.CheckInLongitude).InclusiveBetween(-180m, 180m);
    }
}
