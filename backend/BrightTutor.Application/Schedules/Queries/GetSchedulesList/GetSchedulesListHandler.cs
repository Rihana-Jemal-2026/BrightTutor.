using AutoMapper;
using BrightTutor.Application.Abstractions.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Application.Schedules.Queries.GetSchedulesList;

public class GetSchedulesListHandler : IRequestHandler<GetSchedulesListQuery, List<ScheduleDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public GetSchedulesListHandler(IApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<List<ScheduleDto>> Handle(GetSchedulesListQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Schedules
            .Include(s => s.Course)
            .Include(s => s.ClassGroup)
            .Include(s => s.Teacher).ThenInclude(t => t.User)
            .Include(s => s.Student!).ThenInclude(st => st.User)
            .AsQueryable();

        if (request.TeacherId.HasValue)
            query = query.Where(s => s.TeacherId == request.TeacherId.Value);

        if (request.StudentId.HasValue)
            query = query.Where(s => s.StudentId == request.StudentId.Value);

        if (request.CourseId.HasValue)
            query = query.Where(s => s.CourseId == request.CourseId.Value);

        if (request.ClassGroupId.HasValue)
            query = query.Where(s => s.ClassGroupId == request.ClassGroupId.Value);

        if (request.ServiceType.HasValue)
            query = query.Where(s => s.ServiceType == request.ServiceType.Value);

        if (request.Status.HasValue)
            query = query.Where(s => s.Status == request.Status.Value);

        if (request.FromDate.HasValue)
            query = query.Where(s => s.StartTime >= request.FromDate.Value);

        if (request.ToDate.HasValue)
            query = query.Where(s => s.EndTime <= request.ToDate.Value);

        var schedules = await query
            .OrderBy(s => s.StartTime)
            .ToListAsync(cancellationToken);

        return _mapper.Map<List<ScheduleDto>>(schedules);
    }
}
