using BrightTutor.Application.Abstractions.Persistence;
using BrightTutor.Domain.Entities;
using BrightTutor.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Application.Students.Commands.CreateStudent;

public class CreateStudentHandler : IRequestHandler<CreateStudentCommand, CreateStudentResponse>
{
    private readonly IApplicationDbContext _context;

    public CreateStudentHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<CreateStudentResponse> Handle(CreateStudentCommand request, CancellationToken cancellationToken)
    {
        var existingEmail = await _context.Users
            .AnyAsync(u => u.Email == request.Email, cancellationToken);
        if (existingEmail)
        {
            throw new InvalidOperationException($"Email '{request.Email}' is already registered.");
        }

        var existingCode = await _context.Students
            .AnyAsync(s => s.StudentCode == request.StudentCode, cancellationToken);
        if (existingCode)
        {
            throw new InvalidOperationException($"Student code '{request.StudentCode}' already exists.");
        }

        var user = new User
        {
            FirstName = request.FirstName,
            LastName = request.LastName,
            Email = request.Email,
            PhoneNumber = request.PhoneNumber,
            Role = UserRole.Student,
            Status = UserStatus.Active,
            PasswordHash = request.Password
        };
        _context.Users.Add(user);

        var student = new Student
        {
            UserId = user.Id,
            StudentCode = request.StudentCode,
            DateOfBirth = request.DateOfBirth,
            GradeLevel = request.GradeLevel,
            ParentId = request.ParentId
        };
        _context.Students.Add(student);

        await _context.SaveChangesAsync(cancellationToken);

        return new CreateStudentResponse
        {
            StudentId = student.Id,
            UserId = user.Id,
            StudentCode = student.StudentCode,
            Email = user.Email
        };
    }
}
