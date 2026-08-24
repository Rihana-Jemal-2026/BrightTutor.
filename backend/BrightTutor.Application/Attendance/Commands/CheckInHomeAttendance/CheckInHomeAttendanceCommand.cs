using MediatR;

namespace BrightTutor.Application.Attendance.Commands.CheckInHomeAttendance;

public class CheckInHomeAttendanceCommand : IRequest<Guid>
{
    public Guid StudentId { get; set; }
    public Guid TeacherId { get; set; }
    public Guid ClassGroupId { get; set; }
    public DateOnly AttendanceDate { get; set; }
    public decimal CheckInLatitude { get; set; }
    public decimal CheckInLongitude { get; set; }
    public string? Address { get; set; }
    public string? LessonCovered { get; set; }
}
public class CheckInHomeAttendanceHandler : IRequestHandler<CheckInHomeAttendanceCommand, Guid>
{
    private readonly IApplicationDbContext _context;

    public CheckInHomeAttendanceHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Guid> Handle(CheckInHomeAttendanceCommand request, CancellationToken cancellationToken)
    {
        var attendance = new Domain.Entities.Attendance
        {
            StudentId = request.StudentId,
            TeacherId = request.TeacherId,
            ClassGroupId = request.ClassGroupId,
            AttendanceType = AttendanceType.Home,
            Status = AttendanceStatus.Present,
            AttendanceDate = request.AttendanceDate,
            CheckInTime = DateTime.UtcNow,
            LessonCovered = request.LessonCovered
        };
        _context.Attendances.Add(attendance);

        var homeDetail = new Domain.Entities.HomeAttendance
        {
            AttendanceId = attendance.Id,
            CheckInLatitude = request.CheckInLatitude,
            CheckInLongitude = request.CheckInLongitude,
            Address = request.Address,
            IsLocationVerified = false
        };
        _context.HomeAttendances.Add(homeDetail);

        await _context.SaveChangesAsync(cancellationToken);
        return attendance.Id;
    }
}