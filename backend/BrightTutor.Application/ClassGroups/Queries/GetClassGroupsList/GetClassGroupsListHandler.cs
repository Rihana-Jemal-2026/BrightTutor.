using AutoMapper;
using BrightTutor.Application.Abstractions.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Application.ClassGroups.Queries.GetClassGroupsList;

public class GetClassGroupsListHandler : IRequestHandler<GetClassGroupsListQuery, List<ClassGroupDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public GetClassGroupsListHandler(IApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<List<ClassGroupDto>> Handle(GetClassGroupsListQuery request, CancellationToken cancellationToken)
    {
        var query = _context.ClassGroups
            .Include(g => g.Course)
            .AsQueryable();

        if (request.CourseId.HasValue)
        {
            query = query.Where(g => g.CourseId == request.CourseId.Value);
        }

        var groups = await query
            .OrderByDescending(g => g.CreatedAt)
            .ToListAsync(cancellationToken);

        return _mapper.Map<List<ClassGroupDto>>(groups);
    }
}
