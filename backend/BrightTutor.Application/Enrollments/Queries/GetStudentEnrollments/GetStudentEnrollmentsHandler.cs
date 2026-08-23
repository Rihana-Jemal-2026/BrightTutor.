using AutoMapper;
using BrightTutor.Application.Abstractions.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Application.Enrollments.Queries.GetStudentEnrollments;

public class GetStudentEnrollmentsHandler : IRequestHandler<GetStudentEnrollmentsQuery, List<EnrollmentDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public GetStudentEnrollmentsHandler(IApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<List<EnrollmentDto>> Handle(GetStudentEnrollmentsQuery request, CancellationToken cancellationToken)
    {
        var enrollments = await _context.Enrollments
            .Include(e => e.Course)
            .Include(e => e.ClassGroup)
            .Include(e => e.Student).ThenInclude(s => s.User)
            .Where(e => e.StudentId == request.StudentId)
            .OrderByDescending(e => e.EnrollmentDate)
            .ToListAsync(cancellationToken);

        return _mapper.Map<List<EnrollmentDto>>(enrollments);
    }
}
