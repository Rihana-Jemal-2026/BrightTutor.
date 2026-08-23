using AutoMapper;
using BrightTutor.Application.Abstractions.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Application.Teachers.Queries.GetTeachersList;

public class GetTeachersListHandler : IRequestHandler<GetTeachersListQuery, List<TeacherDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public GetTeachersListHandler(IApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<List<TeacherDto>> Handle(GetTeachersListQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Teachers
            .Include(t => t.User)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Specialization))
        {
            query = query.Where(t => t.Specialization == request.Specialization);
        }

        var teachers = await query
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync(cancellationToken);

        return _mapper.Map<List<TeacherDto>>(teachers);
    }
}
