using AutoMapper;
using BrightTutor.Application.Abstractions.Persistence;
using BrightTutor.Application.Courses.Queries.GetCoursesList;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Application.Courses.Queries.GetCourseById;

public class GetCourseByIdHandler : IRequestHandler<GetCourseByIdQuery, CourseDto?>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public GetCourseByIdHandler(IApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<CourseDto?> Handle(GetCourseByIdQuery request, CancellationToken cancellationToken)
    {
        var course = await _context.Courses
            .FirstOrDefaultAsync(c => c.Id == request.CourseId, cancellationToken);

        if (course == null) return null;

        return _mapper.Map<CourseDto>(course);
    }
}
