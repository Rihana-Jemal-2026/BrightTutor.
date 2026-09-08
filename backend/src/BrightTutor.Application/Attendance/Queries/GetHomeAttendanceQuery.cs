using BrightTutor.Application.Abstractions.Persistence;
using BrightTutor.Application.Attendance.Dtos;
using BrightTutor.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Application.Attendance.Queries;

public class GetHomeAttendanceQuery : IRequest<List<GetHomeAttendanceResponse>>
{
    public Guid StudentId { get; set; }
    public DateOnly AttendanceDate { get; set; }
}

public class GetHomeAttendanceHandler
    : IRequestHandler<GetHomeAttendanceQuery, List<GetHomeAttendanceResponse>>
{
    private readonly IApplicationDbContext _context;

    public GetHomeAttendanceHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<GetHomeAttendanceResponse>> Handle(
        GetHomeAttendanceQuery request, CancellationToken cancellationToken)
    {
        var attendances = await _context.Attendances
            .Where(a => a.StudentId == request.StudentId
                     && a.AttendanceDate == request.AttendanceDate
                     && a.AttendanceType == AttendanceType.Home)
            .ToListAsync(cancellationToken);

        var attendanceIds = attendances.Select(a => a.Id).ToList();

        var details = await _context.HomeAttendances
            .Where(h => attendanceIds.Contains(h.AttendanceId))
            .ToListAsync(cancellationToken);

        return attendances.Select(a =>
        {
            var detail = details.FirstOrDefault(d => d.AttendanceId == a.Id);
            return new GetHomeAttendanceResponse
            {
                AttendanceId = a.Id,
                CheckInTime = a.CheckInTime,
                CheckOutTime = a.CheckOutTime,
                LessonCovered = a.LessonCovered,
                CheckInLatitude = detail?.CheckInLatitude ?? 0,
                CheckInLongitude = detail?.CheckInLongitude ?? 0,
                Address = detail?.Address,
                IsLocationVerified = detail?.IsLocationVerified ?? false
            };
        }).ToList();
    }
}
