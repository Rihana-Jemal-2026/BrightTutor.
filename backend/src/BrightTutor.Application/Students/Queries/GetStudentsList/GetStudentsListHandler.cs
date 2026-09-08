using AutoMapper;
using BrightTutor.Application.Abstractions.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Application.Students.Queries.GetStudentsList;

public class GetStudentsListHandler : IRequestHandler<GetStudentsListQuery, List<StudentDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public GetStudentsListHandler(IApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<List<StudentDto>> Handle(GetStudentsListQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Students
            .Include(s => s.User)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.GradeLevel))
        {
            query = query.Where(s => s.GradeLevel == request.GradeLevel);
        }

        var students = await query
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync(cancellationToken);

        return _mapper.Map<List<StudentDto>>(students);
    }
}
