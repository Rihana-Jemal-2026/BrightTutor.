using FluentValidation;

namespace BrightTutor.Application.Attendance.Commands.MarkGroupAttendance;

public class MarkGroupAttendanceValidator : AbstractValidator<MarkGroupAttendanceCommand>
{
    public MarkGroupAttendanceValidator()
    {
        RuleFor(x => x.ClassGroupId).NotEmpty();
        RuleFor(x => x.TeacherId).NotEmpty();
        RuleFor(x => x.AttendanceDate).NotEmpty();
        RuleFor(x => x.Students).NotEmpty().WithMessage("At least one student attendance record is required.");

        RuleForEach(x => x.Students).ChildRules(student =>
        {
            student.RuleFor(s => s.StudentId).NotEmpty();
            student.RuleFor(s => s.Status).IsInEnum();
        });
    }
}
