using AutoMapper;
using BrightTutor.Application.Abstractions.Persistence;
using BrightTutor.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Application.Attendance.Queries.GetOnlineAttendance;

public class GetOnlineAttendanceHandler
    : IRequestHandler<GetOnlineAttendanceQuery, List<GetOnlineAttendanceResponse>>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public GetOnlineAttendanceHandler(IApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<List<GetOnlineAttendanceResponse>> Handle(
        GetOnlineAttendanceQuery request, CancellationToken cancellationToken)
    {
        var attendances = await _context.Attendances
            .Where(a => a.ClassGroupId == request.ClassGroupId
                     && a.AttendanceDate == request.AttendanceDate
                     && a.AttendanceType == AttendanceType.Online)
            .ToListAsync(cancellationToken);

        return _mapper.Map<List<GetOnlineAttendanceResponse>>(attendances);
    }
}