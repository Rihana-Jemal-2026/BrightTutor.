using BrightTutor.Application.Abstractions.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Application.Attendance.Queries.GetGroupAttendance;

public class GetGroupAttendanceHandler
    : IRequestHandler<GetGroupAttendanceQuery, List<GetGroupAttendanceResponse>>
{
    private readonly IApplicationDbContext _context;

    public GetGroupAttendanceHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<GetGroupAttendanceResponse>> Handle(
        GetGroupAttendanceQuery request, CancellationToken cancellationToken)
    {
        return await _context.Attendances
            .Where(a => a.ClassGroupId == request.ClassGroupId
                     && a.AttendanceDate == request.AttendanceDate)
            .Select(a => new GetGroupAttendanceResponse
            {
                Id = a.Id,
                StudentId = a.StudentId,
                Status = a.Status,
                Notes = a.Notes
            })
            .ToListAsync(cancellationToken);
    }
}