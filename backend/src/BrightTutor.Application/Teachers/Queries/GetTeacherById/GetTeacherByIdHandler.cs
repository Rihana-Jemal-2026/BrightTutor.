using AutoMapper;
using BrightTutor.Application.Abstractions.Persistence;
using BrightTutor.Application.Teachers.Queries.GetTeachersList;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Application.Teachers.Queries.GetTeacherById;

public class GetTeacherByIdHandler : IRequestHandler<GetTeacherByIdQuery, TeacherDto?>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public GetTeacherByIdHandler(IApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<TeacherDto?> Handle(GetTeacherByIdQuery request, CancellationToken cancellationToken)
    {
        var teacher = await _context.Teachers
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.Id == request.TeacherId, cancellationToken);

        if (teacher == null) return null;

        return _mapper.Map<TeacherDto>(teacher);
    }
}
