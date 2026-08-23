using BrightTutor.Application.Abstractions.Authentication;
using BrightTutor.Application.Abstractions.Persistence;
using BrightTutor.Domain.Entities;
using BrightTutor.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Application.Auth.Commands.Register;

public class RegisterHandler : IRequestHandler<RegisterCommand, RegisterResponse>
{
    private readonly IApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;

    public RegisterHandler(IApplicationDbContext context, IPasswordHasher passwordHasher)
    {
        _context = context;
        _passwordHasher = passwordHasher;
    }

    public async Task<RegisterResponse> Handle(RegisterCommand request, CancellationToken cancellationToken)
    {
        var emailExists = await _context.Users
            .AnyAsync(u => u.Email == request.Email, cancellationToken);

        if (emailExists)
        {
            throw new InvalidOperationException($"User with email '{request.Email}' already exists.");
        }

        var passwordHash = _passwordHasher.HashPassword(request.Password);

        var user = new User
        {
            FirstName = request.FirstName,
            LastName = request.LastName,
            Email = request.Email,
            PhoneNumber = request.PhoneNumber,
            Role = request.Role,
            Status = UserStatus.Active,
            PasswordHash = passwordHash
        };

        _context.Users.Add(user);

        // Auto-create role profile matching the created user role
        if (request.Role == UserRole.Student)
        {
            _context.Students.Add(new Student
            {
                UserId = user.Id,
                StudentCode = $"STU-{DateTime.UtcNow.Ticks.ToString()[^6..]}"
            });
        }
        else if (request.Role == UserRole.Teacher)
        {
            _context.Teachers.Add(new Teacher
            {
                UserId = user.Id,
                TeacherCode = $"TCH-{DateTime.UtcNow.Ticks.ToString()[^6..]}"
            });
        }
        else if (request.Role == UserRole.Admin)
        {
            _context.Admins.Add(new Admin
            {
                UserId = user.Id,
                AdminCode = $"ADM-{DateTime.UtcNow.Ticks.ToString()[^6..]}"
            });
        }
        else if (request.Role == UserRole.Parent)
        {
            _context.Parents.Add(new Parent
            {
                UserId = user.Id,
                ParentCode = $"PRN-{DateTime.UtcNow.Ticks.ToString()[^6..]}"
            });
        }

        await _context.SaveChangesAsync(cancellationToken);

        return new RegisterResponse
        {
            UserId = user.Id,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Role = user.Role,
            CreatedAt = user.CreatedAt
        };
    }
}
