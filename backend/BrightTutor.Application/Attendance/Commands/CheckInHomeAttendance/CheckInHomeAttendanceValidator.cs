using FluentValidation;

namespace BrightTutor.Application.Attendance.Commands.CheckInHomeAttendance;

public class CheckInHomeAttendanceValidator : AbstractValidator<CheckInHomeAttendanceCommand>
{
    public CheckInHomeAttendanceValidator()
    {
        RuleFor(x => x.StudentId).NotEmpty();
        RuleFor(x => x.TeacherId).NotEmpty();
        RuleFor(x => x.ClassGroupId).NotEmpty();

        RuleFor(x => x.CheckInLatitude).InclusiveBetween(-90, 90)
            .WithMessage("Latitude must be between -90 and 90.");
        RuleFor(x => x.CheckInLongitude).InclusiveBetween(-180, 180)
            .WithMessage("Longitude must be between -180 and 180.");
    }
}