using BrightTutor.Application.Abstractions.Authentication;
using BrightTutor.Application.Abstractions.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Application.Auth.Commands.Login;

public class LoginHandler : IRequestHandler<LoginCommand, LoginResponse>
{
    private readonly IApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;

    public LoginHandler(
        IApplicationDbContext context,
        IPasswordHasher passwordHasher,
        IJwtTokenGenerator jwtTokenGenerator)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _jwtTokenGenerator = jwtTokenGenerator;
    }

    public async Task<LoginResponse> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email, cancellationToken);

        if (user == null)
        {
            throw new InvalidOperationException("Incorrect email or password.");
        }

        if (user.Status != Domain.Enums.UserStatus.Active)
        {
            throw new InvalidOperationException("Your account is deactivated or unassigned. Please contact system administrator.");
        }

        var isPasswordValid = _passwordHasher.VerifyPassword(request.Password, user.PasswordHash);
        if (!isPasswordValid)
        {
            throw new InvalidOperationException("Incorrect email or password.");
        }

        var token = _jwtTokenGenerator.GenerateToken(user);

        return new LoginResponse
        {
            Token = token,
            UserId = user.Id,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Role = user.Role,
            ExpiresAt = DateTime.UtcNow.AddHours(24)
        };
    }
}
