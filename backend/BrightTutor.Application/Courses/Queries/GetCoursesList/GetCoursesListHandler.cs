using AutoMapper;
using BrightTutor.Application.Abstractions.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Application.Courses.Queries.GetCoursesList;

public class GetCoursesListHandler : IRequestHandler<GetCoursesListQuery, List<CourseDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public GetCoursesListHandler(IApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<List<CourseDto>> Handle(GetCoursesListQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Courses.AsQueryable();

        if (request.ServiceType.HasValue)
        {
            query = query.Where(c => c.ServiceType == request.ServiceType.Value);
        }

        if (request.IsActive.HasValue)
        {
            query = query.Where(c => c.IsActive == request.IsActive.Value);
        }

        var courses = await query
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync(cancellationToken);

        return _mapper.Map<List<CourseDto>>(courses);
    }
}
