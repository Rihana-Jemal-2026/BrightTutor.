using AutoMapper;
using BrightTutor.Application.Abstractions.Persistence;
using BrightTutor.Application.Enrollments.Queries.GetStudentEnrollments;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Application.Enrollments.Queries.GetCourseEnrollments;

public class GetCourseEnrollmentsHandler : IRequestHandler<GetCourseEnrollmentsQuery, List<EnrollmentDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public GetCourseEnrollmentsHandler(IApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<List<EnrollmentDto>> Handle(GetCourseEnrollmentsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Enrollments
            .Include(e => e.Course)
            .Include(e => e.ClassGroup)
            .Include(e => e.Student).ThenInclude(s => s.User)
            .Where(e => e.CourseId == request.CourseId);

        if (request.ClassGroupId.HasValue)
        {
            query = query.Where(e => e.ClassGroupId == request.ClassGroupId.Value);
        }

        var enrollments = await query
            .OrderByDescending(e => e.EnrollmentDate)
            .ToListAsync(cancellationToken);

        return _mapper.Map<List<EnrollmentDto>>(enrollments);
    }
}
