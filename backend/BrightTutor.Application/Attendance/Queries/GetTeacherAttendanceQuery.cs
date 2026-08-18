using BrightTutor.Application.Abstractions.Persistence;
using BrightTutor.Application.Attendance.Dtos;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Application.Attendance.Queries;

public class GetTeacherAttendanceQuery : IRequest<List<GetTeacherAttendanceResponse>>
{
    public Guid TeacherId { get; set; }
    public DateOnly AttendanceDate { get; set; }
}

public class GetTeacherAttendanceHandler
    : IRequestHandler<GetTeacherAttendanceQuery, List<GetTeacherAttendanceResponse>>
{
    private readonly IApplicationDbContext _context;

    public GetTeacherAttendanceHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<GetTeacherAttendanceResponse>> Handle(
        GetTeacherAttendanceQuery request, CancellationToken cancellationToken)
    {
        return await _context.TeacherAttendances
            .Where(t => t.TeacherId == request.TeacherId
                     && t.AttendanceDate == request.AttendanceDate)
            .Select(t => new GetTeacherAttendanceResponse
            {
                Id = t.Id,
                Status = t.Status,
                CheckInTime = t.CheckInTime,
                CheckOutTime = t.CheckOutTime,
                IsVerified = t.IsVerified,
                Notes = t.Notes
            })
            .ToListAsync(cancellationToken);
    }
}
