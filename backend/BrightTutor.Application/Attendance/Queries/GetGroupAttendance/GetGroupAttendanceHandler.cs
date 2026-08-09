using AutoMapper;
using BrightTutor.Application.Abstractions.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Application.Attendance.Queries.GetGroupAttendance;

public class GetGroupAttendanceHandler
    : IRequestHandler<GetGroupAttendanceQuery, List<GetGroupAttendanceResponse>>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public GetGroupAttendanceHandler(IApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<List<GetGroupAttendanceResponse>> Handle(
        GetGroupAttendanceQuery request, CancellationToken cancellationToken)
    {
        var attendances = await _context.Attendances
            .Where(a => a.ClassGroupId == request.ClassGroupId
                     && a.AttendanceDate == request.AttendanceDate)
            .ToListAsync(cancellationToken);

        return _mapper.Map<List<GetGroupAttendanceResponse>>(attendances);
    }
}