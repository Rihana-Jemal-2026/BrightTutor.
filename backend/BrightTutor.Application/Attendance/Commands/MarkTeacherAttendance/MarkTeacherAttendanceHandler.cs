using BrightTutor.Application.Abstractions.Persistence;
using MediatR;

namespace BrightTutor.Application.Attendance.Commands.MarkTeacherAttendance;

public class MarkTeacherAttendanceHandler : IRequestHandler<MarkTeacherAttendanceCommand, Guid>
{
    private readonly IApplicationDbContext _context;

    public MarkTeacherAttendanceHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Guid> Handle(MarkTeacherAttendanceCommand request, CancellationToken cancellationToken)
    {
        var record = new Domain.Entities.TeacherAttendance
        {
            TeacherId = request.TeacherId,
            AttendanceDate = request.AttendanceDate,
            Status = request.Status,
            CheckInTime = request.CheckInTime,
            CheckOutTime = request.CheckOutTime,
            Notes = request.Notes
        };

        _context.TeacherAttendances.Add(record);
        await _context.SaveChangesAsync(cancellationToken);

        return record.Id;
    }
}