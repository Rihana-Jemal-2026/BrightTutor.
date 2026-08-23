using AutoMapper;
using BrightTutor.Application.Abstractions.Persistence;
using BrightTutor.Application.Schedules.Queries.GetSchedulesList;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Application.Schedules.Queries.GetScheduleById;

public class GetScheduleByIdHandler : IRequestHandler<GetScheduleByIdQuery, ScheduleDto?>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public GetScheduleByIdHandler(IApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<ScheduleDto?> Handle(GetScheduleByIdQuery request, CancellationToken cancellationToken)
    {
        var schedule = await _context.Schedules
            .Include(s => s.Course)
            .Include(s => s.ClassGroup)
            .Include(s => s.Teacher).ThenInclude(t => t.User)
            .Include(s => s.Student!).ThenInclude(st => st.User)
            .FirstOrDefaultAsync(s => s.Id == request.ScheduleId, cancellationToken);

        if (schedule == null) return null;

        return _mapper.Map<ScheduleDto>(schedule);
    }
}
