using AutoMapper;
using BrightTutor.Application.Abstractions.Persistence;
using BrightTutor.Application.ClassGroups.Queries.GetClassGroupsList;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Application.ClassGroups.Queries.GetClassGroupById;

public class GetClassGroupByIdHandler : IRequestHandler<GetClassGroupByIdQuery, ClassGroupDto?>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public GetClassGroupByIdHandler(IApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<ClassGroupDto?> Handle(GetClassGroupByIdQuery request, CancellationToken cancellationToken)
    {
        var group = await _context.ClassGroups
            .Include(g => g.Course)
            .FirstOrDefaultAsync(g => g.Id == request.ClassGroupId, cancellationToken);

        if (group == null) return null;

        return _mapper.Map<ClassGroupDto>(group);
    }
}
