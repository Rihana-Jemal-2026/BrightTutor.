using AutoMapper;
using BrightTutor.Application.Abstractions.Persistence;
using BrightTutor.Application.Students.Queries.GetStudentsList;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Application.Students.Queries.GetStudentById;

public class GetStudentByIdHandler : IRequestHandler<GetStudentByIdQuery, StudentDto?>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public GetStudentByIdHandler(IApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<StudentDto?> Handle(GetStudentByIdQuery request, CancellationToken cancellationToken)
    {
        var student = await _context.Students
            .Include(s => s.User)
            .FirstOrDefaultAsync(s => s.Id == request.StudentId, cancellationToken);

        if (student == null) return null;

        return _mapper.Map<StudentDto>(student);
    }
}
