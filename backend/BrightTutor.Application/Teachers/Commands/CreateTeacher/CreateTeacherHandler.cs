using BrightTutor.Application.Abstractions.Persistence;
using BrightTutor.Domain.Entities;
using BrightTutor.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Application.Teachers.Commands.CreateTeacher;

public class CreateTeacherHandler : IRequestHandler<CreateTeacherCommand, CreateTeacherResponse>
{
    private readonly IApplicationDbContext _context;

    public CreateTeacherHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<CreateTeacherResponse> Handle(CreateTeacherCommand request, CancellationToken cancellationToken)
    {
        var existingEmail = await _context.Users
            .AnyAsync(u => u.Email == request.Email, cancellationToken);
        if (existingEmail)
        {
            throw new InvalidOperationException($"Email '{request.Email}' is already registered.");
        }

        var existingCode = await _context.Teachers
            .AnyAsync(t => t.TeacherCode == request.TeacherCode, cancellationToken);
        if (existingCode)
        {
            throw new InvalidOperationException($"Teacher code '{request.TeacherCode}' already exists.");
        }

        var user = new User
        {
            FirstName = request.FirstName,
            LastName = request.LastName,
            Email = request.Email,
            PhoneNumber = request.PhoneNumber,
            Role = UserRole.Teacher,
            Status = UserStatus.Active,
            PasswordHash = request.Password
        };
        _context.Users.Add(user);

        var teacher = new Teacher
        {
            UserId = user.Id,
            TeacherCode = request.TeacherCode,
            Specialization = request.Specialization
        };
        _context.Teachers.Add(teacher);

        await _context.SaveChangesAsync(cancellationToken);

        return new CreateTeacherResponse
        {
            TeacherId = teacher.Id,
            UserId = user.Id,
            TeacherCode = teacher.TeacherCode,
            Email = user.Email
        };
    }
}
