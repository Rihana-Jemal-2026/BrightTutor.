using BrightTutor.Application.Abstractions.Persistence;
using BrightTutor.Application.Attendance.Dtos;
using BrightTutor.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Application.Attendance.Commands.MarkGroupAttendance;

public class MarkGroupAttendanceCommand : IRequest<MarkGroupAttendanceResponse>
{
    public Guid ClassGroupId { get; set; }
    public Guid TeacherId { get; set; }
    public DateOnly AttendanceDate { get; set; }
    public List<StudentAttendanceEntryDto> Students { get; set; } = [];
}

public class MarkGroupAttendanceHandler
    : IRequestHandler<MarkGroupAttendanceCommand, MarkGroupAttendanceResponse>
{
    private readonly IApplicationDbContext _context;

    public MarkGroupAttendanceHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<MarkGroupAttendanceResponse> Handle(
        MarkGroupAttendanceCommand request, CancellationToken cancellationToken)
    {
        var alreadySubmitted = await _context.Attendances
            .AnyAsync(a => a.ClassGroupId == request.ClassGroupId && a.AttendanceDate == request.AttendanceDate, cancellationToken);

        if (alreadySubmitted)
        {
            throw new InvalidOperationException($"Attendance for this class group on {request.AttendanceDate} has already been submitted today. Multiple submissions for the same date are not allowed.");
        }
        var records = request.Students.Select(s => new Domain.Entities.Attendance
        {
            StudentId = s.StudentId,
            TeacherId = request.TeacherId,
            ClassGroupId = request.ClassGroupId,
            AttendanceType = AttendanceType.Group,
            Status = s.Status,
            AttendanceDate = request.AttendanceDate,
            Notes = s.Notes
        }).ToList();

        _context.Attendances.AddRange(records);
        await _context.SaveChangesAsync(cancellationToken);

        return new MarkGroupAttendanceResponse
        {
            RecordsCreated = records.Count,
            ClassGroupId = request.ClassGroupId,
            AttendanceDate = request.AttendanceDate
        };
    }
}
