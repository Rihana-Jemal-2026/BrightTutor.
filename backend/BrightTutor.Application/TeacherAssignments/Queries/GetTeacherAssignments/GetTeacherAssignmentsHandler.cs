using AutoMapper;
using BrightTutor.Application.Abstractions.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Application.TeacherAssignments.Queries.GetTeacherAssignments;

public class GetTeacherAssignmentsHandler : IRequestHandler<GetTeacherAssignmentsQuery, List<TeacherAssignmentDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public GetTeacherAssignmentsHandler(IApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<List<TeacherAssignmentDto>> Handle(GetTeacherAssignmentsQuery request, CancellationToken cancellationToken)
    {
        var assignments = await _context.TeacherAssignments
            .Include(a => a.Course)
            .Include(a => a.ClassGroup)
            .Include(a => a.Teacher).ThenInclude(t => t.User)
            .Where(a => a.TeacherId == request.TeacherId)
            .OrderByDescending(a => a.StartDate)
            .ToListAsync(cancellationToken);

        return _mapper.Map<List<TeacherAssignmentDto>>(assignments);
    }
}
