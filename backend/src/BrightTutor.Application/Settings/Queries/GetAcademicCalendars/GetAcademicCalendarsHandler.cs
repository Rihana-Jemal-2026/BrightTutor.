using AutoMapper;
using BrightTutor.Application.Abstractions.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Application.Settings.Queries.GetAcademicCalendars;

public class GetAcademicCalendarsHandler : IRequestHandler<GetAcademicCalendarsQuery, List<AcademicCalendarDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public GetAcademicCalendarsHandler(IApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<List<AcademicCalendarDto>> Handle(GetAcademicCalendarsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.AcademicCalendars.AsQueryable();

        if (request.IsActive.HasValue)
        {
            query = query.Where(c => c.IsActive == request.IsActive.Value);
        }

        var calendars = await query
            .OrderByDescending(c => c.StartDate)
            .ToListAsync(cancellationToken);

        return _mapper.Map<List<AcademicCalendarDto>>(calendars);
    }
}
