using BrightTutor.Application.Abstractions.Authentication;
using BrightTutor.Application.Abstractions.Persistence;
using BrightTutor.Domain.Entities;
using BrightTutor.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Application.Users.Commands.CreateUser;

public class CreateUserHandler : IRequestHandler<CreateUserCommand, CreateUserResponse>
{
    private readonly IApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;

    public CreateUserHandler(IApplicationDbContext context, IPasswordHasher passwordHasher)
    {
        _context = context;
        _passwordHasher = passwordHasher;
    }

    public async Task<CreateUserResponse> Handle(CreateUserCommand request, CancellationToken cancellationToken)
    {
        var existingUser = await _context.Users
            .AnyAsync(u => u.Email == request.Email, cancellationToken);

        if (existingUser)
        {
            throw new InvalidOperationException($"User with email '{request.Email}' already exists.");
        }

        var passwordHash = string.IsNullOrWhiteSpace(request.Password)
            ? _passwordHasher.HashPassword("DefaultPass123!")
            : _passwordHasher.HashPassword(request.Password);

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

        // Create corresponding entity based on role
        var randomCodeSuffix = new Random().Next(100000, 999999).ToString();
        switch (request.Role)
        {
            case UserRole.Teacher:
                _context.Teachers.Add(new Teacher
                {
                    UserId = user.Id,
                    TeacherCode = $"TCH-{randomCodeSuffix}"
                });
                break;
            case UserRole.Student:
                _context.Students.Add(new Student
                {
                    UserId = user.Id,
                    StudentCode = $"STD-{randomCodeSuffix}"
                });
                break;
            case UserRole.Parent:
                _context.Parents.Add(new Parent
                {
                    UserId = user.Id,
                    ParentCode = $"PRN-{randomCodeSuffix}"
                });
                break;
            case UserRole.Admin:
                _context.Admins.Add(new Admin
                {
                    UserId = user.Id,
                    AdminCode = $"ADM-{randomCodeSuffix}"
                });
                break;
        }

        await _context.SaveChangesAsync(cancellationToken);

        return new CreateUserResponse
        {
            Id = user.Id,
            Email = user.Email,
            Role = user.Role,
            Status = user.Status
        };
    }
}
