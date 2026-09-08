using AutoMapper;
using BrightTutor.Application.Abstractions.Persistence;
using BrightTutor.Application.Attendance.Dtos;
using BrightTutor.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Application.Attendance.Queries;

public class GetGroupAttendanceQuery : IRequest<List<GetGroupAttendanceResponse>>
{
    public Guid ClassGroupId { get; set; }
    public DateOnly AttendanceDate { get; set; }
    public Guid? TeacherId { get; set; }
}

public class GetGroupAttendanceHandler
    : IRequestHandler<GetGroupAttendanceQuery, List<GetGroupAttendanceResponse>>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public GetGroupAttendanceHandler(IApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<List<GetGroupAttendanceResponse>> Handle(
        GetGroupAttendanceQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Attendances
            .Include(a => a.Student).ThenInclude(st => st.User)
            .Include(a => a.Teacher).ThenInclude(t => t.User)
            .Include(a => a.ClassGroup)
            .AsQueryable();

        if (request.TeacherId.HasValue && request.TeacherId.Value != Guid.Empty)
        {
            query = query.Where(a => a.TeacherId == request.TeacherId.Value || (a.Teacher != null && a.Teacher.UserId == request.TeacherId.Value));
        }

        if (request.ClassGroupId != Guid.Empty)
        {
            query = query.Where(a => a.ClassGroupId == request.ClassGroupId);
        }

        if (request.AttendanceDate != default)
        {
            query = query.Where(a => a.AttendanceDate == request.AttendanceDate);
        }

        var attendances = await query.ToListAsync(cancellationToken);

        return attendances.Select(a => new GetGroupAttendanceResponse
        {
            Id = a.Id,
            StudentId = a.StudentId,
            StudentName = a.Student?.User != null ? $"{a.Student.User.FirstName} {a.Student.User.LastName}" : "Student",
            TeacherName = a.Teacher?.User != null ? $"{a.Teacher.User.FirstName} {a.Teacher.User.LastName}" : "Teacher",
            ClassGroupName = a.ClassGroup?.Name ?? (a.AttendanceType == AttendanceType.Home ? "Home Tutoring" : a.AttendanceType == AttendanceType.Online ? "1-on-1 Online" : "General Class"),
            AttendanceType = a.AttendanceType,
            Status = a.Status,
            AttendanceDate = a.AttendanceDate,
            Notes = a.Notes
        }).ToList();
    }
}
