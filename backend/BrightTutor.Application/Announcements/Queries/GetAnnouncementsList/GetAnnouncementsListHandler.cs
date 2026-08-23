using AutoMapper;
using BrightTutor.Application.Abstractions.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Application.Announcements.Queries.GetAnnouncementsList;

public class GetAnnouncementsListHandler : IRequestHandler<GetAnnouncementsListQuery, List<AnnouncementDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public GetAnnouncementsListHandler(IApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<List<AnnouncementDto>> Handle(GetAnnouncementsListQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Announcements
            .Include(a => a.CreatedByUser)
            .Where(a => a.IsActive);

        if (request.TargetRole.HasValue)
        {
            query = query.Where(a => a.TargetRole == null || a.TargetRole == request.TargetRole.Value);
        }

        var announcements = await query
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync(cancellationToken);

        return _mapper.Map<List<AnnouncementDto>>(announcements);
    }
}
